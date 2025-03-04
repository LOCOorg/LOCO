import {useEffect, useState} from "react";
import {useSocket} from "../../hooks/useSocket.js";
import {fetchMessages, deleteMessage, leaveChatRoom} from "../../api/chatAPI.js";
import PropTypes from "prop-types";
import {useNavigate} from "react-router-dom";
import {getUserInfo} from "../../api/userAPI.js";

const ChatRoom = ({roomId, userId}) => {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [userName, setUserName] = useState(""); // 사용자 이름 상태 추가
    const socket = useSocket();
    const navigate = useNavigate();

    // 유저 이름 가져오기
    const getUserName = async () => {
        try {
            const response = await getUserInfo(userId); // 유저 정보 가져오기
            console.log("유저 정보 응답:", response);

            if (response && response.name) {
                setUserName(response.name); // 이름 설정
            } else {
                console.error("유저 이름 가져오기 실패: 이름이 존재하지 않습니다.");
            }
        } catch (error) {
            console.error("유저 이름 가져오기 중 오류:", error);
        }
    };


    // 메시지 수신 처리
    const handleReceiveMessage = async (message) => {
        console.log("새 메시지 수신:", message);

        if (typeof message.sender === "string") {
            try {
                const user = await getUserInfo(message.sender);
                if (user && user.name) {
                    message.sender = { _id: message.sender, name: user.name };
                } else {
                    console.error("수신 메시지의 sender 정보 조회 실패");
                    return; // 유저 정보가 없으면 추가하지 않음
                }
            } catch (error) {
                console.error("sender 정보 조회 중 오류:", error);
                return;
            }
        }

        // 내가 보낸 메시지는 추가하지 않음
        if (message.sender._id !== userId) {
            setMessages((prevMessages) => [...prevMessages, message]);
        }
    };


    // 채팅방 나가기 처리
    const handleLeaveRoom = async () => {
        if (socket) {
            try {
                const response = await leaveChatRoom(roomId, userId);
                if (response.success) {
                    navigate("/chat"); // /chat 페이지로 이동
                } else {
                    console.error("채팅방 나가기 실패:", response.message);
                }
            } catch (error) {
                console.error("채팅방 나가기 중 오류 발생:", error);
            }
        }
    };

    // 메시지 전송 처리
    const handleSendMessage = async () => {
        console.log("메시지 전송 준비:", { text, userName, socket });

        if (!text.trim() || !socket || !userName) {
            console.log("전송할 수 없는 조건:", { text, socket, userName });
            return;
        }

        const message = { chatRoom: roomId, sender: { _id: userId, name: userName }, text };

        // UI에 메시지 추가 (내가 보낸 메시지는 UI에 즉시 추가)
        const tempMessage = { ...message, _id: Date.now().toString() };
        console.log("보낼 메시지:", tempMessage);
        setMessages((prevMessages) => [...prevMessages, tempMessage]);

        // 서버로 메시지 전송
        socket.emit("sendMessage", message, (response) => {
            console.log("서버 응답:", response);
            if (response.success) {
                // 서버에서 반환된 실제 messageId로 상태 업데이트
                setMessages((prevMessages) =>
                    prevMessages.map((msg) =>
                        msg._id === tempMessage._id ? { ...msg, _id: response.message._id } : msg
                    )
                );
                setText(""); // 성공적으로 메시지를 보냈다면 텍스트 초기화
            } else {
                console.error("메시지 전송 실패", response);
            }
        });
    };




// 메시지 삭제 처리
    const handleDeleteMessage = async (messageId) => {
        try {
            await deleteMessage(messageId);

            // 내 화면에서 즉시 업데이트
            setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                    msg._id === messageId ? { ...msg, isDeleted: true } : msg
                )
            );

            // 소켓을 통해 상대방에게 메시지 삭제 알림
            if (socket) {
                socket.emit("deleteMessage", { messageId, roomId });
            }
        } catch (error) {
            console.error("메시지 삭제 중 오류 발생:", error);
        }
    };



    useEffect(() => {
        fetchMessages(roomId).then((fetchedMessages) => {
            console.log("초기 메시지 가져오기:", fetchedMessages);
            setMessages(fetchedMessages);
        });

        if (socket) {
            socket.emit("joinRoom", roomId);
            socket.on("receiveMessage", handleReceiveMessage);
            socket.on("userLeft", ({userId}) => {
                console.log(`🚪 사용자 ${userId}가 채팅방을 떠났습니다.`);
            });
            // 상대방이 메시지를 삭제하면 내 화면에서도 반영
            socket.on("messageDeleted", ({ messageId }) => {
                console.log("메시지 삭제 이벤트 수신:", messageId);
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
            };
        }

        getUserName();
    }, [roomId, socket, userId]);


    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 text-center">채팅방 {roomId}</h2>

            <div className="space-y-4 mb-4">
                {messages.map((msg) => (
                    <div
                        key={msg._id}
                        className={`flex items-center space-x-2 p-3 rounded-lg shadow-sm ${
                            msg.sender._id === userId ? "justify-end bg-blue-100" : "bg-gray-200"
                        }`}
                    >
                        <div className="flex items-center space-x-2">
                            <strong className="text-blue-600">{msg.sender.name}</strong>
                            <span>{msg.isDeleted ? "삭제된 메시지입니다." : msg.text}</span>
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

            <button
                onClick={handleLeaveRoom}
                className="mt-4 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none"
            >
                채팅방 나가기
            </button>
        </div>
    );
};

// ✅ PropTypes 설정 추가
ChatRoom.propTypes = {
    roomId: PropTypes.string.isRequired, // roomId는 필수 string
    userId: PropTypes.string.isRequired, // userId는 필수 string
};

export default ChatRoom;
