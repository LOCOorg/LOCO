import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import useAuthStore from '../../stores/authStore';
import useFriendChatStore from '../../stores/useFriendChatStore';
import { NotificationContext } from '../../hooks/NotificationContext';
import { fetchChatRooms } from '../../api/chatAPI';
import {
    acceptFriendRequest,
    declineFriendRequest,
    getFriendRequestList,
    getUserInfo,
} from '../../api/userAPI';
import useFriendListStore from '../../stores/useFriendListStore';
import DropdownTransition from '../../layout/css/DropdownTransition.jsx';

/* === 아이콘 (Heroicons 2.x) === */
import {
    UserGroupIcon,
    CheckIcon,
    XMarkIcon,
    ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/24/solid';
import ProfileButton from "./ProfileButton.jsx";

const FriendChatDropdown = () => {
    /* --------------- 상태 / 스토어 --------------- */
    const { user, setUser: setAuthUser } = useAuthStore();
    const { openFriendChat, swapFriendChat, friendRooms, setFriendRooms } =
        useFriendChatStore();
    const addFriend = useFriendListStore((s) => s.addFriend);
    const { notifications, removeNotification } = useContext(NotificationContext);

    const [showDropdown, setShowDropdown] = useState(false);
    const [friendRequests, setFriendRequests] = useState([]);

    const dropdownRef = useRef(null);

    /* --------------- 바깥 클릭 시 닫기 --------------- */
    useEffect(() => {
        if (!showDropdown) return;

        const handlePointerDown = (e) => {
            const clickedInsideDropdown =
                dropdownRef.current && dropdownRef.current.contains(e.target);

            // 모달이 포털로 렌더링되는 DOM 노드(예: id="modal-root")
            const modalRoot = document.getElementById('modal-root');
            const clickedInsideModal = modalRoot && modalRoot.contains(e.target);

            if (!clickedInsideDropdown && !clickedInsideModal) {
                setShowDropdown(false);
            }
        };

        // mousedown 대신 pointerdown 사용
        document.addEventListener('pointerdown', handlePointerDown);
        return () =>
            document.removeEventListener('pointerdown', handlePointerDown);
    }, [showDropdown]);

    /* --------------- 친구 채팅방 로딩 --------------- */
    const loadRooms = useCallback(async () => {
        if (!user?._id) return;
        try {
            const rooms = await fetchChatRooms({ roomType: 'friend' });
            const myRooms = rooms.filter((r) =>
                r.chatUsers.some((u) => u._id === user._id)
            );
            const mapped = myRooms
                .filter((r) => r.isActive)
                .map((r) => ({
                    roomId: r._id,
                    friend: r.chatUsers.find((u) => u._id !== user._id),
                }));
            setFriendRooms(mapped);
        } catch (e) {
            console.error('친구 채팅방 조회 실패', e);
        }
    }, [user, setFriendRooms]);

    useEffect(() => {
        loadRooms();
    }, [loadRooms]);

    /* --------------- 서버에 저장된 친구 요청 로딩 --------------- */
    const loadFriendReqFromServer = useCallback(async () => {
        if (!user?._id) return;
        try {
            const list = await getFriendRequestList(user._id);
            setFriendRequests(list);

            /* DB 에 이미 반영된 알림은 제거 */
            list.forEach((r) => {
                const idx = notifications.findIndex(
                    (n) => n.type === 'FRIEND_REQUEST' && n.requestId === r._id
                );
                if (idx !== -1) removeNotification(idx);
            });
        } catch (e) {
            console.error('친구 요청 목록 조회 실패', e);
        }
    }, [user, notifications, removeNotification]);

    useEffect(() => {
        loadFriendReqFromServer();
    }, [loadFriendReqFromServer]);

    /* --------------- 실시간 알림 → 요청 배열에 머지 --------------- */
    useEffect(() => {
        const incoming = notifications
            .filter((n) => n.type === 'FRIEND_REQUEST')
            .map((n, idx) => ({
                _id: n.requestId,
                sender: {
                    _id: n.senderId || n.sender?._id,
                    nickname: n.senderNickname || n.sender?.nickname,
                },
                _notiIdx: idx,
            }));

        setFriendRequests((prev) => {
            const ids = new Set(prev.map((r) => r._id));
            const merged = [...prev];
            incoming.forEach((r) => {
                if (!ids.has(r._id)) merged.unshift(r);
            });
            return merged;
        });
    }, [notifications]);

    /* --------------- 요청 수락 / 거절 --------------- */
    const afterHandled = (reqId, notiIdx) => {
        setFriendRequests((prev) => prev.filter((r) => r._id !== reqId));
        if (typeof notiIdx === 'number') removeNotification(notiIdx);
    };

    const handleAccept = async (reqId, notiIdx) => {
        try {
            await acceptFriendRequest(user._id, reqId);
            afterHandled(reqId, notiIdx);

            /* 새 친구 정보를 받아와 즉시 반영 */
            const accepted = friendRequests.find((r) => r._id === reqId);
            if (accepted?.sender?._id) {
                const friendInfo = await getUserInfo(accepted.sender._id);
                addFriend(friendInfo);
                setAuthUser({
                    ...user,
                    friends: [...(user?.friends || []), friendInfo._id],
                });
            } else {
                await loadFriendReqFromServer();
                await loadRooms();
            }
        } catch (e) {
            console.error('친구 요청 수락 실패', e);
        }
    };

    const handleDecline = async (reqId, notiIdx) => {
        try {
            await declineFriendRequest(user._id, reqId);
            afterHandled(reqId, notiIdx);
        } catch (e) {
            console.error('친구 요청 거절 실패', e);
        }
    };

    /* --------------- 채팅창 열기 --------------- */
    const MAX_CHAT_WINDOWS = 3;
    const handleOpenChat = (room) => {
        openFriendChat(room);
        swapFriendChat(room.roomId, MAX_CHAT_WINDOWS);
    };

    /* ------------------------------------------------------------------ */
    /* ------------------------------- UI -------------------------------- */
    /* ------------------------------------------------------------------ */
    const badgeCnt = friendRequests.length;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* === 친구 버튼 === */}
                <button
                    onClick={() => setShowDropdown((p) => !p)}
                    className="relative flex items-center gap-1 rounded-full bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:bg-green-600"
                >
                    <UserGroupIcon className="h-4 w-4" />
                    친구
                    {badgeCnt > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
              {badgeCnt}
            </span>
                    )}
                </button>


            {/* === 드롭다운 === */}
            <DropdownTransition
                show={showDropdown}
                as="div"
                className="absolute top-full right-0 mt-2 w-72 max-h-[calc(100vh-10rem)] overflow-hidden rounded-xl
                bg-white shadow-xl ring-1 ring-black/5 z-50"
            >
                <div className="flex h-full flex-col divide-y divide-gray-200 min-h-0">
                    {/* ===== 친구 요청 ===== */}
                    <section className="shrink-0 overflow-y-auto custom-scroll">
                        <h3 className="sticky top-0 z-10 bg-white px-4 py-2 text-xs font-semibold text-gray-700">
                            친구 요청
                        </h3>

                        {friendRequests.length === 0 && (
                            <p className="flex flex-col items-center justify-center gap-1 py-6 text-xs text-gray-400">
                                <UserGroupIcon className="h-6 w-6 opacity-40" />
                                도착한 친구 요청이 없습니다.
                            </p>
                        )}

                        {friendRequests.map((req) => (
                            <article
                                key={req._id}
                                className="group flex items-center justify-between gap-2 px-4 py-2 hover:bg-gray-50"
                            >
                                {/* 아바타 + 닉네임 */}
                                <div className="flex items-center gap-2">
                                    <ProfileButton
                                        profile={{ _id: req.sender._id, nickname: req.sender.nickname }}
                                        area='친구요청'
                                        requestId={req._id}           // ✔ 요청 id 전달
                                        onAccept={() => handleAccept(req._id, req._notiIdx)}
                                        onDecline={() => handleDecline(req._id, req._notiIdx)}
                                    />
                                    <span className="max-w-[8rem] truncate text-sm font-medium text-gray-800">
                                        {req.sender?.nickname || '알 수 없음'}
                                    </span>
                                </div>

                                {/* 수락 / 거절 */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleAccept(req._id, req._notiIdx)}
                                        className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white transition hover:bg-blue-600"
                                    >
                                        <CheckIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDecline(req._id, req._notiIdx)}
                                        className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-300 text-gray-700 transition hover:bg-gray-400"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </section>

                    {/* ===== 친구 채팅 ===== */}
                    <section className="flex-1 min-h-0 overflow-y-auto custom-scroll">
                        <h3 className="sticky top-0 z-10 bg-white px-4 py-2 text-xs font-semibold text-gray-700">
                            친구 채팅
                        </h3>

                        {friendRooms.length === 0 ? (
                            <p className="flex flex-col items-center justify-center gap-1 py-6 text-xs text-gray-400">
                                <ChatBubbleLeftEllipsisIcon className="h-6 w-6 opacity-40" />
                                채팅방이 없습니다.
                            </p>
                        ) : (
                            friendRooms
                                .filter(({ friend }) => friend) // undefined friend 제거
                                .map(({ roomId, friend }) => (
                                <button
                                    key={roomId}
                                    onClick={() => handleOpenChat({ roomId, friend })}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left transition hover:bg-gray-50"
                                >
                                    <span className="truncate text-sm text-gray-800">
                    {friend?.nickname || friend?.name || '알 수 없는 사용자'}
                  </span>
                                </button>
                            ))
                        )}
                    </section>
                </div>
            </DropdownTransition>
        </div>
    );
};

export default FriendChatDropdown;
