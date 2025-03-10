import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../../hooks/useSocket.js";
import { fetchMessages } from "../../api/chatAPI.js";
import { getUserInfo } from "../../api/userAPI.js";

function ChatRoomComponent() {
    const { roomId } = useParams();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [userName, setUserName] = useState(""); // 유저 이름 상태
    const socket = useSocket();

    const senderId = "67bc2846c9d62c1110715d89"; // senderId를 상수로 정의

    // 유저 정보를 가져오는 함수
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const user = await getUserInfo(senderId); // senderId 사용
                setUserName(user.name); // 유저 이름 상태에 저장
            } catch (error) {
                console.error("유저 정보 불러오기 실패:", error);
            }
        };

        fetchUserInfo();
    }, [senderId]);

    // 서버로부터 받은 메시지 처리 (receiveMessage)
    useEffect(() => {
        if (socket) {
            socket.emit("joinRoom", roomId);

            socket.on("receiveMessage", (message) => {
                // sender가 id와 name을 포함하는 경우, 이를 객체로 변환
                const normalizedMessage = {
                    ...message,
                    sender: message.sender.id ? { _id: message.sender.id, name: message.sender.name } : message.sender,
                };

                setMessages((prevMessages) => {
                    // 메시지의 _id를 Set에 저장하여 중복 체크
                    const messageSet = new Set(prevMessages.map(msg => msg._id));
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

    // 채팅방 메시지 불러오기
    useEffect(() => {
        const loadMessages = async () => {
            try {
                const data = await fetchMessages(roomId);
                setMessages(data);
            } catch (error) {
                console.error("채팅 메시지 불러오기 실패:", error);
            }
        };

        loadMessages();
    }, [roomId]);

    const handleMessageChange = (e) => {
        setNewMessage(e.target.value);
    };

    // 메시지 전송 함수 (sendMessage)
    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (newMessage.trim() && socket) {
            try {
                const messageData = {
                    chatRoom: roomId,
                    sender: senderId, // senderId를 사용
                    text: newMessage,
                };

                // 서버로 메시지 전송 후, 서버에서 받은 메시지를 상태에 추가
                socket.emit("sendMessage", messageData, (response) => {
                    if (response.success) {
                        const normalizedMessage = {
                            ...response.message,
                            sender: response.message.sender.id ? { _id: response.message.sender.id, name: response.message.sender.name } : response.message.sender,
                        };

                        setMessages((prevMessages) => {
                            const messageSet = new Set(prevMessages.map(msg => msg._id));
                            if (!messageSet.has(normalizedMessage._id)) {
                                return [...prevMessages, normalizedMessage];
                            }
                            return prevMessages;
                        });

                        console.log("서버로 메시지 전송 성공:", response.message);
                    } else {
                        console.error("메시지 전송 실패:", response.error);
                    }
                });

                setNewMessage(""); // 메시지 입력란 비우기
            } catch (error) {
                console.error("메시지 전송 실패:", error);
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-6">채팅방</h1>
            <div className="w-full max-w-xl p-4 bg-white shadow-md rounded-lg">
                <div className="overflow-y-auto h-72 mb-4">
                    <ul className="space-y-4">
                        {messages.map((message) => {
                            const isMyMessage = message.sender._id === senderId; // senderId로 비교

                            return (
                                <li
                                    key={message._id}
                                    className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`p-3 rounded-lg max-w-xs ${isMyMessage ? "bg-blue-500 text-white self-end" : "bg-gray-200 text-gray-800 self-start"}`}
                                    >
                                        <strong className="block text-sm">
                                            {message.sender.name}
                                        </strong>
                                        <p>{message.text}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <form onSubmit={handleSendMessage} className="flex">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleMessageChange}
                        placeholder="메시지를 입력하세요..."
                        className="w-full p-3 border border-gray-300 rounded-l-lg focus:outline-none"
                    />
                    <button
                        type="submit"
                        className="px-4 py-3 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none"
                    >
                        전송
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ChatRoomComponent;
