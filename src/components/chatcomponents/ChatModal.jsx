import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../../hooks/useSocket.js";
import { fetchMessages, sendMessage } from "../../api/chatAPI.js";
import { getUserInfo } from "../../api/userAPI.js";

function ChatRoomComponent() {
    const { roomId } = useParams();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [userName, setUserName] = useState(""); // 유저 이름 상태
    const socket = useSocket();

    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const senderId = "67bc2846c9d62c1110715d89"; // 실제 사용자 ID
                const user = await getUserInfo(senderId);
                setUserName(user.name); // 유저 이름 상태에 저장
            } catch (error) {
                console.error("유저 정보 불러오기 실패:", error);
            }
        };

        fetchUserInfo();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.emit("join_room", roomId);

            socket.on("receive_message", (message) => {
                // 메시지 수신 시, 새 메시지 추가
                setMessages((prevMessages) => [...prevMessages, message]);
            });

            return () => {
                socket.off("receive_message");
            };
        }
    }, [socket, roomId]);

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

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (newMessage.trim() && socket) {
            try {
                const sender = "67bc2846c9d62c1110715d89"; // 실제 사용자 ID
                const messageData = { roomId, sender: { id: sender, name: userName }, text: newMessage };

                // 로컬 상태에서 메시지 바로 추가
                setMessages((prevMessages) => [...prevMessages, messageData]);

                // 서버로 메시지 전송
                await sendMessage(roomId, sender, newMessage);

                // 소켓을 통해 실시간 메시지 전송
                socket.emit("send_message", messageData);
                console.log("전송된 메시지:", messageData);

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
                        {messages.map((message, index) => (
                            <li key={index} className="text-gray-700">
                                <strong>{message.sender.name}: </strong>{message.text}
                            </li>
                        ))}
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
