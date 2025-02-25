import { useEffect, useState } from "react";
import { useSocket } from "../../hooks/useSocket.js";
import { fetchMessages, sendMessage } from "../../api/chatAPI.js";
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

    return (
        <div>
            <h2>채팅방 {roomId}</h2>
            <div>
                {messages.map((msg) => (
                    <div key={msg._id}>
                        <strong>{msg.sender.name}: </strong>
                        {msg.text}
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="메시지를 입력하세요..."
            />
            <button onClick={handleSendMessage}>전송</button>
        </div>
    );
};

// ✅ PropTypes 설정 추가
ChatRoom.propTypes = {
    roomId: PropTypes.string.isRequired, // roomId는 필수 string
    userId: PropTypes.string.isRequired, // userId는 필수 string
};

export default ChatRoom;
