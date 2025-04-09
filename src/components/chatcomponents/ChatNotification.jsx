// GlobalChatNotification.jsx
import { useEffect, useState, useRef } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";
import useFriendChatStore from "../../stores/useFriendChatStore"; // 추가

const GlobalChatNotification = () => {
    const socket = useSocket();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const userId = user?._id;
    const [notifications, setNotifications] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { openFriendChat } = useFriendChatStore(); // 전역 상태 함수

    // 사용자 등록
    useEffect(() => {
        if (socket && userId) {
            socket.emit("register", userId);
        }
    }, [socket, userId]);

    useEffect(() => {
        if (socket) {
            socket.on("chatNotification", (data) => {
                console.log("Received chatNotification data:", data);
                // 이미 해당 채팅방에 있다면 알림 표시하지 않음
                if (location.pathname.startsWith(`/chat/${data.chatRoom}`)) {
                    return;
                }
                // 고유 id 추가하여 알림 객체 생성
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
            if (notif.roomType === "random") {
                navigate(`/chat/${notif.chatRoom}/${userId}`);
            } else if (notif.roomType === "friend") {
                // friend 알림: friend 정보가 없으면, 메시지의 sender가 친구일 가능성이 있음
                let friendInfo = notif.friend;
                if (!friendInfo && notif.message && notif.message.sender && notif.message.sender.id !== userId) {
                    friendInfo = {
                        _id: notif.message.sender.id,
                        nickname: notif.message.sender.nickname,
                        name: notif.message.sender.nickname // 필요하면 추가 정보 포함
                    };
                }
                openFriendChat({ roomId: notif.chatRoom, friend: friendInfo || null });
            }
        }
        setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
        setDropdownOpen(false);
    };


    // helper: roomType에 따른 표시 텍스트
    const renderRoomTypeTag = (roomType) => {
        if (roomType === "random") return "[랜덤] ";
        if (roomType === "friend") return "[친구] ";
        return "";
    };

    return (
        <div style={{ position: "relative" }}>
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
                            {renderRoomTypeTag(notif.roomType)}
                            {notif.notification}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GlobalChatNotification;
