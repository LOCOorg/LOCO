import { useEffect, useState, useRef } from "react";
import { useSocket } from "../../hooks/useSocket.js";
import { fetchMessages, deleteMessage, leaveChatRoom, getChatRoomInfo } from "../../api/chatAPI.js";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { decrementChatCount, getUserInfo, rateUser } from "../../api/userAPI.js";
import CommonModal from "../../common/CommonModal.jsx";
import ReportForm from "../../components/reportcomponents/ReportForm.jsx";
// 프로필 모달을 위한 ProfileButton 컴포넌트를 import합니다.
import ProfileButton from "../../components/MyPageComponent/ProfileButton.jsx";

const ChatRoom = ({ roomId, userId }) => {
    const [messages, setMessages] = useState([]);
    const [messageIds, setMessageIds] = useState(new Set());
    const [text, setText] = useState("");
    const [userName, setUserName] = useState("");
    const socket = useSocket();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [ratings, setRatings] = useState({});
    const [participants, setParticipants] = useState([]);

    // 신고 모달 관련 상태
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportedParticipant, setReportedParticipant] = useState(null);

    const messagesContainerRef = useRef(null);

    // 메시지 전송 시간을 포맷하는 헬퍼 함수 (시간:분 형식)
    const formatTime = (textTime) => {
        if (!textTime) return "";
        const date = new Date(textTime);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getUserName = async () => {
        try {
            const response = await getUserInfo(userId);
            if (response && response.nickname) {
                setUserName(response.nickname);
            } else {
                console.error("유저 닉네임 가져오기 실패: 닉네임이 존재하지 않습니다.");
            }
        } catch (error) {
            console.error("유저 닉네임 가져오기 중 오류:", error);
        }
    };

    const handleReceiveMessage = async (message) => {
        if (typeof message.sender === "string") {
            try {
                const user = await getUserInfo(message.sender);
                if (user && user.nickname) {
                    message.sender = { _id: message.sender, ...user };
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

    // 채팅 종료 버튼 클릭 시 채팅방 정보를 불러와 참가자와 초기 따봉 상태(0)를 세팅
    const handleLeaveRoom = async () => {
        try {
            const roomInfo = await getChatRoomInfo(roomId);
            if (roomInfo && roomInfo.chatUsers) {
                setParticipants(roomInfo.chatUsers);
                const initialRatings = {};
                roomInfo.chatUsers.forEach((user) => {
                    const participantId = typeof user === "object" ? user._id : user;
                    if (participantId !== userId) {
                        initialRatings[participantId] = 0;
                    }
                });
                setRatings(initialRatings);
            }
        } catch (error) {
            console.error("채팅방 정보 가져오기 오류:", error);
        }
        setIsModalOpen(true);
    };

    // 매너 평가 토글 함수
    const handleRatingToggle = (participantId) => {
        setRatings((prev) => ({
            ...prev,
            [participantId]: prev[participantId] === 1 ? 0 : 1,
        }));
    };

    // 신고 모달 열기/닫기 함수
    const openReportModal = (participant) => {
        setReportedParticipant(participant);
        setShowReportModal(true);
    };

    const closeReportModal = () => {
        setReportedParticipant(null);
        setShowReportModal(false);
    };

    const handleReportCreated = () => {
        // 신고 작성 후 추가 동작이 필요하면 여기에 작성 (예: 알림 표시)
        closeReportModal();
    };

    const confirmLeaveRoom = async () => {
        try {
            // 매너 평가 점수 전송
            await Promise.all(
                Object.keys(ratings).map(async (participantId) => {
                    if (ratings[participantId] === 1) {
                        await rateUser(participantId, 1);
                    }
                })
            );
            // 채팅방 나가기 API 호출
            const response = await leaveChatRoom(roomId, userId);
            if (response.success) {
                // 채팅 횟수 감소 API 호출 추가
                await decrementChatCount(userId);
                navigate("/chat", { replace: true });
            } else {
                console.error("채팅방 나가기 실패:", response.message);
            }
        } catch (error) {
            console.error("채팅방 나가기 중 오류 발생:", error);
        }
        setIsModalOpen(false);
    };

    const cancelLeaveRoom = () => {
        setIsModalOpen(false);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!text.trim() || !socket || !userName) {
            return;
        }

        const message = { chatRoom: roomId, sender: { _id: userId, nickname: userName }, text };
        socket.emit("sendMessage", message, (response) => {
            if (response.success) {
                // 백엔드에서는 textTime 필드를 사용하도록 설정되어 있습니다.
                const sentMessage = { ...message, _id: response.message._id, textTime: response.message.textTime };
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
                    prevMessages.map((msg) => (msg._id === messageId ? { ...msg, isDeleted: true } : msg))
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
                            // 메시지 고유키에 textTime 필드를 사용합니다.
                            const uniqueKey = `${msg.sender._id}-${msg._id}-${msg.text}-${msg.textTime}`;
                            return (
                                <div
                                    key={uniqueKey}
                                    className={`flex items-center space-x-3 p-4 rounded-lg shadow-md ${
                                        msg.sender._id === userId ? "bg-blue-100 justify-end" : "bg-gray-100"
                                    }`}
                                >
                                    {msg.sender._id !== userId && (
                                        <ProfileButton profile={msg.sender} />
                                    )}

                                    <div className="flex flex-col space-y-1">
                                        <span className="text-blue-700">{msg.sender.nickname}</span>
                                        <strong>
                                            {msg.isDeleted ? "삭제된 메시지입니다." : msg.text}
                                        </strong>
                                        <span className="text-xs text-gray-500">
                                            {formatTime(msg.textTime)}
                                        </span>
                                    </div>

                                    {msg.sender._id === userId && (
                                        <ProfileButton profile={msg.sender} />
                                    )}

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
                채팅 종료
            </button>

            <CommonModal
                isOpen={isModalOpen}
                onClose={cancelLeaveRoom}
                title={
                    participants.filter((user) => {
                        const participantId = typeof user === "object" ? user._id : user;
                        return participantId !== userId;
                    }).length > 0
                        ? "채팅방 종료 및 매너 평가"
                        : "채팅 종료"
                }
                onConfirm={confirmLeaveRoom}
            >
                {participants.filter((user) => {
                    const participantId = typeof user === "object" ? user._id : user;
                    return participantId !== userId;
                }).length > 0 ? (
                    <div>
                        <p className="mb-4">
                            채팅 종료 전, 다른 참가자들의 매너를 평가 및 신고해주세요.
                        </p>
                        {participants
                            .filter((user) => {
                                const participantId = typeof user === "object" ? user._id : user;
                                return participantId !== userId;
                            })
                            .map((user) => {
                                const participantId = typeof user === "object" ? user._id : user;
                                const participantNickname =
                                    typeof user === "object" ? user.nickname : user;
                                const isRated = ratings[participantId] === 1;
                                return (
                                    <div key={participantId} className="my-2 flex items-center space-x-2">
                                        <span className="block font-medium">
                                            {participantNickname}
                                        </span>
                                        <button
                                            onClick={() => handleRatingToggle(participantId)}
                                            className={`border rounded px-2 py-1 focus:outline-none ${
                                                isRated ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
                                            }`}
                                        >
                                            👍
                                        </button>
                                        <button
                                            onClick={() => openReportModal(user)}
                                            className="border rounded px-2 py-1 focus:outline-none bg-red-500 text-white"
                                        >
                                            신고
                                        </button>
                                    </div>
                                );
                            })}
                    </div>
                ) : (
                    <div>
                        <p className="mb-4">채팅을 종료 하시겠습니까?</p>
                    </div>
                )}
            </CommonModal>

            {showReportModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg relative">
                        <button
                            onClick={closeReportModal}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
                        >
                            ×
                        </button>
                        <ReportForm
                            onReportCreated={handleReportCreated}
                            onClose={closeReportModal}
                            reportedUser={reportedParticipant}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

ChatRoom.propTypes = {
    roomId: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
};

export default ChatRoom;
