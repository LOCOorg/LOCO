import {useEffect, useState, useRef} from "react";
import {useSocket} from "../../hooks/useSocket.js";
import {fetchMessages, deleteMessage, leaveChatRoom, getChatRoomInfo} from "../../api/chatAPI.js";
import PropTypes from "prop-types";
import {useNavigate} from "react-router-dom";
import {decrementChatCount, getUserInfo, rateUser, getLeagueRecord} from "../../api/userAPI.js";
import CommonModal from "../../common/CommonModal.jsx";
import ProfileButton from "../../components/MyPageComponent/ProfileButton.jsx";
import LeagueRecordSection from "./LeagueRecordSection.jsx";
import useNotificationStore from '../../stores/notificationStore.js';
import { filterProfanity } from "../../utils/profanityFilter.js";
import MessageReportModal from "./MessageReportModal.jsx";

const ChatRoom = ({roomId, userId}) => {
    const [messages, setMessages] = useState([]);
    const [messageIds, setMessageIds] = useState(new Set());
    const [text, setText] = useState("");
    const [userName, setUserName] = useState("");
    const socket = useSocket();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ratings, setRatings] = useState({});
    const [participants, setParticipants] = useState([]);
    const [capacity, setCapacity] = useState(0);
    const [evaluationUsers,  setEvaluationUsers]= useState([]);  // 매너평가 대상

    const messagesContainerRef = useRef(null);

    // 전적 관련 상태
    const [partnerRecords, setPartnerRecords] = useState([]);
    const [recordsLoading, setRecordsLoading] = useState(true);
    const [recordsError, setRecordsError] = useState(null);
    const participantsRef = useRef(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    // 메시지 신고 모달 관련 상태
    const [showMessageReportModal, setShowMessageReportModal] = useState(false);
    const [reportTargetMessage, setReportTargetMessage] = useState(null);

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const { removeNotificationsByRoom } = useNotificationStore();
    const wordFilterEnabled = useNotificationStore(state => state.wordFilterEnabled);

    useEffect(() => {
        if (roomId) {
            removeNotificationsByRoom(roomId);
        }
    }, [roomId, removeNotificationsByRoom]);

    // 메시지 전송 시간을 포맷하는 헬퍼 함수 (시간:분 형식)
    const formatTime = (textTime) => {
        if (!textTime) return "";
        const date = new Date(textTime);
        return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
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
        // 현재 채팅방의 메시지만 처리
        if (message.chatRoom !== roomId) return;

        if (typeof message.sender === "string") {
            try {
                const user = await getUserInfo(message.sender);
                if (user && user.nickname) {
                    message.sender = {_id: message.sender, ...user};
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
            const roomInfo = await getChatRoomInfo(roomId);  // DB에서 전체 인원 재조회
            if (roomInfo && roomInfo.chatUsers) {
                setEvaluationUsers(roomInfo.chatUsers);        // UI-리스트는 그대로 두고
                const init = {};
                roomInfo.chatUsers.forEach(u => {
                    const id = typeof u === "object" ? u._id : u;
                    if (id !== userId) init[id] = 0;
                });
                setRatings(init);
            }
        } catch (err) {
            console.error("채팅방 정보 가져오기 오류:", err);
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




    const confirmLeaveRoom = async () => {
        try {
            /* 0) 현재 방 상태 재조회 ― 활성화됐는지 확인 */
            const roomInfo = await getChatRoomInfo(roomId);     // 🗝️[1]
            const isChatActive =
                roomInfo?.isActive ||                  // 스키마의 isActive 필드[6]
                roomInfo?.status === "active" ||       // 백엔드에서 관리하는 status
                (roomInfo?.activeUsers?.length ?? 0) >= roomInfo?.capacity; // 예비용

            /* 1) 매너 평가(채팅이 실제로 진행된 경우에만 의미가 있으므로 isChatActive 검사) */
            if (isChatActive) {
                await Promise.all(
                    Object.keys(ratings).map(async (participantId) => {
                        if (ratings[participantId] === 1) {
                            await rateUser(participantId, 1);
                        }
                    })
                );
            }

            /* 2) 방 나가기 */
            const response = await leaveChatRoom(roomId, userId);
            if (response.success) {
                /* 3) 🔻 채팅 횟수 차감은 ‘진짜’ 채팅이 시작된 방만 */
                if (isChatActive) {
                    await decrementChatCount(userId);    // ✅ 필요할 때만 호출
                }

                /* 4) 소켓 정리 */
                if (socket) socket.emit("leaveRoom", { roomId, userId });

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

        const emitMessage = { chatRoom: roomId, sender: userId, text, roomType: "random" };

        socket.emit("sendMessage", emitMessage, (response) => {
            if (response.success) {
                // 서버로부터 받은 필터링된 메시지로 상태를 업데이트합니다.
                const receivedMessage = {
                    ...response.message,
                    sender: { _id: userId, nickname: userName } // sender 정보를 프론트엔드 형식에 맞게 재구성
                };
                setMessages(prev =>
                    [...prev.filter(m => m._id !== receivedMessage._id), receivedMessage]);
                setText("");
            } else {
                console.error("메시지 전송 실패", response);
            }
        });
    };

// 삭제 버튼 클릭 시 모달 열기
    const onDeleteButtonClick = (messageId) => {
        setDeleteTargetId(messageId);
        setShowDeleteModal(true);
    };

// 모달에서 “확인” 클릭 시 실제 삭제
    const confirmDelete = async () => {
        try {
            await deleteMessage(deleteTargetId);
            setMessages((prev) =>
                prev.map((msg) =>
                    msg._id === deleteTargetId ? { ...msg, isDeleted: true } : msg
                )
            );
            if (socket) {
                socket.emit("deleteMessage", { messageId: deleteTargetId, roomId });
            }
        } catch (error) {
            console.error("메시지 삭제 중 오류 발생:", error);
        }
        setShowDeleteModal(false);
        setDeleteTargetId(null);
    };

// 모달에서 “취소” 클릭 시 닫기
    const cancelDelete = () => {
        setShowDeleteModal(false);
        setDeleteTargetId(null);
    };

// ============================================================================
//   🚨 메시지 신고 관련 함수들
// ============================================================================

    // 메시지 신고 모달 열기
    const openMessageReportModal = (message) => {
        setReportTargetMessage(message);
        setShowMessageReportModal(true);
    };

    // 메시지 신고 모달 닫기
    const closeMessageReportModal = () => {
        setReportTargetMessage(null);
        setShowMessageReportModal(false);
    };


    const getChatRoomDetails = async () => {
        try {
            const roomInfo = await getChatRoomInfo(roomId);
            if (roomInfo && roomInfo.chatUsers) {
                // ① participants 상태에 저장
                setParticipants(roomInfo.activeUsers);
                setCapacity(roomInfo.capacity);
            }
        } catch (error) {
            console.error("채팅방 정보 가져오기 오류:", error);
        }
    };


    const handleUserLeft = ({ userId: leftId }) => {
        setParticipants(prev =>
            prev.filter(u =>
                (typeof u === "object" ? u._id : u) !== leftId
            )
        );
    };

    const handleSystemMessage = (msg) => {
        setMessages(prev => [...prev, msg]);
    };


    useEffect(() => {
        fetchMessages(roomId).then((data) => {
            if (data && data.messages) {
                setMessages(data.messages);
            }
        });

        getChatRoomDetails();

        if (socket) {
            socket.emit("joinRoom", roomId, "random");
            // 참가자 입장 시: ID → { _id, nickname } 형태로 변환
            socket.on("roomJoined", async ({ roomId: eventRoomId, activeUsers, capacity }) => {
                try {
                    if (eventRoomId !== roomId) return; // ✅ roomId 검증
                    const participantsWithNames = await Promise.all(
                        activeUsers.map(async u => {
                            const id = typeof u === "object" ? u._id : u;
                            const userInfo = await getUserInfo(id);
                            return { _id: id, nickname: userInfo.nickname || "알 수 없음" };
                        })
                    );
                    setParticipants(participantsWithNames);
                    setCapacity(capacity);
                } catch (err) {
                    console.error("참가자 정보 조회 오류:", err);
                }
            });
            socket.on("receiveMessage", handleReceiveMessage);
            socket.on("userLeft", handleUserLeft);
            socket.on("systemMessage", handleSystemMessage);
            socket.on("messageDeleted", ({messageId}) => {
                setMessages((prevMessages) =>
                    prevMessages.map((msg) => (msg._id === messageId ? {...msg, isDeleted: true} : msg))
                );
            });

            return () => {
                socket.off("roomJoined");
                socket.off("receiveMessage", handleReceiveMessage);
                socket.off("messageDeleted");
                socket.off("userLeft", handleUserLeft);
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
    // ChatRoom.jsx의 useEffect 부분을 다음과 같이 수정
    useEffect(() => {
        if (participants.length < 2 || participantsRef.current) return;

        participantsRef.current = true;

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
                    console.error('전적 조회 오류:', err);
                    return { participantId, userInfo: null, leagueRecord: null, error: err.message };
                }
            })
        )
            .then(results => {
                setPartnerRecords(results);
                setRecordsLoading(false);
            })
            .catch(err => {
                console.error('전적 조회 전체 오류:', err);
                setRecordsError(err.message);
                setRecordsLoading(false);
            });
    }, [participants, userId]);


    return (
        <div
            className="max-w-6xl mx-auto h-screen flex flex-col md:flex-row p-6 space-y-6 md:space-y-0 md:space-x-8 bg-gradient-to-br from-indigo-50 to-purple-50">
            {/* ─── 채팅 섹션 ─── */}
            <section className="flex-1 flex flex-col bg-white shadow-2xl rounded-xl overflow-hidden">
                <header className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6">
                    {/* 채팅방 제목 & 인원 수 */}
                    <h2 className="font-bold tracking-wide text-lg">
                        채팅방 ({participants.length}/{capacity}명)
                    </h2>

                    {/* 참가자 리스트 */}
                    <div className="mt-2 flex flex-wrap gap-2 text-sm">
                        {participants.map(user => (
                            <div key={user._id} className="flex items-center bg-white bg-opacity-20 rounded px-3 py-1 text-black">
                                <ProfileButton profile={user} className="mr-1" area="프로필" onModalToggle={setIsProfileOpen}/>
                                <span className="text-white">{user.nickname}</span>
                            </div>
                        ))}
                    </div>

                </header>

                        <div
                            ref={messagesContainerRef}
                            className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50"
                        >
                            {messages.map(msg => {
                                /* 시스템-메시지라면 중앙 정렬 회색 글씨로 */
                                if (msg.isSystem) {
                                    return (
                                        <div key={msg._id} className="text-center text-gray-500 text-sm">
                                            {msg.text}
                                        </div>
                                    );
                                }
                                const isMe = msg.sender._id === userId;
                                return (
                                    <div
                                        key={`${msg._id}-${msg.textTime}`}
                                        className={`flex items-start gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {/* 프로필 */}
                                        {!isMe && (
                                            <ProfileButton
                                                profile={msg.sender}
                                                area="프로필"
                                                onModalToggle={setIsProfileOpen}
                                            />
                                        )}

                                        {/* 닉네임과 메시지 컨테이너 */}
                                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            {/* 닉네임 */}
                                            {!isMe && (
                                                <span className="text-sm font-semibold text-gray-800 mb-1">
                                                    {msg.sender.nickname}
                                                </span>
                                            )}

                                            {/* 말풍선과 시간 */}
                                            <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <div
                                                    className={`relative max-w-full p-3 rounded-lg shadow ${isMe ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'}`}
                                                >
                                                    <p className="whitespace-pre-wrap break-all">
                                                        {msg.isDeleted ? '삭제된 메시지입니다.' : (wordFilterEnabled ? filterProfanity(msg.text) : msg.text)}
                                                    </p>
                                                    
                                                    {/* 상대방 메시지에 신고 버튼 추가 */}
                                                    {!isMe && !msg.isDeleted && !msg.isSystem && (
                                                        <button
                                                            onClick={() => openMessageReportModal(msg)}
                                                            className="absolute -top-1 -right-1 bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
                                                            title="메시지 신고"
                                                        >
                                                            ⋯
                                                        </button>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-400 pb-1">
                                                    {formatTime(msg.textTime)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 내 메시지일 때 프로필 & 삭제 버튼 */}
                                        {isMe && !msg.isDeleted && (
                                            <button
                                                onClick={() => onDeleteButtonClick(msg._id)}
                                                className="ml-2 text-red-600 hover:text-red-800 focus:outline-none self-end"
                                                title="메시지 삭제"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <CommonModal
                            isOpen={showDeleteModal}
                            onClose={cancelDelete}
                            title="메시지 삭제 확인"
                            onConfirm={confirmDelete}
                        >
                            <p>이 메시지를 정말 삭제하시겠습니까?</p>
                        </CommonModal>


                        {/* 입력 폼 */}
                        {!isProfileOpen && (
                        <form
                            onSubmit={handleSendMessage}
                            className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex items-center space-x-3"
                        >
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={text}
                                    onChange={e => {
                                        if (e.target.value.length <= 100) {
                                            setText(e.target.value);
                                        }
                                    }}
                                    placeholder="메시지를 입력하세요…"
                                    maxLength={100}
                                    className="w-full border border-gray-300 rounded-full px-5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition pr-20"
                                />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                    {text.length}/100
                                </span>
                            </div>
                            <button
                                type="submit"
                                className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full shadow-lg hover:from-indigo-600 hover:to-purple-600 focus:outline-none transition"
                            >
                                전송
                            </button>
                        </form>
                            )}

            </section>

            {/* 채팅 종료 버튼 */}
            <button
                onClick={handleLeaveRoom}
                className="fixed bottom-6 right-6 bg-red-500 text-white p-4 rounded-full shadow-2xl hover:bg-red-600 focus:outline-none transition"
                title="채팅 종료"
            >
                🚪 채팅 종료
            </button>

            <CommonModal
                isOpen={isModalOpen}
                onClose={cancelLeaveRoom}
                title={
                    evaluationUsers.filter((user) => {
                        const participantId = typeof user === "object" ? user._id : user;
                        return participantId !== userId;
                    }).length > 0
                        ? "채팅방 종료 및 매너 평가"
                        : "채팅 종료"
                }
                onConfirm={confirmLeaveRoom}
            >
                {evaluationUsers.filter((user) => {
                    const participantId = typeof user === "object" ? user._id : user;
                    return participantId !== userId;
                }).length > 0 ? (
                    <div>
                        <p className="mb-4">
                            채팅 종료 전,
                            다른 참가자들의 매너를 평가 해주세요.
                        </p>
                        {evaluationUsers
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
            
            {/* 메시지 신고 모달 */}
            <MessageReportModal
                isOpen={showMessageReportModal}
                onClose={closeMessageReportModal}
                message={reportTargetMessage}
                roomType="random"
            />
            
            {/* ─── 전적 섹션 ─── */}
            <LeagueRecordSection
                partnerRecords={partnerRecords}
                loading={recordsLoading}
                error={recordsError}
            />
        </div>
    );
};

ChatRoom.propTypes = {
    roomId: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
};

export default ChatRoom;
