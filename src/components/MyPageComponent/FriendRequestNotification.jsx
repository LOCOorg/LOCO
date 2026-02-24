import { useContext, useEffect, useState } from 'react';
import { useSocket } from '../../hooks/useSocket.js';
import useAuthStore from '../../stores/authStore';
import { NotificationContext } from '../../hooks/NotificationContext.jsx';

/* 아이콘 (Heroicons 2.x) */
import { UserPlusIcon } from '@heroicons/react/24/solid';
import useNotificationStore from "../../stores/notificationStore.js";

const FriendRequestNotification = () => {
    const { user } = useAuthStore();
    const socket  = useSocket();
    const { addNotification } = useContext(NotificationContext);

    const [toasts, setToasts] = useState([]);
    const friendReqEnabled = useNotificationStore((s) => s.friendReqEnabled);

    /* -------- 소켓 통신 (register는 SocketContext에서 전역 처리) -------- */
    useEffect(() => {
        if (!socket || !user) return;

        const handler = (data) => {
            if (!friendReqEnabled) return;
            addNotification(data);               // 드롭다운용
            setToasts((prev) => [
                ...prev,
                { id: Date.now(), message: data.message },
            ]);
        };
        socket.on('friendRequestNotification', handler);
        return () => socket.off('friendRequestNotification', handler);
    }, [socket, user, addNotification, friendReqEnabled]);

    /* -------- 자동 제거 -------- */
    useEffect(() => {
        if (toasts.length === 0) return;
        const timer = setTimeout(
            () => setToasts((prev) => prev.slice(1)),
            5000
        );
        return () => clearTimeout(timer);
    }, [toasts]);

    /* --------- UI --------- */
    return (
        <div className="fixed bottom-14 left-5 z-[1100] space-y-3">
            {toasts.map(({ id, message }) => (
                <div
                    key={id}
                    className="relative flex items-start gap-3 w-auto max-w-[90vw]
                     rounded-lg bg-white/80 backdrop-blur-md
                     shadow-lg ring-1 ring-gray-200
                     animate-toast-in"
                >
                    {/* 아이콘 */}
                    <UserPlusIcon className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />

                    {/* 메시지 */}
                    <p className="flex-1 text-sm text-gray-800">{message}</p>

                    {/* 진행바 (5초) */}
                    <span className="absolute bottom-0 left-0 h-0.5
                           w-full bg-emerald-500 animate-toast-bar" />
                </div>
            ))}
        </div>
    );
};

export default FriendRequestNotification;
