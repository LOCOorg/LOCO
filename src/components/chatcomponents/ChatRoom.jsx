import { useEffect, useState, useRef } from "react";
import { useSocket } from "../../hooks/useSocket.js";
import { fetchMessages, deleteMessage, leaveChatRoom, getChatRoomInfo } from "../../api/chatAPI.js";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { getUserInfo } from "../../api/userAPI.js";
import CommonModal from "../../common/CommonModal.jsx";

const ChatRoom = ({ roomId, userId }) => {
    const [messages, setMessages] = useState([]);
    const [messageIds, setMessageIds] = useState(new Set());
    const [text, setText] = useState("");
    const [userName, setUserName] = useState("");
    const socket = useSocket();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const messagesContainerRef = useRef(null); // 채팅창의 스크롤 컨테이너

    const getUserName = async () => {
        try {
            const response = await getUserInfo(userId);
            if (response && response.name) {
                setUserName(response.name);
            } else {
                console.error("유저 이름 가져오기 실패: 이름이 존재하지 않습니다.");
            }
        } catch (error) {
            console.error("유저 이름 가져오기 중 오류:", error);
        }
    };

    const handleReceiveMessage = async (message) => {
        if (typeof message.sender === "string") {
            try {
                const user = await getUserInfo(message.sender);
                if (user && user.name) {
                    message.sender = { _id: message.sender, name: user.name };
                } else {
                    console.error("수신 메시지의 sender 정보 조회 실패");
                    return;
                }
            } catch (error) {
                console.error("sender 정보 조회 중 오류:", error);
                return;
            }
        }

        if (!messageIds.has(message._id)) {
            setMessages((prevMessages) => [...prevMessages, message]);
            setMessageIds((prevIds) => new Set(prevIds.add(message._id)));
        }
    };

    const handleLeaveRoom = () => {
        setIsModalOpen(true);
    };

    const confirmLeaveRoom = async () => {
        if (socket) {
            try {
                const response = await leaveChatRoom(roomId, userId);
                if (response.success) {
                    navigate("/chat", { replace: true }); // 뒤로가기 방지를 위해 replace: true 사용
                } else {
                    console.error("채팅방 나가기 실패:", response.message);
                }
            } catch (error) {
                console.error("채팅방 나가기 중 오류 발생:", error);
            }
        }
        setIsModalOpen(false);
    };

    const cancelLeaveRoom = () => {
        setIsModalOpen(false);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault(); // 엔터로 전송 시 페이지 새로고침 방지

        if (!text.trim() || !socket || !userName) {
            return;
        }

        const message = { chatRoom: roomId, sender: { _id: userId, name: userName }, text };
        socket.emit("sendMessage", message, (response) => {
            if (response.success) {
                const sentMessage = { ...message, _id: response.message._id };
                setMessages((prevMessages) => [
                    ...prevMessages.filter((msg) => msg._id !== sentMessage._id),
                    sentMessage,
                ]);
                setText("");
            } else {
                console.error("메시지 전송 실패", response);
            }
        });
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            await deleteMessage(messageId);
            setMessages((prevMessages) =>
                prevMessages.map((msg) => (msg._id === messageId ? { ...msg, isDeleted: true } : msg))
            );

            if (socket) {
                socket.emit("deleteMessage", { messageId, roomId });
            }
        } catch (error) {
            console.error("메시지 삭제 중 오류 발생:", error);
        }
    };

    const getChatRoomDetails = async () => {
        try {
            const roomInfo = await getChatRoomInfo(roomId);
            if (roomInfo && roomInfo.chatUsers.length >= roomInfo.capacity) {
                setIsLoading(false);
            }
        } catch (error) {
            console.error("채팅방 정보 가져오기 오류:", error);
        }
    };

    const handleUserJoined = (roomInfo) => {
        if (roomInfo.chatUsers.length >= roomInfo.capacity) {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages(roomId).then((fetchedMessages) => {
            setMessages(fetchedMessages);
        });

        getChatRoomDetails();

        if (socket) {
            socket.emit("joinRoom", roomId);
            socket.on("receiveMessage", handleReceiveMessage);
            socket.on("roomJoined", handleUserJoined);
            socket.on("userLeft", ({ userId }) => {
                console.log(`사용자 ${userId}가 채팅방을 떠났습니다.`);
            });

            socket.on("messageDeleted", ({ messageId }) => {
                setMessages((prevMessages) =>
                    prevMessages.map((msg) =>
                        msg._id === messageId ? { ...msg, isDeleted: true } : msg
                    )
                );
            });

            return () => {
                socket.off("receiveMessage", handleReceiveMessage);
                socket.off("messageDeleted");
                socket.off("userLeft");
                socket.off("roomJoined");
            };
        }

        getUserName();
    }, [roomId, socket, userId]);

    useEffect(() => {
        // 새로운 메시지가 도착할 때마다 채팅창의 끝으로 스크롤
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-lg">
            <h2 className="text-3xl font-semibold text-center text-blue-600 mb-6">채팅방 {roomId}</h2>

            {isLoading ? (
                <div className="flex justify-center items-center h-32 text-xl text-gray-500">
                    <span>다른 사용자 기다리는중...</span>
                </div>
            ) : (
                <>
                    <div
                        ref={messagesContainerRef}
                        className="space-y-4 mb-6 max-h-96 overflow-y-auto"
                    >
                        {messages.map((msg) => {
                            const uniqueKey = `${msg.sender._id}-${msg._id}-${msg.text}-${msg.timestamp}`;

                            return (
                                <div
                                    key={uniqueKey}
                                    className={`flex items-center space-x-3 p-4 rounded-lg shadow-md ${
                                        msg.sender._id === userId ? "bg-blue-100 justify-end" : "bg-gray-100"
                                    }`}
                                >
                                    <div className="flex flex-col space-y-1">
                                        <span className="text-blue-700">{msg.sender.name}</span>
                                        <strong>{msg.isDeleted ? "삭제된 메시지입니다." : msg.text}</strong>
                                    </div>

                                    {!msg.isDeleted && msg.sender._id === userId && (
                                        <button
                                            onClick={() => handleDeleteMessage(msg._id)}
                                            className="ml-4 text-red-600 hover:text-red-800 focus:outline-none"
                                        >
                                            삭제
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex space-x-3">
                        <form onSubmit={handleSendMessage} className="w-full flex space-x-3">
                            <input
                                type="text"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="메시지를 입력하세요..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none"
                            >
                                전송
                            </button>
                        </form>
                    </div>
                </>
            )}

            <button
                onClick={handleLeaveRoom}
                className="mt-6 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none"
            >
                채팅방 나가기
            </button>

            <CommonModal
                isOpen={isModalOpen}
                onClose={cancelLeaveRoom}
                title="채팅방을 나가시겠습니까?"
                onConfirm={confirmLeaveRoom}
            >
                채팅방을 나가면 현재 채팅 내용이 사라집니다.
            </CommonModal>
        </div>
    );
};

ChatRoom.propTypes = {
    roomId: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
};

export default ChatRoom;
