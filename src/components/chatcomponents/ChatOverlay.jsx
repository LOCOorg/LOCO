// ChatOverlay.jsx

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../../hooks/useSocket.js";
import { fetchMessages } from "../../api/chatAPI.js";
import { getUserInfo } from "../../api/userAPI.js";

// eslint-disable-next-line react/prop-types
function ChatOverlay({ roomId: propRoomId, customStyle = {}, onClose }) {
    const { roomId: routeRoomId } = useParams();
    const roomId = propRoomId || routeRoomId; // prop으로 전달된 roomId 우선 사용
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [userName, setUserName] = useState("");
    const socket = useSocket();
    const senderId = "67bc2846c9d62c1110715d89";

    // 사용자 정보 불러오기
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const user = await getUserInfo(senderId);
                setUserName(user.name);
            } catch (error) {
                console.error("유저 정보 불러오기 실패:", error);
            }
        };

        fetchUserInfo();
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

    const handleMessageChange = (e) => {
        setNewMessage(e.target.value);
    };

    // 메시지 전송 함수
    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (newMessage.trim() && socket && roomId) {
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

    // 닫기 버튼 클릭 시 onClose 콜백 호출
    const handleClose = () => {
        if (onClose) {
            onClose(roomId);
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                bottom: "20px",
                right: "20px",
                width: "350px",
                maxHeight: "500px",
                backgroundColor: "white",
                boxShadow: "0 0 10px rgba(0,0,0,0.3)",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                zIndex: 1000,
                ...customStyle,
            }}
        >
            <div
                style={{
                    backgroundColor: "#0084ff",
                    color: "white",
                    padding: "10px",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <span>채팅</span>
                <button
                    onClick={handleClose}
                    style={{
                        background: "none",
                        border: "none",
                        color: "white",
                        fontSize: "16px",
                        cursor: "pointer",
                    }}
                >
                    X
                </button>
            </div>
            <div
                style={{
                    flex: "1",
                    padding: "10px",
                    overflowY: "auto",
                    backgroundColor: "#f0f0f0",
                }}
            >
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {messages.map((message) => {
                        const isMyMessage = message.sender._id === senderId;
                        return (
                            <li
                                key={message._id}
                                style={{
                                    display: "flex",
                                    justifyContent: isMyMessage ? "flex-end" : "flex-start",
                                    marginBottom: "8px",
                                }}
                            >
                                <div
                                    style={{
                                        backgroundColor: isMyMessage ? "#0084ff" : "#e4e6eb",
                                        color: isMyMessage ? "white" : "black",
                                        padding: "8px 12px",
                                        borderRadius: "16px",
                                        maxWidth: "70%",
                                    }}
                                >
                                    <strong style={{ fontSize: "12px" }}>
                                        {message.sender.name}
                                    </strong>
                                    <div style={{ fontSize: "14px", marginTop: "4px" }}>
                                        {message.text}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <form
                onSubmit={handleSendMessage}
                style={{ display: "flex", borderTop: "1px solid #ddd" }}
            >
                <input
                    type="text"
                    value={newMessage}
                    onChange={handleMessageChange}
                    placeholder="메시지를 입력하세요..."
                    style={{
                        flex: "1",
                        padding: "10px",
                        border: "none",
                        outline: "none",
                    }}
                />
                <button
                    type="submit"
                    style={{
                        padding: "10px 15px",
                        backgroundColor: "#0084ff",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                    }}
                >
                    전송
                </button>
            </form>
        </div>
    );
}

export default ChatOverlay;
