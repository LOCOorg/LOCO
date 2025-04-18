// GlobalChatNotification.jsx
import { useEffect, useState, useRef } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useLocation, useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";
import useFriendChatStore from "../../stores/useFriendChatStore";
import useNotificationStore from "../../stores/notificationStore.js";

const GlobalChatNotification = () => {
    const socket = useSocket();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const userId = user?._id;

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { openFriendChat } = useFriendChatStore();

    // 기존 상태 관리 대신 전역 스토어 사용
    const notifications = useNotificationStore((state) => state.notifications);
    const addNotification = useNotificationStore((state) => state.addNotification);
    const removeNotification = useNotificationStore((state) => state.removeNotification);


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
                if (location.pathname.startsWith(`/chat/${data.chatRoom}`)) {
                    return;
                }
                const id = Date.now();
                const newNotif = { id, ...data };
                addNotification(newNotif);
            });
            return () => {
                socket.off("chatNotification");
            };
        }
    }, [socket, location, addNotification]);


    const toggleDropdown = () => {
        setDropdownOpen((prev) => !prev);
    };

    const handleNotificationClick = (notif) => {
        if (notif && notif.chatRoom) {
            if (notif.roomType === "random") {
                navigate(`/chat/${notif.chatRoom}/${userId}`);
            } else if (notif.roomType === "friend") {
                let friendInfo = notif.friend;
                if (
                    !friendInfo &&
                    notif.message &&
                    notif.message.sender &&
                    notif.message.sender.id !== userId
                ) {
                    friendInfo = {
                        _id: notif.message.sender.id,
                        nickname: notif.message.sender.nickname,
                        name: notif.message.sender.nickname,
                    };
                }
                openFriendChat({ roomId: notif.chatRoom, friend: friendInfo || null });
            }
        }
        removeNotification(notif.id);
        setDropdownOpen(false);
    };


    // helper: roomType에 따른 표시 텍스트
    const renderRoomTypeTag = (roomType) => {
        if (roomType === "random") return "[랜덤] ";
        if (roomType === "friend") return "[친구] ";
        return "";
    };

    return (
        <div className="relative">
            <button
                onClick={toggleDropdown}
                className="relative bg-transparent border-0 cursor-pointer text-2xl"
            >
        <span role="img" aria-label="notification">
          🔔
        </span>
                {notifications.length > 0 && (
                    <span className="absolute top-[-5px] right-[-5px] bg-red-500 rounded-full text-white py-[2px] px-[6px] text-xs">
            {notifications.length}
          </span>
                )}
            </button>
            {dropdownOpen && notifications.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full right-0 bg-white shadow-lg rounded z-[1000] w-[250px] max-h-[300px] overflow-y-auto"
                >
                    {notifications.map((notif) => (
                        <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className="p-2.5 border-b border-gray-300 cursor-pointer text-black"
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
