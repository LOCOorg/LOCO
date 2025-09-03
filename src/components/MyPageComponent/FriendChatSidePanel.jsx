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

/* === 아이콘 (Heroicons 2.x) === */
import {
    UserGroupIcon,
    CheckIcon,
    XMarkIcon,
    ChatBubbleLeftEllipsisIcon,
    UserPlusIcon,
} from '@heroicons/react/24/solid';
import { XMarkIcon as XMarkOutlineIcon } from '@heroicons/react/24/outline';
import ProfileButton from "./ProfileButton.jsx";
import FriendListPanel from "./FriendListPanel.jsx";

const FriendChatSidePanel = () => {
    /* --------------- 상태 / 스토어 --------------- */
    const { user, setUser: setAuthUser } = useAuthStore();
    const { openFriendChat, swapFriendChat, friendRooms, setFriendRooms } = useFriendChatStore();
    const addFriend = useFriendListStore((s) => s.addFriend);
    const { notifications, removeNotification } = useContext(NotificationContext);
    const [showPanel, setShowPanel] = useState(false);
    const [friendRequests, setFriendRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('friendlist'); // 'friendlist' 또는 'requests'
    const panelRef = useRef(null);

    /* --------------- 바깥 클릭 시 닫기 --------------- */
    useEffect(() => {
        if (!showPanel) return;
        const handlePointerDown = (e) => {
            const clickedInsidePanel = panelRef.current && panelRef.current.contains(e.target);
            const modalRoot = document.getElementById('modal-root');
            const clickedInsideModal = modalRoot && modalRoot.contains(e.target);

            // ChatOverlay 영역 클릭 체크 추가
            const chatOverlayElements = document.querySelectorAll('.chat-overlay-container');
            const clickedInsideChatOverlay = Array.from(chatOverlayElements).some(overlay =>
                overlay.contains(e.target)
            );

            // 사이드패널, 모달, ChatOverlay 외부 클릭시에만 패널 닫기
            if (!clickedInsidePanel && !clickedInsideModal && !clickedInsideChatOverlay) {
                setShowPanel(false);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [showPanel]);

    // 기존 로직들 유지...
    const loadRooms = useCallback(async () => {
        if (!user?._id) return;
        try {
            const rooms = await fetchChatRooms({ roomType: 'friend' });
            const myRooms = rooms.filter((r) => r.chatUsers.some((u) => u._id === user._id));
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

    const loadFriendReqFromServer = useCallback(async () => {
        if (!user?._id) return;
        try {
            const list = await getFriendRequestList(user._id);
            setFriendRequests(list);
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

    const afterHandled = (reqId, notiIdx) => {
        setFriendRequests((prev) => prev.filter((r) => r._id !== reqId));
        if (typeof notiIdx === 'number') removeNotification(notiIdx);
    };

    const handleAccept = async (reqId, notiIdx) => {
        try {
            await acceptFriendRequest(user._id, reqId);
            afterHandled(reqId, notiIdx);
            const accepted = friendRequests.find((r) => r._id === reqId);
            if (accepted?.sender?._id) {
                const friendInfo = await getUserInfo(accepted.sender._id);
                addFriend(friendInfo);
                setAuthUser({
                    ...user,
                    friends: [...(user?.friends || []), friendInfo._id],
                });
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

    const MAX_CHAT_WINDOWS = 3;
    const handleOpenChat = (room) => {
        openFriendChat(room);
        swapFriendChat(room.roomId, MAX_CHAT_WINDOWS);
    };

    useEffect(() => {
        loadRooms();
    }, [loadRooms]);

    useEffect(() => {
        loadFriendReqFromServer();
    }, [loadFriendReqFromServer]);

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

    const badgeCnt = friendRequests.length;

    return (
        <>
            {/* 패널 열기 버튼 */}
            <div className="relative">
                <button
                    onClick={() => setShowPanel(!showPanel)}
                    className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <UserGroupIcon className="w-6 h-6" />
                    {badgeCnt > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {badgeCnt > 9 ? '9+' : badgeCnt}
            </span>
                    )}
                </button>
            </div>

            {/* 사이드패널 */}
            {showPanel && (
                <>
                    {/* 사이드패널 컨테이너 */}
                    <div
                        ref={panelRef}
                        className="fixed right-0 top-0 h-full w-[800px] bg-white shadow-2xl z-50 flex"
                    >
                        {/* 왼쪽: 채팅 영역 */}
                        <div className="w-1/2 border-r border-gray-200 flex flex-col">
                            <div className="p-4 border-b bg-gray-50">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
                                    채팅
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {friendRooms.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <ChatBubbleLeftEllipsisIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                        <p className="text-lg font-medium mb-2">활성화된 채팅방이 없습니다</p>
                                        <p className="text-sm">친구와 채팅을 시작해보세요</p>
                                    </div>
                                ) : (
                                    friendRooms.map((room) => (
                                        <div
                                            key={room.roomId}
                                            onClick={() => handleOpenChat(room)}
                                            className="w-full flex items-center gap-3 p-4 bg-white border rounded-lg hover:shadow-sm hover:border-blue-300 transition-all text-left cursor-pointer"
                                        >
                                            <ProfileButton profile={room.friend} size="md" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">
                                                    {room.friend?.nickname || '알 수 없음'}
                                                </p>
                                                <p className="text-sm text-gray-500">채팅하기</p>
                                            </div>
                                            <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-gray-400" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* 오른쪽: 친구목록/친구요청 탭 영역 */}
                        <div className="w-1/2 flex flex-col">
                            {/* 탭 헤더 */}
                            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setActiveTab('friendlist')}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                            activeTab === 'friendlist'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        <UserGroupIcon className="w-4 h-4" />
                                        친구 목록
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('requests')}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                                            activeTab === 'requests'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        <UserPlusIcon className="w-4 h-4" />
                                        친구 요청
                                        {badgeCnt > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {badgeCnt > 9 ? '9+' : badgeCnt}
                      </span>
                                        )}
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShowPanel(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-lg"
                                >
                                    <XMarkOutlineIcon className="w-5 h-5" />
                                </button>
                            </div>

                            {/* 탭 컨텐츠 */}
                            <div className="flex-1 overflow-hidden">
                                {activeTab === 'friendlist' && (
                                    <div className="h-full">
                                        <FriendListPanel />
                                    </div>
                                )}

                                {activeTab === 'requests' && (
                                    <div className="p-4 space-y-3 h-full overflow-y-auto">
                                        {friendRequests.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500">
                                                <UserPlusIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                                <p className="text-lg font-medium mb-2">새로운 친구 요청이 없습니다</p>
                                                <p className="text-sm">친구 요청이 오면 여기에 표시됩니다</p>
                                            </div>
                                        ) : (
                                            friendRequests.map((req) => (
                                                <div
                                                    key={req._id}
                                                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border"
                                                >
                                                    <ProfileButton profile={req.sender} size="sm"
                                                                   area='친구요청'
                                                                   requestId={req._id}           // ✔ 요청 id 전달
                                                                   onAccept={() => handleAccept(req._id, req._notiIdx)}
                                                                   onDecline={() => handleDecline(req._id, req._notiIdx)}/>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 truncate">
                                                            {req.sender?.nickname || '알 수 없음'}
                                                        </p>
                                                        <p className="text-sm text-gray-500">친구 요청을 보냈습니다</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAccept(req._id, req._notiIdx)}
                                                            className="px-3 py-2 text-sm bg-green-500 text-white hover:bg-green-600 rounded-md transition-colors flex items-center gap-1"
                                                        >
                                                            <CheckIcon className="w-4 h-4" />
                                                            수락
                                                        </button>
                                                        <button
                                                            onClick={() => handleDecline(req._id, req._notiIdx)}
                                                            className="px-3 py-2 text-sm bg-red-500 text-white hover:bg-red-600 rounded-md transition-colors flex items-center gap-1"
                                                        >
                                                            <XMarkIcon className="w-4 h-4" />
                                                            거절
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default FriendChatSidePanel;
