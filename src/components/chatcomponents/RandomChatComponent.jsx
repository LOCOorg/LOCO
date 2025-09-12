import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../hooks/useSocket.js";
import {
    getUserInfo,
    getBlockedUsers,
    unblockUser
} from "../../api/userAPI";
import {
    createChatRoom,
    joinChatRoom,
    fetchChatRooms,
    fetchUserLeftRooms, leaveChatRoom
} from "../../api/chatAPI";
import CommonModal from "../../common/CommonModal";
import SimpleProfileModal from "../MyPageComponent/SimpleProfileModal.jsx";
import useAuthStore from "../../stores/authStore.js";
import useBlockedStore from "../../stores/useBlockedStore.js";

const RandomChatComponent = () => {
    const [capacity, setCapacity] = useState(2);
    const [matchedGender, setMatchedGender] = useState("any");
    const [userInfo, setUserInfo] = useState(null);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [modalTitle, setModalTitle] = useState("");
    const [modalButtons, setModalButtons] = useState([]);
    const [showBlockedModal, setShowBlockedModal] = useState(false);
    const [timeLeft, setTimeLeft]   = useState(null);   // ☆ 추가
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    const [waitingRoomId, setWaitingRoomId] = useState(null);
    const [currentParticipants, setCurrentParticipants] = useState([]);
    const [waitingCapacity, setWaitingCapacity] = useState(0);
    const [showWaitingModal, setShowWaitingModal] = useState(false);

    const socket = useSocket(); // 소켓 연결

    const blockedUsers          = useBlockedStore((s) => s.blockedUsers);
    const setBlockedUsersStore  = useBlockedStore((s) => s.setBlockedUsers);
    const removeBlockedUser     = useBlockedStore((s) => s.removeBlockedUser);

    const navigate = useNavigate();
    const authUser = useAuthStore((state) => state.user);
    const userId = authUser?._id;

    const genderLabels = {
        any: "상관없음",
        same: "동성",
        opposite: "이성"
    };

    // 컴포넌트 최상단(훅들 위쪽)에 추가
    const formatToKST = (isoString) => {
        if (!isoString) return "-";          // 값이 없으면 그대로 대시
        return new Date(isoString).toLocaleString("ko-KR", {
            timeZone: "Asia/Seoul",            // KST 지정
            year:  "numeric",
            month: "2-digit",
            day:   "2-digit",
            hour:  "2-digit",
            minute:"2-digit",
        });
    };


    // // 생년월일을 이용한 나이 계산 함수
    // const calculateAge = (birthdate) => {
    //     const today = new Date();
    //     const birth = new Date(birthdate);
    //     let age = today.getFullYear() - birth.getFullYear();
    //     const m = today.getMonth() - birth.getMonth();
    //     if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    //     return age;
    // };

    // ① 주기적 카운트다운
    useEffect(() => {
        if (!userInfo?.nextRefillAt) return;

        const tick = () => {
            const diff = new Date(userInfo.nextRefillAt) - Date.now();
            if (diff <= 0) {
                setTimeLeft(null);
                return;
            }
            const h = String(Math.floor(diff / 3_600_000)).padStart(2, "0");
            const m = String(Math.floor((diff % 3_600_000) / 60_000)).padStart(2, "0");
            const s = String(Math.floor((diff % 60_000) / 1_000)).padStart(2, "0");
            setTimeLeft(`${h}:${m}:${s}`);
        };
        tick();                               // 최초 계산
        const id = setInterval(tick, 1_000);  // 1 초마다 갱신
        return () => clearInterval(id);       // 클린업
    }, [userInfo?.nextRefillAt]);

    // 소켓 이벤트 리스너 설정
    useEffect(() => {
        if (!socket || !isWaiting) return;

        // 사용자가 방에 참가했을 때
        const handleRoomJoined = ({ roomId, activeUsers, capacity }) => {
            if (roomId === waitingRoomId) {
                setCurrentParticipants(activeUsers);
                setWaitingCapacity(capacity);

                // 방이 가득 찼으면 ChatRoom으로 이동
                if (activeUsers.length >= capacity) {
                    setIsWaiting(false);
                    setShowWaitingModal(false);
                    navigate(`/chat/${roomId}/${userId}`);
                }
            }
        };

        // 사용자가 방을 떠났을 때
        const handleUserLeft = ({ roomId, activeUsers }) => {
            if (roomId === waitingRoomId) {
                setCurrentParticipants(activeUsers);
            }
        };

        socket.on("roomJoined", handleRoomJoined);
        socket.on("userLeft", handleUserLeft);

        return () => {
            socket.off("roomJoined", handleRoomJoined);
            socket.off("userLeft", handleUserLeft);
        };
    }, [socket, isWaiting, waitingRoomId, userId, navigate]);

    // 유저 정보 호출 함수
    const fetchUserInfoAsync = async (userId) => {
        try {
            const data = await getUserInfo(userId);
            setUserInfo(data);
            const blocked = await getBlockedUsers(userId);
            setBlockedUsersStore(blocked);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        if (userId) fetchUserInfoAsync(userId);
    }, [userId]);

    // 차단 해제
    const handleUnblock = async (blockedUserId) => {
        try {
            await unblockUser(userId, blockedUserId);
            removeBlockedUser(blockedUserId);
            setModalTitle("성공");
            setModalMessage("차단이 해제되었습니다.");
            setModalButtons([{ text: "확인", action: () => setModalOpen(false) }]);
            setModalOpen(true);
        } catch {
            setModalTitle("에러");
            setModalMessage("차단 해제에 실패했습니다.");
            setModalButtons([{ text: "확인", action: () => setModalOpen(false) }]);
            setModalOpen(true);
        }
    };

    // 프로필 클릭 핸들러
    const handleProfileClick = (user) => {
        setSelectedProfile(user);
        setShowProfileModal(true);
    };

    // 프로필 모달 닫기
    const handleCloseProfileModal = () => {
        setShowProfileModal(false);
        setSelectedProfile(null);
    };

    // 듀오 찾기 찾기 및 생성 함수
    const findOrCreateRandomRoom = async (capacity, matchedGender) => {
        if (!userId) return;

        try {
            /* ─── 1. 사전 유효성 검사 – 기존 로직 그대로 ─── */
            if (capacity < 2 || capacity > 5) {
                setModalTitle("경고");
                setModalMessage("참여 인원은 2~5명 사이로 입력해주세요.");
                setModalButtons([{ text: "확인", action: () => setModalOpen(false) }]);
                setModalOpen(true);
                return;
            }

            if (!userInfo) {
                setModalTitle("경고");
                setModalMessage("유저 정보를 불러오는 중입니다.");
                setModalButtons([{ text: "확인", action: () => setModalOpen(false) }]);
                setModalOpen(true);
                return;
            }

            if (userInfo.numOfChat === 0) {
                setModalTitle("경고");
                setModalMessage("채팅횟수가 부족하여 듀오 찾기을 이용할 수 없습니다.");
                setModalButtons([{ text: "확인", action: () => setModalOpen(false) }]);
                setModalOpen(true);
                return;
            }

            if (
                userInfo.reportStatus !== "active" &&
                userInfo.reportTimer &&
                new Date(userInfo.reportTimer) > new Date()
            ) {
                // ── KST 시각과 남은 시간을 계산
                const banEnd   = formatToKST(userInfo.reportTimer);
                const diff     = new Date(userInfo.reportTimer) - new Date();
                const mins     = Math.floor(diff / 60000);
                const hours    = Math.floor(mins  / 60);
                const days     = Math.floor(hours / 24);
                const remain   =
                    (days  ? `${days}일 `         : "") +
                    (hours % 24 ? `${hours % 24}시간 ` : "") +
                    (mins  % 60 ? `${mins  % 60}분`   : "");

                setModalTitle("채팅 제한");
                setModalMessage(
                    `신고로 인해 현재 듀오 찾기 이용 제한\n` +
                    `남은 시간: ${remain.trim()}\n` +
                    `해제 시각: ${banEnd}`
                );
                setModalButtons([{ text: "확인", action: () => setModalOpen(false) }]);
                setModalOpen(true);
                return;
            }

            /* ─── 2. 실제 방 탐색/참가를 담당할 내부 재귀 함수 ─── */
            const tryMatch = async () => {
                // const age         = calculateAge(userInfo.birthdate);
                const age = userInfo.calculatedAge;
                const ageGroup    = age >= 19 ? "adult" : "minor";
                const blockedIds  = (blockedUsers || []).map((u) => u._id);

                // (1) 방 목록 조회
                const query = {
                    roomType: "random",
                    ...(matchedGender !== "any" && { matchedGender }),
                    ageGroup,
                    userId
                };
                const rooms = await fetchChatRooms(query);

                // (2) 내가 이미 참여중인 방?
                const leftRooms = await fetchUserLeftRooms(userId);
                const existingRoom = rooms.find(
                    (room) =>
                        room.chatUsers.some((u) => u._id === userId) &&
                        !leftRooms.includes(room._id) &&
                        !room.chatUsers.some((u) => blockedIds.includes(u._id))
                );
                if (existingRoom) {
                    setModalTitle("알림");
                    setModalMessage("이미 참여중인 채팅방으로 이동합니다.");
                    setModalButtons([
                        {
                            text: "확인",
                            action: () => navigate(`/chat/${existingRoom._id}/${userId}`)
                        }
                    ]);
                    setModalOpen(true);
                    return;
                }

                // (3) 차단된 유저가 없는 대기방 필터링
                const availableRooms = rooms.filter((room) => {
                    if (leftRooms.includes(room._id))  return false;
                    if (room.capacity !== capacity) return false;
                    if (room.chatUsers.length >= room.capacity) return false;
                    if (room.isActive || room.status !== "waiting") return false;

                    if (
                        matchedGender === "same" &&
                        (room.matchedGender !== "same" ||
                            room.chatUsers.some((u) => u.gender !== userInfo.gender))
                    )
                        return false;
                    if (
                        matchedGender === "opposite" &&
                        (room.matchedGender !== "opposite" ||
                            room.chatUsers.every((u) => u.gender === userInfo.gender))
                    )
                        return false;

                    if (room.ageGroup !== ageGroup) return false;
                    if (room.chatUsers.some((u) => blockedIds.includes(u._id))) return false;  // 내가 차단
                    /* 👇 추가: 상대가 나를 차단한 방도 제외 */
                    if (room.chatUsers.some((u) => (u.blockedUsers || []).includes(userId))) return false;

                    return true;
                });

                // (3-A) 참여 가능한 대기방이 존재할 때
                if (availableRooms.length) {
                    const target = availableRooms[Math.floor(Math.random() * availableRooms.length)];
                    setModalTitle("알림");
                    setModalMessage(
                        `듀오 찾기(${capacity}명, ${genderLabels[matchedGender]})에 참가합니다.`
                    );
                    setModalButtons([
                        {
                            text: "확인",
                            action: async () => {
                                try {
                                    await joinChatRoom(target._id, userId, matchedGender);

                                    // 대기 상태로 전환 (바로 navigate 하지 않음)
                                    setIsWaiting(true);
                                    setWaitingRoomId(target._id);
                                    setShowWaitingModal(true);

                                    // 소켓 방 참가
                                    socket.emit("joinRoom", target._id, "random");

                                } catch (err) {
                                    if (err.response?.status === 403) {
                                        setModalOpen(false);
                                        await tryMatch(); // 차단 관계시 재시도
                                    } else {
                                        throw err;
                                    }
                                }
                            }
                        }]);
                                setModalOpen(true);
                    return;
                }

                // (3-B) 대기방이 없으면 새 방 생성 안내
                setModalTitle("듀오 찾기 시작");
                setModalMessage(
                    `듀오 찾기(${capacity}명, ${genderLabels[matchedGender]})을 참가하시겠습니까?`
                );
                setModalButtons([
                    {
                        text: "생성",
                        action: async () => {
                            try {
                                const room = await createChatRoom("random", capacity, matchedGender, ageGroup);
                                await joinChatRoom(room._id, userId, matchedGender);

                                // 대기 상태로 전환
                                setIsWaiting(true);
                                setWaitingRoomId(room._id);
                                setShowWaitingModal(true);

                                // 소켓 방 참가
                                socket.emit("joinRoom", room._id, "random");

                            } catch (err) {
                                if (err.response?.status === 403) {
                                    setModalOpen(false);
                                    await tryMatch();
                                } else {
                                    throw err;
                                }
                            }
                        }
                    }
                ]);
                setModalOpen(true);
            };

            await tryMatch();
        } catch (e) {
            console.error(e);
            setModalTitle("에러");
            setModalMessage("듀오 찾기 참가에 실패했습니다.");
            setModalButtons([{ text: "확인", action: () => setModalOpen(false) }]);
            setModalOpen(true);
        }
    };

    // 대기 취소 함수
    const cancelWaiting = async () => {
        if (waitingRoomId && socket) {
            try {
                await leaveChatRoom(waitingRoomId, userId);
                socket.emit("leaveRoom", { roomId: waitingRoomId, userId });
            } catch (error) {
                console.error("방 나가기 실패:", error);
            }
        }

        setIsWaiting(false);
        setWaitingRoomId(null);
        setCurrentParticipants([]);
        setWaitingCapacity(0);
        setShowWaitingModal(false);
    };


    if (error) return <div>{error}</div>;

    return (
        <div className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-white to-purple-50 rounded-3xl shadow-2xl">
            {/* 헤더 */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">듀오 찾기</h2>
                <button
                    onClick={() => setShowBlockedModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                         viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                              d="M18.364 5.636l-1.414 1.414M5.636 18.364l1.414-1.414M6.343 6.343l12.728 12.728M18.364 18.364l-12.728-12.728" />
                    </svg>
                    <span>차단 목록</span>
                </button>
            </div>

            {/* 사용자 정보 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500">별점(추천점수)</span>
                    <span className="mt-1 text-gray-700">{userInfo?.star || "–"}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500">플랜</span>
                    <span className="mt-1 text-gray-700">{userInfo?.plan.planType || "–"}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500">남은 채팅 횟수</span>

                    {/* 남은횟수 + 충전정보를 한 줄에 */}
                    <span className="mt-1 flex items-center space-x-2 text-gray-700">
                        {/* ① 남은/최대 */}
                        {userInfo ? `${userInfo.numOfChat} / ${userInfo.maxChatCount}` : "-"}
                        {/* ② 충전 정보 */}
                        {userInfo &&
                            (userInfo.numOfChat >= userInfo.maxChatCount ? (
                                <span className="text-green-600 text-sm">(충전 완료)</span>
                            ) : (
                                <span className="text-gray-500 text-sm">
                          ({timeLeft ?? "-"} 후 +1)
                        </span>
                            ))}
                  </span>
                </div>

            </div>

            {/* 옵션 선택 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-600">인원 선택</label>
                    <select
                        value={capacity}
                        onChange={e => setCapacity(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm
                     focus:ring-2 focus:ring-purple-400 transition"
                    >
                        {[2, 3, 4, 5].map(n => (
                            <option key={n} value={n}>{n}명</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-600">원하는 성별</label>
                    <select
                        value={matchedGender}
                        onChange={e => setMatchedGender(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm
                     focus:ring-2 focus:ring-purple-400 transition"
                    >
                        <option value="any">상관없음</option>
                        <option value="opposite">이성</option>
                        <option value="same">동성</option>
                    </select>
                </div>
            </div>

            {/* 시작 버튼 */}
            <button
                onClick={() => findOrCreateRandomRoom(capacity, matchedGender)}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-lg font-semibold
                 rounded-2xl shadow-lg hover:from-purple-600 hover:to-purple-700 transform hover:scale-[1.02]
                 transition-all focus:outline-none"
            >
                듀오 찾기 시작
            </button>

            {/* 공통 모달 (알림 / 확인) */}
            <CommonModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalTitle}
                onConfirm={() => {
                    setModalOpen(false);
                    modalButtons[0].action();
                }}
                buttons={modalButtons}
            >
                <p className="text-gray-700 whitespace-pre-line">{modalMessage}</p>
            </CommonModal>

            {/* 차단 목록 모달 */}
            <CommonModal
                isOpen={showBlockedModal}
                onClose={() => setShowBlockedModal(false)}
                title="차단 목록"
                showCancel={false}
                onConfirm={() => setShowBlockedModal(false)}
            >
                {(blockedUsers || []).length > 0 ? (
                    <ul className="space-y-3 max-h-64 overflow-y-auto">
                        {(blockedUsers || []).map(u => (
                            <li
                                key={u._id}
                                className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm
                         hover:bg-gray-50 transition cursor-pointer"
                                onClick={() => handleProfileClick(u)}
                            >
                                <div className="flex items-center space-x-3">
                                    {/* 프로필 이미지 */}
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                        {u.profilePhoto ? (
                                            <img
                                                src={u.profilePhoto}
                                                alt={u.nickname}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                                                <span className="text-white font-medium text-sm">
                                                    {u.nickname?.[0]?.toUpperCase() || '?'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="font-medium text-gray-800">{u.nickname}</span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // 클릭 이벤트 버블링 방지
                                        handleUnblock(u._id);
                                    }}
                                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                                >
                                    차단 해제
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-600 text-center">차단된 사용자가 없습니다.</p>
                )}
            </CommonModal>
            {/* 대기 모달 - TailwindCSS 버전 */}
            {showWaitingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-8 rounded-2xl text-center min-w-80 shadow-xl max-w-md mx-4">

                        <div className="mb-6">
                            <div className="text-3xl font-bold text-blue-600 mb-3">
                                {currentParticipants.length} / {waitingCapacity}명
                            </div>
                            <div className="text-sm text-gray-600 mb-4">
                                다른 사용자를 기다리고 있습니다...
                            </div>

                            {/* 로딩 애니메이션 */}
                            <div className="flex justify-center space-x-1 mb-4">
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                cancelWaiting();
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 w-full sm:w-auto"
                        >
                            대기 취소
                        </button>
                    </div>
                </div>
            )}

            {/* 프로필 모달 */}
            {showProfileModal && selectedProfile && (
                <SimpleProfileModal
                    profile={selectedProfile}
                    onClose={handleCloseProfileModal}
                    area="차단목록"
                />
            )}
        </div>
    );

};

export default RandomChatComponent;
