// src/components/FriendChatDropdown.jsx
import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import useFriendChatStore from '../../stores/useFriendChatStore';
import { NotificationContext } from '../../hooks/NotificationContext';
import { fetchChatRooms } from '../../api/chatAPI';
import {
    acceptFriendRequest,
    declineFriendRequest,
    getFriendRequestList,
    getUserInfo
} from '../../api/userAPI';
import useFriendListStore from '../../stores/useFriendListStore';

const FriendChatDropdown = () => {
    const { user } = useAuthStore();
    const { openFriendChat } = useFriendChatStore();
    const { notifications, removeNotification } = useContext(NotificationContext);
    const addFriend    = useFriendListStore((s) => s.addFriend);
    const setAuthUser = useAuthStore((s) => s.setUser);

    const [showDropdown, setShowDropdown] = useState(false);
    const [friendRooms, setFriendRooms] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);


    /* ---------------- 친구 채팅방 ---------------- */
    const loadRooms = useCallback(async () => {
        if (!user?._id) return;
        try {
            const rooms = await fetchChatRooms({ roomType: 'friend' });
            const mapped = rooms.map((r) => ({
                roomId: r._id,
                friend: r.chatUsers.find((u) => u._id !== user._id),
            }));
            setFriendRooms(mapped);
        } catch (e) {
            console.error('친구 채팅방 조회 실패', e);
        }
    }, [user]);

    // ⛔ async 함수를 effect 콜백으로 넘기지 않는다
    useEffect(() => {
        loadRooms();
    }, [loadRooms]);

    /* ---------------- 서버 저장 친구-요청 ---------------- */
    const loadFriendReqFromServer = useCallback(async () => {
        if (!user?._id) return;
        try {
            const list = await getFriendRequestList(user._id);
            setFriendRequests(list);

            // 이미 DB에 반영된 요청이면 알림에서 제거
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

    /* ---------------- 실시간 알림 → friendRequests 머지 ---------------- */
    useEffect(() => {
        const incoming = notifications
            .filter(n => n.type === 'FRIEND_REQUEST')
            .map((n, idx) => ({
                _id: n.requestId,
                sender: {                            // ✅ 최소 _id 포함하도록 매핑
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

    /* ---------------- 수락 / 거절 ---------------- */
    const afterHandled = (reqId, notiIdx) => {
        setFriendRequests((prev) => prev.filter((r) => r._id !== reqId));
        if (typeof notiIdx === 'number') removeNotification(notiIdx);
    };

    const handleAccept = async (reqId, notiIdx) => {
        try {
            await acceptFriendRequest(user._id, reqId);
            afterHandled(reqId, notiIdx);

            /* ==== 새 친구 정보 받아서 리스트에 즉시 추가 ==== */
            const accepted = friendRequests.find((r) => r._id === reqId);   // 요청 객체
            if (accepted?.sender?._id) {
                const friendInfo = await getUserInfo(accepted.sender._id);   // [3]
                addFriend(friendInfo);
                setAuthUser({
                    ...user,
                    friends: [...(user?.friends || []), friendInfo._id],
                });
            } else {
                // _id 가 없으면 전체 친구 목록을 다시 받아서 동기화
                await loadFriendReqFromServer();        // 요청 목록 재조회
                await loadRooms();                      // 채팅방 재조회
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



    /* ---------------- 렌더 ---------------- */
    const hasBadge =
        notifications.length > 0 || friendRooms.length > 0 || friendRequests.length > 0;

    return (
        <div className="relative">
            {hasBadge && (
                <button
                    onClick={() => setShowDropdown((p) => !p)}
                    className="py-1 px-3 bg-green-500 hover:bg-green-600 rounded text-sm"
                >
                    친구
                </button>
            )}

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded shadow-lg p-3 text-black z-50">
                    {/* ===== 친구 요청 ===== */}
                    <h3 className="text-sm font-semibold mb-2">친구 요청</h3>

                    {friendRequests.length === 0 && (
                        <p className="text-xs text-gray-500 py-4 text-center">
                            도착한 친구 요청이 없습니다.
                        </p>
                    )}

                    {friendRequests.map((req) => (
                        <div
                            key={req._id}
                            className="flex items-center justify-between py-1 border-b last:border-b-0"
                        >
              <span className="text-sm truncate">
                {req.sender?.nickname || '알 수 없음'}
              </span>

                            <div className="space-x-1">
                                <button
                                    onClick={() => handleAccept(req._id, req._notiIdx)}
                                    className="bg-blue-500 hover:bg-blue-600 text-xs px-2 py-1 rounded text-white"
                                >
                                    수락
                                </button>
                                <button
                                    onClick={() => handleDecline(req._id, req._notiIdx)}
                                    className="bg-gray-300 hover:bg-gray-400 text-xs px-2 py-1 rounded"
                                >
                                    거절
                                </button>
                            </div>
                        </div>
                    ))}



                    {/* ===== 친구 채팅 ===== */}
                    <h3 className="text-sm font-semibold mt-3 mb-1">친구 채팅</h3>
                    {friendRooms.length > 0 ? (
                        friendRooms.map(({ roomId, friend }) => (
                            <div
                                key={roomId}
                                onClick={() => openFriendChat({ roomId, friend })}
                                className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm"
                            >
                                {friend.nickname || friend.name}
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-gray-500 py-4 text-center">채팅방이 없습니다.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default FriendChatDropdown;
