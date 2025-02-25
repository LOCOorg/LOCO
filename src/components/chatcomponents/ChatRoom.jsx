import { useEffect, useState } from "react";
import { useSocket } from "../../hooks/useSocket.js";
import { fetchMessages, sendMessage, deleteMessage } from "../../api/chatAPI.js";
import PropTypes from "prop-types";

const ChatRoom = ({ roomId, userId }) => {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const socket = useSocket();

    useEffect(() => {
        // 메시지 가져오기
        fetchMessages(roomId).then(setMessages);

        // 소켓 연결 시 방에 입장
        if (socket) {
            socket.emit("joinRoom", roomId);

            // 메시지 수신 처리
            socket.on("receiveMessage", (message) => {
                setMessages((prev) => [...prev, message]);
            });
        }

        // Cleanup: 소켓 메시지 리스너 제거
        return () => {
            if (socket) {
                socket.off("receiveMessage");
            }
        };
    }, [roomId, socket]);

    const handleSendMessage = async () => {
        if (!text.trim()) return; // 빈 메시지 방지

        if (socket) {
            const message = await sendMessage(roomId, userId, text);
            socket.emit("sendMessage", message);
            setText(""); // 메시지 전송 후 텍스트 필드 초기화
        } else {
            console.error("WebSocket 연결이 이루어지지 않았습니다.");
        }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            await deleteMessage(messageId);
            setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== messageId));
        } catch (error) {
            console.error("메시지 삭제 중 오류 발생:", error);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 text-center">채팅방 {roomId}</h2>

            <div className="space-y-4 mb-4">
                {messages.map((msg) => (
                    <div key={msg._id} className="flex justify-between items-center bg-gray-100 p-3 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-2">
                            <strong className="text-blue-600">{msg.sender.name}:</strong>
                            <span>{msg.text}</span>
                        </div>
                        <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            className="ml-4 text-red-600 hover:text-red-800 focus:outline-none"
                        >
                            삭제
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex space-x-2">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="메시지를 입력하세요..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={handleSendMessage}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none"
                >
                    전송
                </button>
            </div>
        </div>
    );
};

// ✅ PropTypes 설정 추가
ChatRoom.propTypes = {
    roomId: PropTypes.string.isRequired, // roomId는 필수 string
    userId: PropTypes.string.isRequired, // userId는 필수 string
};

export default ChatRoom;
