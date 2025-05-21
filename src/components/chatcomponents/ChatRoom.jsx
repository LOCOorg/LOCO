import { useEffect, useState, useRef } from "react";
import { useSocket } from "../../hooks/useSocket.js";
import { fetchMessages, deleteMessage, leaveChatRoom, getChatRoomInfo } from "../../api/chatAPI.js";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { decrementChatCount, getUserInfo, rateUser, getLeagueRecord } from "../../api/userAPI.js";
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

    // 전적 관련 상태
    const [partnerRecords, setPartnerRecords] = useState([]);
    const [recordsLoading, setRecordsLoading] = useState(true);
    const [recordsError, setRecordsError] = useState(null);
    const participantsRef = useRef(false);

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
            if (roomInfo && roomInfo.chatUsers) {
                // ① participants 상태에 저장
                setParticipants(roomInfo.chatUsers);
                // ② capacity 충족 여부에 따라 로딩 해제
                if (roomInfo.chatUsers.length >= roomInfo.capacity) {
                    setIsLoading(false);
                }
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
    // ────────── ③ participants 변경 시 상대 소환사명으로 전적 조회 ──────────
    // 채팅방 참가자 변경 시 상대방 Riot ID로 전적 조회
    useEffect(() => {
        if (participants.length < 2 || participantsRef.current) return;
        const otherIds = participants
            .map(u => (typeof u === "object" ? u._id : u))
            .filter(id => id !== userId);

        setRecordsLoading(true);
        setRecordsError(null);

        Promise.all(
            otherIds.map(async participantId => {
                try {
                    const userInfo = await getUserInfo(participantId);
                    const { riotGameName, riotTagLine } = userInfo;
                    if (!riotGameName || !riotTagLine) {
                        throw new Error("Riot ID 정보가 없습니다.");
                    }
                    const leagueRecord = await getLeagueRecord(riotGameName, riotTagLine);
                    return { participantId, userInfo, leagueRecord, error: null };
                } catch (err) {
                    return { participantId, userInfo: null, leagueRecord: null, error: err.message };
                }
            })
        )
            .then(results => {
                setPartnerRecords(results);
                setRecordsLoading(false);
                participantsRef.current = true;
            })
            .catch(err => {
                setRecordsError(err.message);
                setRecordsLoading(false);
            });
    }, [participants, userId]);

    return (
        <div className="max-w-6xl mx-auto h-screen flex flex-col md:flex-row p-4 space-y-6 md:space-y-0 md:space-x-6">
            {/* ─── 채팅 섹션 ─── */}
            <section className="flex-1 flex flex-col bg-white shadow-lg rounded-lg overflow-hidden">
                <header className="sticky top-0 bg-blue-600 text-white p-4 font-semibold">
                    채팅방 {roomId}
                </header>
                {isLoading ? (
                    <div className="flex justify-center items-center h-32 text-xl text-gray-500">
                        <span>다른 사용자 기다리는중...</span>
                    </div>
                ) : (
                    <>
                <div
                    ref={messagesContainerRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
                >
                    {messages.map(msg => (
                        <div
                            key={`${msg._id}-${msg.textTime}`}
                            className={`flex items-start space-x-3 p-3 rounded-lg ${
                                msg.sender._id === userId
                                    ? "bg-blue-100 justify-end"
                                    : "bg-white"
                            } shadow`}
                        >
                            {msg.sender._id !== userId && <ProfileButton profile={msg.sender} />}
                            <div className="flex flex-col space-y-1">
                                <span className="text-sm font-medium text-blue-700">{msg.sender.nickname}</span>
                                <p className="text-gray-800">{msg.isDeleted ? "삭제된 메시지입니다." : msg.text}</p>
                                <span className="text-xs text-gray-500">{formatTime(msg.textTime)}</span>
                            </div>
                            {msg.sender._id === userId && <ProfileButton profile={msg.sender} />}
                            {msg.sender._id === userId && !msg.isDeleted && (
                                <button
                                    onClick={() => handleDeleteMessage(msg._id)}
                                    className="ml-2 text-red-600 hover:text-red-800 focus:outline-none"
                                >
                                    삭제
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <form onSubmit={handleSendMessage} className="sticky bottom-0 bg-white border-t p-4 flex space-x-2">
                    <input
                        type="text"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="메시지를 입력하세요…"
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none"
                    >
                        전송
                    </button>
                </form>
                    </>
                )}
            </section>


            <button
                onClick={handleLeaveRoom}
                className="fixed bottom-6 right-6 bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 focus:outline-none z-50"
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
            {/* ─── 전적 섹션 ─── */}
            <aside className="w-full md:w-1/3 bg-gray-50 shadow-inner rounded-lg overflow-y-auto p-6">
                <h3 className="text-xl font-bold mb-4">상대방 전적</h3>

                {recordsLoading && <p>로딩 중…</p>}
                {recordsError && <p className="text-red-500">{recordsError}</p>}

                {partnerRecords.map(({ participantId, userInfo, leagueRecord, error }) => (
                    <div key={participantId} className="mb-6 border-b pb-4">
                        {error ? (
                            <p className="text-red-500">{userInfo?.nickname || "사용자"}: {error}</p>
                        ) : (
                            <>
                                <div className="mb-2">
                                    <span className="font-medium">{userInfo.nickname}</span>
                                    <span className="text-sm text-gray-600 ml-2">
                    ({userInfo.riotGameName}#{userInfo.riotTagLine})
                  </span>
                                </div>
                                <div className="text-center mb-2">
                                    <p className="text-lg">
                                        <strong>티어:</strong> {leagueRecord.tier} {leagueRecord.rank} ({leagueRecord.leaguePoints} LP)
                                    </p>
                                    <p className="text-2xl text-blue-600">
                                        <strong>승률:</strong> {leagueRecord.overallWinRate}%
                                    </p>
                                </div>
                                {leagueRecord.recentRanked.length > 0 ? (
                                    <ul className="space-y-2 text-sm">
                                        {leagueRecord.recentRanked.map(game => (
                                            <li key={game.matchId} className="flex justify-between bg-white p-2 rounded shadow-sm">
                                                <span><strong>{game.champion}</strong> {game.win ? "승" : "패"}</span>
                                                <div className="flex space-x-2">
                                                    <span>KDA {game.kda}</span>
                                                    <span>CS {game.cs}</span>
                                                    <span>{Math.floor(game.duration/60)}:{String(game.duration % 60).padStart(2, "0")}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-center text-gray-500">아직 랭크전 전적이 없습니다.</p>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </aside>
        </div>
    );
};

ChatRoom.propTypes = {
    roomId: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
};

export default ChatRoom;
