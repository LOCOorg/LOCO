// src/components/FriendRequestNotification.jsx
import { useContext, useEffect, useState } from 'react';
import { useSocket } from '../../hooks/useSocket.js';
import useAuthStore from '../../stores/authStore';
import { NotificationContext } from '../../hooks/NotificationContext.jsx';

const FriendRequestNotification = () => {
    const { user } = useAuthStore();
    const socket = useSocket();
    const { addNotification } = useContext(NotificationContext);

    // local toast list (컨텍스트와 별개로 유지)
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        if (!socket || !user) return;
        socket.emit('register', user._id);

        socket.on('friendRequestNotification', (data) => {
            // 1) 드롭다운용 컨텍스트에 저장
            addNotification(data);
            // 2) 토스트에도 추가
            setToasts((prev) => [...prev, {
                id: Date.now(),       // 간단한 고유키
                message: data.message
            }]);
        });

        return () => {
            socket.off('friendRequestNotification');
        };
    }, [socket, user, addNotification]);

    // 토스트 자동 제거 (5초)
    useEffect(() => {
        if (toasts.length === 0) return;
        const timer = setTimeout(() => {
            setToasts((prev) => prev.slice(1)); // 가장 오래된 하나 제거
        }, 5000);
        return () => clearTimeout(timer);
    }, [toasts]);

    return (
        <div className="fixed bottom-5 left-5 z-50 space-y-2">
            {toasts.map(({ id, message }) => (
                <div
                    key={id}
                    className="bg-green-500 text-white px-5 py-3 rounded shadow-lg flex items-center min-w-[200px]"
                >
                    <span className="flex-1">{message}</span>
                </div>
            ))}
        </div>
    );
};

export default FriendRequestNotification;
