import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../../hooks/useSocket.js";
import { fetchMessages } from "../../api/chatAPI.js";
import { getUserInfo } from "../../api/userAPI.js";
import useAuthStore from "../../stores/authStore.js";

// eslint-disable-next-line react/prop-types
function ChatOverlay({ roomId: propRoomId, customStyle = {}, onClose, friend }) {
    const { roomId: routeRoomId } = useParams();
    const roomId = propRoomId || routeRoomId;
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [userName, setUserName] = useState("");
    const socket = useSocket();
    const authUser = useAuthStore((state) => state.user);
    const senderId = authUser?._id;

    const messagesContainerRef = useRef(null);

    // textTime을 HH:MM 형식으로 포맷하는 헬퍼 함수
    const formatTime = (textTime) => {
        if (!textTime) return "";
        const date = new Date(textTime);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // 날짜를 "YYYY-MM-DD" 형태로 포맷하는 헬퍼 함수 (그룹 헤더용)
    const formatDate = (textTime) => {
        if (!textTime) return "";
        const date = new Date(textTime);
        return date.toLocaleDateString();
    };

    // 메시지를 날짜별로 그룹화하는 함수
    const groupMessagesByDate = (messages) => {
        return messages.reduce((groups, message) => {
            const date = formatDate(message.textTime);
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(message);
            return groups;
        }, {});
    };

    // 사용자 정보 불러오기
    useEffect(() => {
        if (!senderId) return;
        const fetchUserInfoAsync = async () => {
            try {
                const user = await getUserInfo(senderId);
                setUserName(user.name);
            } catch (error) {
                console.error("유저 정보 불러오기 실패:", error);
            }
        };

        fetchUserInfoAsync();
    }, [senderId]);

    // 채팅방 참여 및 메시지 수신 처리
    useEffect(() => {
        if (socket && roomId) {
            socket.emit("joinRoom", roomId);
            socket.on("receiveMessage", (message) => {
                const normalizedMessage = {
                    ...message,
                    sender: message.sender.id
                        ? { _id: message.sender.id, name: message.sender.name }
                        : message.sender,
                };

                setMessages((prevMessages) => {
                    const messageSet = new Set(prevMessages.map((msg) => msg._id));
                    if (!messageSet.has(normalizedMessage._id)) {
                        return [...prevMessages, normalizedMessage];
                    }
                    return prevMessages;
                });
            });

            return () => {
                socket.off("receiveMessage");
            };
        }
    }, [socket, roomId]);

    // 채팅방 기존 메시지 불러오기
    useEffect(() => {
        if (roomId) {
            const loadMessages = async () => {
                try {
                    const data = await fetchMessages(roomId);
                    setMessages(data);
                } catch (error) {
                    console.error("채팅 메시지 불러오기 실패:", error);
                }
            };

            loadMessages();
        }
    }, [roomId]);

    // 스크롤 최신화
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleMessageChange = (e) => {
        setNewMessage(e.target.value);
    };

    // 메시지 전송 함수
    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (newMessage.trim() && socket && roomId && senderId) {
            try {
                const messageData = {
                    chatRoom: roomId,
                    sender: senderId,
                    text: newMessage,
                };

                socket.emit("sendMessage", messageData, (response) => {
                    if (response.success) {
                        const normalizedMessage = {
                            ...response.message,
                            sender: response.message.sender.id
                                ? { _id: response.message.sender.id, name: response.message.sender.name }
                                : response.message.sender,
                        };

                        setMessages((prevMessages) => {
                            const messageSet = new Set(prevMessages.map((msg) => msg._id));
                            if (!messageSet.has(normalizedMessage._id)) {
                                return [...prevMessages, normalizedMessage];
                            }
                            return prevMessages;
                        });
                    } else {
                        console.error("메시지 전송 실패:", response.error);
                    }
                });

                setNewMessage("");
            } catch (error) {
                console.error("메시지 전송 실패:", error);
            }
        }
    };

    const handleClose = () => {
        if (onClose) {
            onClose(roomId);
        }
    };

    const groupedMessages = groupMessagesByDate(messages);

    return (
        <div
            className="fixed bottom-5 right-5 w-[350px] h-[400px] bg-white shadow-lg rounded-lg flex flex-col overflow-hidden z-[1000]"
            style={customStyle}
        >
            <div className="bg-[#0084ff] text-white p-2.5 cursor-pointer flex justify-between items-center">
                <span>{friend ? (friend.nickname || friend.name) : "채팅"}</span>
                <button onClick={handleClose} className="bg-transparent border-0 text-white text-base cursor-pointer">
                    X
                </button>
            </div>
            <div ref={messagesContainerRef} className="flex-1 p-2.5 overflow-y-auto bg-gray-100 h-[300px]">
                {Object.keys(groupedMessages).map((date) => (
                    <div key={date}>
                        <div className="text-center my-[10px] text-xs text-gray-600">
                            {date}
                        </div>
                        <ul className="list-none p-0 m-0">
                            {groupedMessages[date].map((message) => {
                                const isMyMessage = message.sender._id === senderId;
                                return (
                                    <li key={message._id} className={`flex ${isMyMessage ? "justify-end" : "justify-start"} mb-2`}>
                                        <div className={`${isMyMessage ? "bg-[#0084ff] text-white" : "bg-[#e4e6eb] text-black"} py-2 px-3 rounded-[16px] max-w-[70%]`}>
                                            <strong className="text-xs">{message.sender.name}</strong>
                                            <div className="text-sm mt-1">
                                                {message.text}
                                            </div>
                                            <div className={`text-xs text-white-600 mt-1 ${isMyMessage ? "text-right" : "text-left"}`}>
                                                {formatTime(message.textTime)}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>
            <form onSubmit={handleSendMessage} className="flex border-t border-gray-300">
                <input
                    type="text"
                    value={newMessage}
                    onChange={handleMessageChange}
                    placeholder="메시지를 입력하세요..."
                    className="flex-1 p-2.5 border-none outline-none"
                />
                <button type="submit" className="py-2.5 px-3.5 bg-[#0084ff] text-white border-0 cursor-pointer">
                    전송
                </button>
            </form>
        </div>
    );
}

export default ChatOverlay;
