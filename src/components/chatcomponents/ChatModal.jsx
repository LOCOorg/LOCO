import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../../hooks/useSocket.js";
import { fetchMessages } from "../../api/chatAPI.js";
import { getUserInfo } from "../../api/userAPI.js";
import Modal from "react-modal";
import useAuthStore from "../../stores/authStore.js";

Modal.setAppElement("#root");

function ChatModal() {
    const { roomId } = useParams();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [userName, setUserName] = useState("");
    const socket = useSocket();
    const navigate = useNavigate();
    const authUser = useAuthStore((state) => state.user);
    const senderId = authUser?._id; // authStore에서 받아온 사용자 ID
    const [isModalOpen, setIsModalOpen] = useState(true);

    // 유저 정보를 가져오는 함수
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

    // 서버로부터 받은 메시지 처리
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

                        console.log("서버로 메시지 전송 성공:", response.message);
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

    // 모달 닫기 함수
    const closeModal = () => {
        setIsModalOpen(false);
        navigate("/");
    };

    return (
        <Modal
            isOpen={isModalOpen}
            onRequestClose={closeModal}
            contentLabel="Chat Room"
            className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50"
            overlayClassName="fixed inset-0 bg-black bg-opacity-50"
        >
            <div className="flex flex-col items-center justify-center bg-white p-6 w-full max-w-xl rounded-lg shadow-lg">
                <h1 className="text-4xl font-bold text-gray-800 mb-6">채팅방</h1>
                <div className="overflow-y-auto h-72 mb-4 w-full">
                    <ul className="space-y-4">
                        {messages.map((message) => {
                            const isMyMessage = message.sender._id === senderId;
                            return (
                                <li
                                    key={message._id}
                                    className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`p-3 rounded-lg max-w-xs ${isMyMessage ? "bg-blue-500 text-white self-end" : "bg-gray-200 text-gray-800 self-start"}`}
                                    >
                                        <strong className="block text-sm">{message.sender.name}</strong>
                                        <p>{message.text}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <form onSubmit={handleSendMessage} className="flex w-full">
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
                <button
                    onClick={closeModal}
                    className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none"
                >
                    닫기
                </button>
            </div>
        </Modal>
    );
}

export default ChatModal;
