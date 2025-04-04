import { useEffect, useState } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useLocation, useNavigate } from "react-router-dom";

const GlobalChatNotification = () => {
    const socket = useSocket();
    const location = useLocation();
    const navigate = useNavigate();
    const [notification, setNotification] = useState(null);
    const [notificationData, setNotificationData] = useState(null);

    useEffect(() => {
        if (socket) {
            socket.on("chatNotification", (data) => {
                // 채팅방 페이지에 있을 경우 알림을 표시하지 않음
                if (location.pathname.startsWith("/chat/room")) {
                    return;
                }
                // data 객체에 chatRoom, message, notification 등이 포함되어 있다고 가정
                setNotification(data.notification);
                setNotificationData(data);
                // 5초 후 자동 제거
                setTimeout(() => {
                    setNotification(null);
                    setNotificationData(null);
                }, 5000);
            });
            return () => {
                socket.off("chatNotification");
            };
        }
    }, [socket, location]);

    const handleNotificationClick = () => {
        // 예를 들어, 알림을 클릭하면 해당 채팅방 페이지로 이동
        if (notificationData && notificationData.chatRoom) {
            navigate(`/chat/room/${notificationData.chatRoom}`);
        }
        setNotification(null);
        setNotificationData(null);
    };

    if (!notification) return null;

    return (
        <div
            onClick={handleNotificationClick}
            style={{
                position: "fixed",
                top: "20px",
                right: "20px",
                backgroundColor: "#0084ff",
                color: "white",
                padding: "10px 20px",
                borderRadius: "8px",
                boxShadow: "0 0 10px rgba(0,0,0,0.3)",
                zIndex: 1000,
                cursor: "pointer",
            }}
        >
            {notification}
        </div>
    );
};

export default GlobalChatNotification;
