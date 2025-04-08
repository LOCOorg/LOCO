import { useEffect, useState, useRef } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";

const GlobalChatNotification = () => {
    const socket = useSocket();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const userId = user?._id;
    const [notifications, setNotifications] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // 사용자가 로그인되어 있다면, 소켓 연결 시 register 이벤트를 emit하여 개인 룸에 등록합니다.
    useEffect(() => {
        if (socket && userId) {
            socket.emit("register", userId);
        }
    }, [socket, userId]);

    useEffect(() => {
        if (socket) {
            socket.on("chatNotification", (data) => {
                console.log("Received chatNotification data:", data);
                // 사용자가 해당 채팅방(예: `/chat/${data.chatRoom}`)에 있다면 알림을 표시하지 않음
                if (location.pathname.startsWith(`/chat/${data.chatRoom}`)) {
                    return;
                }
                // 고유 id를 부여해 새 알림 객체 생성 (여기선 Date.now()를 간단한 id로 사용)
                const id = Date.now();
                const newNotif = { id, ...data };
                setNotifications((prev) => [...prev, newNotif]);
            });
            return () => {
                socket.off("chatNotification");
            };
        }
    }, [socket, location]);

    const toggleDropdown = () => {
        setDropdownOpen((prev) => !prev);
    };

    const handleNotificationClick = (notif) => {
        if (notif && notif.chatRoom) {
            navigate(`/chat/${notif.chatRoom}/${userId}`);
        }
        console.log(notif);
        // 클릭한 알림은 목록에서 제거
        setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
        setDropdownOpen(false);
    };

    return (
        <div style={{ position: "relative" }}>
            {/* 알림 버튼 */}
            <button
                onClick={toggleDropdown}
                style={{
                    position: "relative",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "24px",
                }}
            >
                <span role="img" aria-label="notification">
                    🔔
                </span>
                {notifications.length > 0 && (
                    <span
                        style={{
                            position: "absolute",
                            top: -5,
                            right: -5,
                            background: "red",
                            borderRadius: "50%",
                            color: "white",
                            padding: "2px 6px",
                            fontSize: "12px",
                        }}
                    >
                        {notifications.length}
                    </span>
                )}
            </button>

            {/* 드롭다운 목록: 알림이 쌓여 있음 */}
            {dropdownOpen && notifications.length > 0 && (
                <div
                    ref={dropdownRef}
                    style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        background: "white",
                        boxShadow: "0 0 10px rgba(0,0,0,0.2)",
                        borderRadius: "4px",
                        zIndex: 1000,
                        width: "250px",
                        maxHeight: "300px",
                        overflowY: "auto",
                    }}
                >
                    {notifications.map((notif) => (
                        <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            style={{
                                padding: "10px",
                                borderBottom: "1px solid #ddd",
                                cursor: "pointer",
                                color: "black",
                            }}
                        >
                            {notif.notification}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GlobalChatNotification;
