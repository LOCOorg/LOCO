import { useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import useAuthStore from '../../stores/authStore';
import useFriendChatStore from '../../stores/useFriendChatStore';
import { NotificationContext } from '../../hooks/NotificationContext';
import { fetchChatRooms, fetchMessages, markRoomAsRead, getUnreadCount, recordRoomEntry } from '../../api/chatAPI';
import { useSocket } from '../../hooks/useSocket';
import {
    acceptFriendRequest,
    declineFriendRequest,
    getFriendRequestList,
    getUserInfo,
} from '../../api/userAPI';
import useFriendListStore from '../../stores/useFriendListStore';
import {
    UserGroupIcon,
    CheckIcon,
    XMarkIcon,
    ChatBubbleLeftEllipsisIcon,
    UserPlusIcon,
    ArrowLeftIcon,
} from '@heroicons/react/24/solid';
import { XMarkIcon as XMarkOutlineIcon } from '@heroicons/react/24/outline';
import ProfileButton from "./ProfileButton.jsx";
import FriendListPanel from "./FriendListPanel.jsx";
import ChatOverlay from "../chatcomponents/ChatOverlay.jsx";
import { filterProfanity } from '../../utils/profanityFilter.js';
import useNotificationStore from '../../stores/notificationStore.js';

const FriendChatSidePanel = () => {
    // ✅ 모든 hooks를 최상위에서 먼저 호출
    const { user, setUser: setAuthUser } = useAuthStore();
    const {
        friendRooms,
        setFriendRooms,
        roomSummaries,
        setRoomSummaries,
        setRoomSummary,
        updateRoomMessage,
        markRoomAsRead: markRoomAsReadStore,
        setSidePanelOpen,
        setSelectedRoomId,
        setActiveRightTab,
        shouldOpenPanel,
        targetRoomId,
        targetFriendInfo,
        clearOpenSignal
    } = useFriendChatStore();

    const socket = useSocket();
    const addFriend = useFriendListStore((s) => s.addFriend);
    const { notifications, removeNotification } = useContext(NotificationContext);
    const wordFilterEnabled = useNotificationStore(state => state.wordFilterEnabled);

    const [showPanel, setShowPanel] = useState(false);
    const [friendRequests, setFriendRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('friendlist');
    const [activeRightTab, setActiveRightTabLocal] = useState('chatlist');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const panelRef = useRef(null);

    // ✅ 총 안읽은 메시지 개수 계산 (메모이제이션으로 성능 최적화)
    const totalUnreadCount = useMemo(() => {
        if (!roomSummaries || Object.keys(roomSummaries).length === 0) return 0;

        return Object.values(roomSummaries).reduce((total, summary) => {
            return total + (summary?.unreadCount || 0);
        }, 0);
    }, [roomSummaries]);

    // ✅ 전체 배지 개수 계산 (친구 요청 + 안읽은 메시지)
    const badgeCnt = useMemo(() => {
        const friendRequestCount = friendRequests?.length || 0;
        return friendRequestCount + totalUnreadCount;
    }, [friendRequests?.length, totalUnreadCount]);

    // 날짜/시간 포맷팅 함수
    const formatDateTime = useCallback((timestamp) => {
        if (!timestamp) return '';
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return '';

            const today = new Date();

            if (date.toDateString() === today.toDateString()) {
                return date.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
            } else {
                return date.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }).replace(/\./g, '-').replace(/-$/, '');
            }
        } catch (error) {
            console.error('날짜 포맷팅 오류:', error);
            return '';
        }
    }, []);

    // 개별 채팅방 요약 정보 업데이트 함수
    const updateRoomSummary = useCallback(async (roomId) => {
        if (!user?._id || !roomId) return;

        try {
            const data = await fetchMessages(roomId, 1, 1);
            const messages = data.messages;
            const { unreadCount } = await getUnreadCount(roomId, user._id);

            if (messages && messages.length > 0) {
                const lastMessage = messages[0];

                const summary = {
                    lastMessage: lastMessage?.text || '',
                    lastMessageTime: lastMessage?.textTime || lastMessage?.timestamp || null,
                    unreadCount: unreadCount || 0
                };

                setRoomSummary(roomId, summary);
            }
        } catch (error) {
            console.error(`채팅방 ${roomId} 요약 정보 업데이트 실패:`, error);
        }
    }, [user?._id, setRoomSummary]);

    // 전체 채팅방 요약 정보 로드
    const loadRoomSummaries = useCallback(async () => {
        if (!friendRooms || friendRooms.length === 0 || !user?._id) return;

        const summaries = {};

        for (const room of friendRooms) {
            if (!room || !room.roomId) continue;

            try {
                const data = await fetchMessages(room.roomId, 1, 1);
                const messages = data.messages;
                const { unreadCount } = await getUnreadCount(room.roomId, user._id);

                if (messages && messages.length > 0) {
                    const lastMessage = messages[0];

                    summaries[room.roomId] = {
                        lastMessage: lastMessage?.text || '',
                        lastMessageTime: lastMessage?.textTime || lastMessage?.timestamp || null,
                        unreadCount: unreadCount || 0
                    };
                } else {
                    summaries[room.roomId] = {
                        lastMessage: '메시지가 없습니다.',
                        lastMessageTime: null,
                        unreadCount: unreadCount || 0
                    };
                }
            } catch (error) {
                console.error(`채팅방 ${room.roomId} 요약 정보 로드 실패:`, error);
                summaries[room.roomId] = {
                    lastMessage: '정보 로드 실패',
                    lastMessageTime: null,
                    unreadCount: 0
                };
            }
        }

        setRoomSummaries(summaries);
    }, [friendRooms, user?._id, setRoomSummaries]);

    // 채팅방 로드
    const loadRooms = useCallback(async () => {
        if (!user?._id) return;
        try {
            const rooms = await fetchChatRooms({ roomType: 'friend' });
            if (!rooms || !Array.isArray(rooms)) return;

            const myRooms = rooms.filter((r) =>
                r?.chatUsers &&
                Array.isArray(r.chatUsers) &&
                r.chatUsers.some((u) => u?._id === user._id)
            );

            const mapped = myRooms
                .filter((r) => r?.isActive)
                .map((r) => ({
                    roomId: r._id,
                    friend: r.chatUsers?.find((u) => u?._id !== user._id),
                }))
                .filter(room => room && room.friend && room.roomId);

            setFriendRooms(mapped);
        } catch (e) {
            console.error('친구 채팅방 조회 실패', e);
        }
    }, [user?._id, setFriendRooms]);

    // 친구 요청 로드
    const loadFriendReqFromServer = useCallback(async () => {
        if (!user?._id) return;
        try {
            const list = await getFriendRequestList(user._id);
            if (!list || !Array.isArray(list)) {
                setFriendRequests([]);
                return;
            }

            setFriendRequests(list);
            list.forEach((r) => {
                if (!r?._id) return;
                const idx = notifications.findIndex(
                    (n) => n?.type === 'FRIEND_REQUEST' && n?.requestId === r._id
                );
                if (idx !== -1) removeNotification(idx);
            });
        } catch (e) {
            console.error('친구 요청 목록 조회 실패', e);
            setFriendRequests([]);
        }
    }, [user?._id, notifications, removeNotification]);

    // 메시지 전송 시 콜백
    const handleMessageSent = useCallback((roomId) => {
        if (!roomId) return;

        setTimeout(() => {
            updateRoomSummary(roomId);
        }, 100);
    }, [updateRoomSummary]);

    useEffect(() => {
        if (!socket) return;

        const handleFriendDeleted = ({ friendId, roomId }) => {
            const { user, setUser } = useAuthStore.getState();
            const { removeFriend } = useFriendListStore.getState();
            const { removeFriendRoom } = useFriendChatStore.getState();

            // 1. Remove from global friend list
            removeFriend(friendId);

            // 2. Remove from user object in auth store
            if (user && user.friends) {
                setUser({
                    ...user,
                    friends: user.friends.filter(id => id !== friendId)
                });
            }

            // 3. If a chat room was associated, remove it from the chat store
            if (roomId) {
                removeFriendRoom(roomId);
            }
        };

        socket.on('friendDeleted', handleFriendDeleted);

        return () => {
            socket.off('friendDeleted', handleFriendDeleted);
        };
    }, [socket]);

    // 실시간 메시지 수신 처리
    useEffect(() => {
        if (!socket || !user?._id || !friendRooms) return;

        const handleReceiveMessage = (message) => {
            if (!message || !message.chatRoom) return;

            const isFromFriendRoom = friendRooms.some(room =>
                room && room.roomId === message.chatRoom
            );

            if (isFromFriendRoom) {
                const senderId = message.sender?._id || message.sender?.id;
                const isFromOther = senderId !== user._id;

                // ✅ 현재 선택된 채팅방인지 확인
                const isCurrentRoom = selectedRoom?.roomId === message.chatRoom &&
                    activeRightTab === 'chat';

                if (isCurrentRoom && isFromOther) {
                    // 현재 보고 있는 채팅방의 메시지면 즉시 읽음 처리
                    setTimeout(async () => {
                        try {
                            await markRoomAsRead(message.chatRoom, user._id);
                            markRoomAsReadStore(message.chatRoom);
                            updateRoomSummary(message.chatRoom);
                        } catch (error) {
                            console.error('실시간 읽음 처리 실패:', error);
                        }
                    }, 100);

                    // 읽음 처리된 메시지로 업데이트 (unreadCount 증가 안함)
                    updateRoomMessage(message.chatRoom, {
                        text: message.text || '',
                        timestamp: message.textTime || Date.now(),
                        isFromOther: false // 읽음 처리했으므로 false
                    });
                } else {
                    // 다른 채팅방의 메시지면 정상적으로 unreadCount 증가
                    updateRoomMessage(message.chatRoom, {
                        text: message.text || '',
                        timestamp: message.textTime || Date.now(),
                        isFromOther: isFromOther
                    });
                }
            }
        };

        socket.on("receiveMessage", handleReceiveMessage);

        return () => {
            socket.off("receiveMessage", handleReceiveMessage);
        };
    }, [socket, user?._id, friendRooms, updateRoomMessage, selectedRoom, activeRightTab, markRoomAsRead, markRoomAsReadStore, updateRoomSummary]);

    useEffect(() => {
        if (!socket) return;

        const handleFriendDeleted = ({ friendId, roomId }) => {
            const { user, setUser } = useAuthStore.getState();
            const { removeFriend } = useFriendListStore.getState();
            const { removeFriendRoom, selectedRoomId, setSelectedRoomId } = useFriendChatStore.getState();

            removeFriend(friendId);

            if (user && user.friends) {
                setUser({
                    ...user,
                    friends: user.friends.filter(id => id !== friendId)
                });
            }

            if (roomId) {
                removeFriendRoom(roomId);
                if (selectedRoomId === roomId) {
                    setSelectedRoomId(null);
                }
            }
        };

        socket.on('friendDeleted', handleFriendDeleted);

        return () => {
            socket.off('friendDeleted', handleFriendDeleted);
        };
    }, [socket]);

    const { selectedRoomId: storeSelectedRoomId } = useFriendChatStore();
    useEffect(() => {
        if (storeSelectedRoomId === null) {
            setSelectedRoom(null);
        }
    }, [storeSelectedRoomId]);


    // 외부 신호로 패널 열기
    useEffect(() => {
        if (shouldOpenPanel && targetRoomId && user?._id) {
            setShowPanel(true);
            const targetRoom = friendRooms?.find(room =>
                room && room.roomId === targetRoomId
            );

            if (targetRoom) {
                handleSelectChat(targetRoom);
            } else if (targetFriendInfo) {
                const newRoom = { roomId: targetRoomId, friend: targetFriendInfo };
                setSelectedRoom(newRoom);
                setActiveRightTabLocal('chat');

                recordRoomEntry(targetRoomId, user._id).catch(console.error);
                markRoomAsReadStore(targetRoomId);
            }
            clearOpenSignal();
        }
    }, [shouldOpenPanel, targetRoomId, targetFriendInfo, friendRooms, clearOpenSignal, user?._id]);

    // 스토어 상태 동기화
    useEffect(() => setSidePanelOpen(showPanel), [showPanel, setSidePanelOpen]);
    useEffect(() => setActiveRightTab(activeRightTab), [activeRightTab, setActiveRightTab]);
    useEffect(() => setSelectedRoomId(selectedRoom?.roomId || null), [selectedRoom, setSelectedRoomId]);

    // 외부 클릭 시 패널 닫기
    useEffect(() => {
        if (!showPanel) return;
        const handlePointerDown = (e) => {
            const clickedInsidePanel = panelRef.current?.contains(e.target);
            const modalRoot = document.getElementById('modal-root');
            const clickedInsideModal = modalRoot?.contains(e.target);

            if (!clickedInsidePanel && !clickedInsideModal) {
                handleClosePanel();
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [showPanel]);

    useEffect(() => { loadRooms(); }, [loadRooms]);
    useEffect(() => { loadFriendReqFromServer(); }, [loadFriendReqFromServer]);
    useEffect(() => { loadRoomSummaries(); }, [loadRoomSummaries]);

    // 친구 요청 알림 처리
    useEffect(() => {
        if (!notifications || !Array.isArray(notifications)) return;

        const incoming = notifications
            .filter((n) => n?.type === 'FRIEND_REQUEST' && n?.requestId)
            .map((n, idx) => ({
                _id: n.requestId,
                sender: {
                    _id: n.senderId || n.sender?._id,
                    nickname: n.senderNickname || n.sender?.nickname || '알 수 없음',
                },
                _notiIdx: idx,
            }))
            .filter(req => req?._id && req?.sender?._id);

        setFriendRequests((prev) => {
            const ids = new Set((prev || []).map((r) => r?._id).filter(Boolean));
            const merged = [...(prev || [])];
            incoming.forEach((r) => {
                if (r?._id && !ids.has(r._id)) merged.unshift(r);
            });
            return merged;
        });
    }, [notifications]);

    // ✅ 조건부 렌더링을 모든 hooks 호출 후에 수행
    if (!user || !user._id) {
        return (
            <div className="relative">
                <button className="relative p-2 text-gray-400 cursor-not-allowed rounded-lg">
                    <UserGroupIcon className="w-6 h-6" />
                </button>
            </div>
        );
    }

    // 나머지 이벤트 핸들러들
    const afterHandled = (reqId, notiIdx) => {
        if (!reqId) return;
        setFriendRequests((prev) => prev.filter((r) => r?._id !== reqId));
        if (typeof notiIdx === 'number') removeNotification(notiIdx);
    };

    const handleAccept = async (reqId, notiIdx) => {
        if (!user?._id || !reqId) return;

        try {
            await acceptFriendRequest(user._id, reqId);
            afterHandled(reqId, notiIdx);

            const accepted = friendRequests.find((r) => r?._id === reqId);
            if (accepted?.sender?._id) {
                const friendInfo = await getUserInfo(accepted.sender._id);
                if (friendInfo) {
                    addFriend(friendInfo);
                    setAuthUser((prevUser) => ({
                        ...prevUser,
                        friends: [...(prevUser?.friends || []), friendInfo._id],
                    }));
                }
            }
        } catch (e) {
            console.error('친구 요청 수락 실패', e);
        }
    };

    const handleDecline = async (reqId, notiIdx) => {
        if (!user?._id || !reqId) return;

        try {
            await declineFriendRequest(user._id, reqId);
            afterHandled(reqId, notiIdx);
        } catch (e) {
            console.error('친구 요청 거절 실패', e);
        }
    };

    const handleSelectChat = async (room) => {
        if (!room || !room.roomId || !user?._id) return;

        setSelectedRoom(room);
        setActiveRightTabLocal('chat');

        try {
            await recordRoomEntry(room.roomId, user._id);
            markRoomAsReadStore(room.roomId);

            setTimeout(() => {
                updateRoomSummary(room.roomId);
            }, 100);
        } catch (error) {
            console.error('채팅방 입장 처리 실패:', error);
        }
    };

    const handleClosePanel = () => {
        setShowPanel(false);
        setSelectedRoom(null);
        setActiveRightTabLocal('chatlist');
    };

    // ✅ 친구 요청과 채팅 안읽은 메시지를 구분해서 계산
    const friendRequestCount = friendRequests?.length || 0;

    return (
        <>
            {/* 패널 열기 버튼 */}
            <div className="relative">
                <button
                    onClick={() => setShowPanel(!showPanel)}
                    className="relative p-2 text-white hover:text-gray-400 rounded-lg transition-colors"
                >
                    <UserGroupIcon className="w-6 h-6" />
                    {/* ✅ 전체 배지 개수 표시 (친구 요청 + 안읽은 메시지) */}
                    {badgeCnt > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {badgeCnt > 9 ? '9+' : badgeCnt}
                        </span>
                    )}
                </button>
            </div>

            {/* 사이드패널 */}
            {showPanel && (
                <div
                    ref={panelRef}
                    className={`fixed right-0 top-0 h-full bg-white shadow-2xl z-50 flex transition-all duration-300 ${
                        selectedRoom ? 'w-[65vw]' : 'w-[40vw]'
                    }`}
                >
                    {/* 왼쪽: 친구목록/친구요청 */}
                    <div className={`border-r border-gray-200 flex flex-col transition-all duration-300 ${
                        selectedRoom ? 'w-1/4' : 'w-2/5'
                    }`}>
                        <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActiveTab('friendlist')}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        activeTab === 'friendlist'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <UserGroupIcon className="w-4 h-4"/>
                                    친구목록
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
                                    친구요청
                                    {/* ✅ 친구 요청만의 배지 (내부 탭용) */}
                                    {friendRequestCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                            {friendRequestCount > 9 ? '9+' : friendRequestCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                            <button
                                onClick={handleClosePanel}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-lg"
                            >
                                <XMarkOutlineIcon className="w-5 h-5" />
                            </button>
                        </div>

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
                                        friendRequests.map((req) => {
                                            if (!req || !req._id) return null;

                                            return (
                                                <div
                                                    key={req._id}
                                                    className="bg-gray-50 rounded-lg border p-4"
                                                >
                                                    {/* 상단: 프로필 정보 */}
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <ProfileButton
                                                            profile={req.sender}
                                                            size="sm"
                                                            area='친구요청'
                                                            requestId={req._id}
                                                            onAccept={() => handleAccept(req._id, req._notiIdx)}
                                                            onDecline={() => handleDecline(req._id, req._notiIdx)}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-900 truncate">
                                                                {req.sender?.nickname || '알 수 없음'}
                                                            </p>
                                                            <p className="text-sm text-gray-500">친구 요청을 보냈습니다</p>
                                                        </div>
                                                    </div>

                                                    {/* 하단: 버튼 영역 */}
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => handleAccept(req._id, req._notiIdx)}
                                                            className="px-4 py-2 text-sm bg-green-500 text-white hover:bg-green-600 rounded-md transition-colors flex items-center gap-1 font-medium"
                                                        >
                                                            <CheckIcon className="w-4 h-4" />
                                                            수락
                                                        </button>
                                                        <button
                                                            onClick={() => handleDecline(req._id, req._notiIdx)}
                                                            className="px-4 py-2 text-sm bg-red-500 text-white hover:bg-red-600 rounded-md transition-colors flex items-center gap-1 font-medium"
                                                        >
                                                            <XMarkIcon className="w-4 h-4" />
                                                            거절
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 오른쪽: 채팅 영역 */}
                    <div className={`flex transition-all duration-300 ${
                        selectedRoom ? 'w-3/4' : 'w-3/5'
                    }`}>
                        {/* 왼쪽: 채팅목록 영역 */}
                        <div className={`${selectedRoom ? 'w-2/5' : 'w-full'} ${selectedRoom ? 'border-r border-gray-200' : ''} flex flex-col transition-all duration-300`}>
                            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <ChatBubbleLeftEllipsisIcon className="w-5 h-5"/>
                                    채팅
                                </h3>
                                {/* ✅ 채팅 섹션에 안읽은 메시지 개수 표시 */}
                                {totalUnreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {totalUnreadCount}개의 안읽은 메시지
                        </span>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {!friendRooms || friendRooms.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <ChatBubbleLeftEllipsisIcon className="w-16 h-16 mx-auto mb-4 text-gray-300"/>
                                        <p className="text-lg font-medium mb-2">활성화된 채팅방이 없습니다</p>
                                        <p className="text-sm">친구와 채팅을 시작해보세요</p>
                                    </div>
                                ) : (
                                    friendRooms.map((room) => {
                                        if (!room || !room.roomId || !room.friend) return null;

                                        const summary = roomSummaries?.[room.roomId] || {};
                                        const isSelected = selectedRoom?.roomId === room.roomId;

                                        return (
                                            <div
                                                key={room.roomId}
                                                onClick={() => handleSelectChat(room)}
                                                className={`w-full flex items-start gap-3 p-4 border rounded-lg hover:shadow-sm transition-all cursor-pointer relative
                                        ${isSelected
                                                    ? 'bg-blue-50 border-blue-300 shadow-sm'
                                                    : 'bg-white hover:border-blue-300'
                                                }`}
                                            >
                                                <div className="relative">
                                                    <ProfileButton profile={room.friend} size="md" modalDisabled={true}/>
                                                    {(summary.unreadCount || 0) > 0 && (
                                                        <span
                                                            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                {summary.unreadCount > 9 ? '9+' : summary.unreadCount}
                                            </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="font-medium text-gray-900 truncate">
                                                            {room.friend?.nickname || '알 수 없음'}
                                                        </p>
                                                        {summary.lastMessageTime && (
                                                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                                    {formatDateTime(summary.lastMessageTime)}
                                                </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 truncate">
                                                        {summary.lastMessage ? (wordFilterEnabled ? filterProfanity(summary.lastMessage) : summary.lastMessage) : '채팅을 시작해보세요'}
                                                    </p>
                                                </div>
                                                <ChatBubbleLeftEllipsisIcon
                                                    className="w-5 h-5 text-gray-400 flex-shrink-0"/>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* 오른쪽: 채팅창 영역 */}
                        {selectedRoom && (
                            <div className="w-3/5 flex flex-col">
                                <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setSelectedRoom(null)}
                                            className="p-2 text-gray-600 hover:text-gray-900 transition-colors hover:bg-gray-100 rounded-lg md:hidden"
                                        >
                                            <ArrowLeftIcon className="w-5 h-5"/>
                                        </button>
                                        <ProfileButton profile={selectedRoom.friend} size="sm" modalDisabled={true}/>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {selectedRoom.friend?.nickname || '채팅'}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedRoom(null);
                                        }}
                                        className="p-2 text-gray-600 hover:text-gray-900 transition-colors hover:bg-gray-100 rounded-lg"
                                        title="채팅창 닫기"
                                    >
                                        <XMarkIcon className="w-5 h-5"/>
                                    </button>
                                </div>

                                <div className="flex-1 overflow-hidden">
                                    <ChatOverlay
                                        roomId={selectedRoom.roomId}
                                        friend={selectedRoom.friend}
                                        isSidePanel={true}
                                        onMessageSent={handleMessageSent}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default FriendChatSidePanel;
