import { useEffect, useState, useRef } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import useFriendChatStore from '../../stores/useFriendChatStore';
import useNotificationStore from '../../stores/notificationStore.js';
import DropdownTransition from '../../layout/css/DropdownTransition.jsx';

/* === 아이콘 === */
import {
    BellIcon,
    ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/24/outline';

const GlobalChatNotification = () => {
    /* ----------------- 상태 & 스토어 ----------------- */
    const socket  = useSocket();
    const { pathname } = useLocation();
    const navigate = useNavigate();

    const { user } = useAuthStore();
    const userId   = user?._id;

    const { openFriendChat } = useFriendChatStore();

    const notifications          = useNotificationStore((s) => s.notifications);
    const addNotification        = useNotificationStore((s) => s.addNotification);
    const removeNotificationsByRoom = useNotificationStore(
        (s) => s.removeNotificationsByRoom
    );

    /* ----------------- 컴포넌트 상태 ----------------- */
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [toasts, setToasts]             = useState([]);

    const dropdownRef = useRef(null);

    /* ----------------- 외부 클릭 시 드롭다운 닫기 ----------------- */
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

    /* ----------------- 소켓 등록 ----------------- */
    useEffect(() => {
        if (socket && userId) socket.emit('register', userId);
    }, [socket, userId]);

    /* ----------------- 알림 수신 ----------------- */
    useEffect(() => {
        if (!socket) return;

        const handler = (data) => {
            /* 내가 이미 보고 있는 채팅방이면 무시 */
            if (pathname.startsWith(`/chat/${data.chatRoom}`)) return;

            const id        = Date.now();
            const newNotif  = { id, ...data };

            /* ─ 드롭다운 목록에 추가 ─ */
            addNotification(newNotif);

            /* ─ 토스트에 추가 ─ */
            setToasts((prev) => [...prev, newNotif]);

            /* 5초 후 토스트만 제거 */
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 5000);
        };

        socket.on('chatNotification', handler);
        return () => socket.off('chatNotification', handler);
    }, [socket, pathname, addNotification]);

    /* ----------------- UI 핸들러 ----------------- */
    const toggleDropdown = () => setDropdownOpen((p) => !p);

    const handleNotificationClick = (notif) => {
        if (notif.roomType === 'random') {
            navigate(`/chat/${notif.chatRoom}/${userId}`);
        } else {
            const friendInfo = notif.friend ?? {
                _id:       notif.message.sender.id,
                nickname:  notif.message.sender.nickname,
            };
            openFriendChat({ roomId: notif.chatRoom, friend: friendInfo });
        }

        removeNotificationsByRoom(notif.chatRoom);
        setToasts((prev) => prev.filter((t) => t.chatRoom !== notif.chatRoom));
        // setDropdownOpen(false);  // 필요 시 닫기
    };

    const renderRoomTag = (roomType) =>
        roomType === 'random' ? '[랜덤] ' : roomType === 'friend' ? '[친구] ' : '';

    /* ============================================================ */
    /*                           UI                                 */
    /* ============================================================ */
    return (
        <div className="relative" ref={dropdownRef}>
            {/* ────────── 토스트 ────────── */}
            <div className="fixed top-20 right-4 z-[1100] space-y-3">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="flex items-start gap-2 w-[280px] rounded-lg bg-white shadow-lg ring-1 ring-black/10 px-4 py-3
                       animate-[slide-in_.25s_ease-out]"
                    >
                        <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-gray-800 truncate">
              <span className="font-semibold text-gray-500">
                {renderRoomTag(toast.roomType)}
              </span>
                            {toast.notification}
                        </p>
                    </div>
                ))}
            </div>

            {/* ────────── 벨 버튼 ────────── */}
            <button
                onClick={toggleDropdown}
                className="relative flex h-10 w-10 items-center justify-center
             rounded-full bg-white/70 backdrop-blur-md
             text-gray-700 shadow-lg ring-1 ring-gray-200/70
             transition hover:shadow-xl hover:ring-gray-800"
            >
                {/* 아이콘도 한 단계 키움 */}
                <BellIcon className="h-7 w-7" />

                {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center
                     rounded-full bg-red-500 text-xs font-bold text-white
                     ring-2 ring-white">
      {notifications.length}
    </span>
                )}
            </button>


            {/* ────────── 드롭다운 ────────── */}
            <DropdownTransition
                show={dropdownOpen}
                as="div"
                className="absolute top-full right-0 mt-2 w-72 max-h-80 overflow-hidden rounded-xl
                   bg-white shadow-xl ring-1 ring-black/5 z-[1050]"
            >
                <section className="max-h-80 overflow-y-auto custom-scroll">
                    <h3 className="sticky top-0 z-10 bg-white px-4 py-2 text-xs font-semibold text-gray-700 border-b">
                        채팅 알림
                    </h3>

                    {notifications.length === 0 ? (
                        <p className="flex flex-col items-center justify-center gap-1 py-8 text-xs text-gray-400">
                            <BellIcon className="h-6 w-6 opacity-40" />
                            알림이 없습니다
                        </p>
                    ) : (
                        notifications.map((notif) => (
                            <button
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                className="flex w-full items-start gap-2 px-4 py-3 text-left hover:bg-gray-50"
                            >
                                <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-blue-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs font-medium text-gray-500">
                                    {renderRoomTag(notif.roomType)}
                                  </span>
                                    <p className="truncate text-sm text-gray-800">
                                        {notif.notification}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </section>
            </DropdownTransition>
        </div>
    );
};

export default GlobalChatNotification;
