// src/components/FriendRequestNotification.jsx
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket.js';
import useAuthStore from '../../stores/authStore';
import { NotificationContext } from '../../hooks/NotificationContext.jsx';

const FriendRequestNotification = () => {
    const { user } = useAuthStore();
    const socket = useSocket();
    const { notifications, addNotification, removeNotification } = useContext(NotificationContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (socket && user) {
            // 사용자 ID를 이용해 소켓에 등록 (룸 가입)
            socket.emit('register', user._id);
            // 서버에서 친구 요청 알림 이벤트 수신 시 전역 알림에 추가
            socket.on('friendRequestNotification', (data) => {
                addNotification(data);
            });
            return () => {
                socket.off('friendRequestNotification');
            };
        }
    }, [socket, user, addNotification]);

    // 알림 메시지를 클릭하면 해당 알림 제거 후 마이페이지로 이동
    const handleNotificationClick = (index) => {
        removeNotification(index);
        navigate('/mypage');
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 1000,
            }}
        >
            {notifications.map((notification, index) => (
                <div
                    key={index}
                    onClick={() => handleNotificationClick(index)}
                    style={{
                        backgroundColor: '#4caf50',
                        color: 'white',
                        padding: '12px 20px',
                        marginBottom: '8px',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        minWidth: '200px',
                        cursor: 'pointer',
                    }}
                >
                    <span style={{ flex: 1 }}>{notification.message}</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // 버튼 클릭 시 알림 전체 클릭 이벤트 방지
                            removeNotification(index);
                        }}
                        style={{
                            marginLeft: '10px',
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '16px',
                        }}
                    >
                        &times;
                    </button>
                </div>
            ))}
        </div>
    );
};

export default FriendRequestNotification;
