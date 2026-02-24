import { useEffect, useState, useRef } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import useFriendChatStore from '../../stores/useFriendChatStore';
import useNotificationStore from '../../stores/notificationStore.js';
import DropdownTransition from '../../layout/css/DropdownTransition.jsx';
import { BellIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { filterProfanity } from '../../utils/profanityFilter.js';

const GlobalChatNotification = () => {
    const socket = useSocket();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const userId = user?._id;
    const { isSidePanelChatVisible, openSidePanelWithChat } = useFriendChatStore();

    const {
        notifications,
        addNotification,
        removeNotificationsByRoom,
        chatPreviewEnabled,
        clearNotifications,
        cleanupOldNotifications,
        wordFilterEnabled
    } = useNotificationStore();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [toasts, setToasts] = useState([]);
    const dropdownRef = useRef(null);

    // 외부 클릭 시 드롭다운 닫기
    useEffect(() => {
        if (!dropdownOpen) return;
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dropdownOpen]);

    // register는 SocketContext에서 전역으로 처리

    // 알림 수신
    useEffect(() => {
        if (!socket) return;

        const handler = (data) => {
            if (pathname.startsWith(`/chat/${data.chatRoom}`)) return;

            if (data.roomType === 'friend' && isSidePanelChatVisible(data.chatRoom)) {
                console.log(`사이드패널 친구 채팅방 ${data.chatRoom}이 열려있어 알림을 차단합니다.`);
                return;
            }

            const newNotif = { id: Date.now(), ...data };

            if (!chatPreviewEnabled) {
                addNotification(newNotif);
                return;
            }

            addNotification(newNotif);
            setToasts((prev) => [...prev, newNotif]);

            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== newNotif.id));
            }, 5000);

            cleanupOldNotifications();
        };

        socket.on('chatNotification', handler);
        return () => socket.off('chatNotification', handler);
    }, [socket, pathname, chatPreviewEnabled, addNotification, cleanupOldNotifications, isSidePanelChatVisible]);

    const handleNotificationClick = (notif) => {
        if (notif.roomType === 'random') {
            navigate(`/chat/${notif.chatRoom}/${userId}`);
        } else if (notif.roomType === 'friend') {
            const friendInfo = notif.friend ?? {
                _id: notif.message?.sender?.id,
                nickname: notif.message?.sender?.nickname,
            };
            openSidePanelWithChat(notif.chatRoom, friendInfo);
        }

        removeNotificationsByRoom(notif.chatRoom);
        setToasts((prev) => prev.filter((t) => t.chatRoom !== notif.chatRoom));
        setDropdownOpen(false);
    };

    const renderRoomTag = (roomType) =>
        roomType === 'random' ? '[랜덤] ' :
            roomType === 'friend' ? '[친구] ' : '';

    return (
        <>
            {/* 알림 버튼 */}
            <div className="relative">
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="relative p-2 text-white hover:text-gray-400 rounded-lg transition-colors"
                >
                    <BellIcon className="w-6 h-6" />
                    {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {notifications.length > 9 ? '9+' : notifications.length}
                        </span>
                    )}
                </button>

                {/* 드롭다운 */}
                <DropdownTransition show={dropdownOpen}>
                    <div
                        ref={dropdownRef}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto"
                    >
                        <div className="px-4 py-2 text-sm font-medium text-gray-900 border-b">
                            알림 ({notifications.length})
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearNotifications}
                                    className="float-right text-xs text-blue-600 hover:text-blue-800"
                                >
                                    모두 지우기
                                </button>
                            )}
                        </div>

                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500">
                                새로운 알림이 없습니다
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900">
                                                <span className="font-medium text-blue-600">
                                                    {renderRoomTag(notif.roomType)}
                                                </span>
                                                {wordFilterEnabled ? filterProfanity(notif.notification) : notif.notification}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(notif.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DropdownTransition>
            </div>

            {/* 토스트 알림 */}
            <div className="fixed bottom-4 right-4 space-y-2 z-[1100]">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm animate-slide-in cursor-pointer"
                        onClick={() => handleNotificationClick(toast)}
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900">
                                    <span className="font-medium text-blue-600">
                                        {renderRoomTag(toast.roomType)}
                                    </span>
                                    {wordFilterEnabled ? filterProfanity(toast.notification) : toast.notification}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default GlobalChatNotification;
