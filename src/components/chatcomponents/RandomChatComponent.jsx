import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../hooks/useSocket.js";
import { getBlockedUsers, unblockUserMinimal } from "../../api/userAPI";
import { getUserChatStatus } from '../../api/userProfileLightAPI.js';
import { useChatRooms } from "../../hooks/queries/useChatQueries";
import { useQueryClient } from '@tanstack/react-query';
import {
    //createChatRoom,
    //joinChatRoom,
    // fetchChatRooms,
    //fetchUserLeftRooms,
    leaveChatRoom, findOrCreateChatRoom
} from "../../api/chatAPI";
import CommonModal from "../../common/CommonModal";
import SimpleProfileModal from "../MyPageComponent/SimpleProfileModal.jsx";
import useAuthStore from "../../stores/authStore.js";
import useBlockedStore from "../../stores/useBlockedStore.js";

const REFILL_MS = 20 * 60 * 1000; // 충전 주기: 20분 (서버와 동일)

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
    const [initialCheckComplete, setInitialCheckComplete] = useState(false);

    const socket = useSocket(); // 소켓 연결
    const queryClient = useQueryClient();

    const blockedUsers          = useBlockedStore((s) => s.blockedUsers);
    const setBlockedUsersStore  = useBlockedStore((s) => s.setBlockedUsers);
    const removeBlockedUser     = useBlockedStore((s) => s.removeBlockedUser);

    const navigate = useNavigate();
    const authUser = useAuthStore((state) => state.user);
    const userId = authUser?._id;

    // ========== 3. React Query Hook 추가 ==========
    const {
        data: chatRoomsData = { rooms: [] },
        isLoading: roomsLoading,
        error: roomsError,
    } = useChatRooms({
        roomType: "random",
        userId
    });

    // ========== 4. 일반 변수/상수 선언 (Hook 아님) ==========
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

    // ① 주기적 카운트다운 + 프론트 충전 계산
    useEffect(() => {
        if (!userInfo?.nextRefillAt || !userInfo?.maxChatCount) return;
        if (userInfo.numOfChat >= userInfo.maxChatCount) return; // 풀충전이면 타이머 불필요

        const tick = () => {
            const diff = new Date(userInfo.nextRefillAt) - Date.now();
            if (diff <= 0) {
                // 타이머 만료 → 프론트에서 직접 +1 (API 호출 없음)
                const newCount = Math.min(userInfo.numOfChat + 1, userInfo.maxChatCount);
                const isFull = newCount >= userInfo.maxChatCount;

                setUserInfo(prev => ({
                    ...prev,
                    numOfChat: newCount,
                    nextRefillAt: isFull ? null : new Date(Date.now() + REFILL_MS).toISOString()
                }));
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
    }, [userInfo?.nextRefillAt, userInfo?.numOfChat, userInfo?.maxChatCount]);

    useEffect(() => {
        const checkForActiveRandomChat = () => {
            // 정보가 없거나, 이미 체크했거나, 로딩 중이면 중단
            if (!userInfo || initialCheckComplete || roomsLoading) {
                return;
            }

            // 대기 중인 상태라면 자동 입장 체크를 하지 않음 (현재 대기 중인 방에 집중)
            if (isWaiting) {
                return;
            }

            try {
                const roomsArray = chatRoomsData?.rooms || [];

                // 데이터가 비어있으면 체크 완료 처리만 하고 종료
                if (roomsArray.length === 0) {
                    setInitialCheckComplete(true);
                    return;
                }

                const blockedIds = (blockedUsers || []).map((u) => u._id);

                // 현재 내가 실제로 참여 중이고 활성화된 방이 있는지 찾기
                const existingRoom = roomsArray.find(
                    (room) =>
                        room.status !== 'closed' &&
                        room.chatUsers.some((u) => u._id === userId) &&
                        !room.chatUsers.some((u) => blockedIds.includes(u._id))
                );

                if (existingRoom) {
                    console.log('🚀 [Auto-Entry] 활성 방 발견, 입장:', existingRoom._id);
                    navigate(`/chat/${existingRoom._id}/${userId}`);
                }
                
                // 체크 완료 플래그 설정 (한 번만 실행되도록)
                setInitialCheckComplete(true);
            } catch (error) {
                console.error("Error checking for active random chat:", error);
            }
        };

        checkForActiveRandomChat();
    }, [userInfo, userId, navigate, blockedUsers, initialCheckComplete, chatRoomsData, roomsLoading, isWaiting]);

    // 소켓 이벤트 리스너 설정
    // ✅ 수정: isWaiting 조건을 제거하여 리스너를 항상 등록
    // 이유: setState는 비동기라서 socket.emit 전에 리스너가 등록되지 않는 타이밍 문제 해결
    useEffect(() => {
        if (!socket) return;

        // 사용자가 방에 참가했을 때
        const handleRoomJoined = ({ roomId, activeUsers, capacity }) => {
            console.log('🔔 [roomJoined 이벤트 수신]', { roomId, activeUsers: activeUsers?.length, capacity });

            // 채팅방 목록 캐시 무효화 (polling 대체)
            queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });

            // ⭐ 안전 장치: activeUsers가 배열인지 확인
            const participants = Array.isArray(activeUsers) ? activeUsers : [];

            // 현재 대기 중인 방과 일치하는지 확인 (waitingRoomId는 클로저로 최신값 참조)
            setWaitingRoomId(prevRoomId => {
                if (roomId === prevRoomId) {
                    console.log('✅ [roomJoined] 내 방 이벤트 - 참가자 업데이트');
                    setCurrentParticipants(participants);
                    setWaitingCapacity(capacity || 0);

                    // 방이 가득 찼으면 ChatRoom으로 이동
                    if (participants.length >= (capacity || 0)) {
                        console.log('🎉 [roomJoined] 방 가득 참! 채팅방으로 이동');
                        setIsWaiting(false);
                        setShowWaitingModal(false);
                        navigate(`/chat/${roomId}/${userId}`);
                    }
                }
                return prevRoomId; // 상태 변경 없음
            });
        };

        // 사용자가 방을 떠났을 때
        const handleUserLeft = ({ roomId, activeUsers }) => {
            console.log('👋 [userLeft 이벤트 수신]', { roomId, activeUsers: activeUsers?.length });

            // 채팅방 목록 캐시 무효화 (polling 대체)
            queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });

            setWaitingRoomId(prevRoomId => {
                if (roomId === prevRoomId) {
                    setCurrentParticipants(Array.isArray(activeUsers) ? activeUsers : []);
                }
                return prevRoomId;
            });
        };

        socket.on("roomJoined", handleRoomJoined);
        socket.on("userLeft", handleUserLeft);

        return () => {
            socket.off("roomJoined", handleRoomJoined);
            socket.off("userLeft", handleUserLeft);
        };
    }, [socket, userId, navigate, queryClient]);

    // 유저 정보 호출 함수
    const fetchUserInfoAsync = async (userId) => {
        try {
            const data = await getUserChatStatus(userId);
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
            // ✅ minimal API 사용
            const response = await unblockUserMinimal(userId, blockedUserId);

            // ✅ ID로 store에서 제거
            removeBlockedUser(blockedUserId);

            // ✅ API 응답 메시지 사용
            setModalTitle("성공");
            setModalMessage(response.message || "차단이 해제되었습니다.");
            setModalButtons([{ text: "확인", action: () => setModalOpen(false) }]);
            setModalOpen(true);
        } catch (error) {
            setModalTitle("에러");
            setModalMessage(error.response?.data?.message || "차단 해제에 실패했습니다.");
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

            if (!userInfo.birthdate || !userInfo.ageGroup) {
                setModalTitle("정보 부족");
                setModalMessage("생년월일 정보가 없어 랜덤채팅을 이용할 수 없습니다. 마이페이지에서 정보를 입력해주세요.");
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

            // 2️⃣ 확인 모달
            setModalTitle("듀오 찾기 시작");
            setModalMessage(
                `듀오 찾기(${capacity}명, ${genderLabels[matchedGender]})를 시작하시겠습니까?`
            );
            setModalButtons([
                {
                    text: "시작",
                    action: async () => {
                        try {
                            setModalOpen(false);

                            const myGender = userInfo?.gender;

                            if (!myGender || myGender === 'select') {
                                setModalTitle("알림");
                                setModalMessage('성별 정보가 필요합니다. 마이페이지에서 성별을 선택해주세요.');
                                setModalButtons([{ text: "확인", action: () => setModalOpen(false) }]);
                                setModalOpen(true);
                                return;
                            }

                            // 3️⃣ 백엔드 API 한 번만 호출! (핵심 개선)
                            const result = await findOrCreateChatRoom({
                                userId: userId,
                                roomType: 'random',
                                capacity: capacity,
                                matchedGender: matchedGender,
                                ageGroup: userInfo.ageGroup,
                                userGender: myGender,              // 본인 성별
                                selectedPreference: matchedGender  // 선택한 매칭 조건
                            });

                            if (result.success) {
                                // 4️⃣ 성공 처리
                                console.log(`✅ ${result.action === 'joined' ? '기존 방 참가' : result.action === 'rejoined' ? '기존 방 재접속' : '새 방 생성'}`);

                                // 🆕 재접속인 경우: 바로 채팅방으로 이동
                                if (result.action === 'rejoined') {
                                    if (socket) {
                                        socket.emit("joinRoom", result.room._id, "random");
                                    }
                                    navigate(`/chat/${result.room._id}/${userId}`);
                                    return;
                                }

                                // 새 방 생성/참가: 대기 모달 표시
                                setIsWaiting(true);
                                setWaitingRoomId(result.room._id);
                                setShowWaitingModal(true);

                                // 소켓 방 참가
                                if (socket) {
                                    socket.emit("joinRoom", result.room._id, "random");
                                }
                            }

                        } catch (err) {
                            console.error('❌ 방 찾기/생성 실패:', err);

                            // 5️⃣ 에러 처리
                            let errorMessage = '듀오 찾기에 실패했습니다.';

                            if (err.response?.data) {
                                const { error, code } = err.response.data;

                                switch (code) {
                                    case 'BIRTHDATE_REQUIRED':
                                        errorMessage = '생년월일 정보가 필요합니다.';
                                        break;
                                    case 'AGE_VERIFICATION_FAILED':
                                        errorMessage = '나이 확인이 불가능합니다.';
                                        break;
                                    case 'AGE_GROUP_MISMATCH':
                                        errorMessage = error || '연령대가 맞지 않습니다.';
                                        break;
                                    case 'DECRYPTION_FAILED':
                                        errorMessage = '생년월일 정보 확인 중 오류가 발생했습니다.';
                                        break;
                                    default:
                                        errorMessage = error || errorMessage;
                                }
                            }

                            setModalTitle("에러");
                            setModalMessage(errorMessage);
                            setModalButtons([{ text: "확인", action: () => setModalOpen(false) }]);
                            setModalOpen(true);
                        }
                    }
                },
                {
                    text: "취소",
                    action: () => setModalOpen(false)
                }
            ]);
            setModalOpen(true);


        } catch (e) {
            console.error(e);
            setModalTitle("에러");
            setModalMessage("듀오 찾기 참가에 실패했습니다.");
            setModalButtons([{ text: "확인", action: () => setModalOpen(false) }]);
            setModalOpen(true);
        }
    };

    // 대기 취소 함수 (useCallback으로 감싸서 cleanup에서도 안전하게 사용)
    const cancelWaiting = useCallback(async () => {
        // 현재 대기 중인 상태를 캡처하여 처리
        setWaitingRoomId(prevRoomId => {
            if (prevRoomId && socket) {
                console.log('🧹 [cancelWaiting] 대기 취소 실행:', prevRoomId);
                // 비동기로 방 나가기 처리
                leaveChatRoom(prevRoomId, userId)
                    .then(() => {
                        // ⭐ 방 나가기 성공 후 즉시 캐시 무효화 (오래된 데이터로 인한 자동 입장 방지)
                        queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
                    })
                    .catch(err => console.error("방 나가기 실패:", err));

                socket.emit("leaveRoom", { roomId: prevRoomId, userId });
            }
            return null; // ID 초기화
        });

        setIsWaiting(false);
        setCurrentParticipants([]);
        setWaitingCapacity(0);
        setShowWaitingModal(false);

        // ⭐ 즉시 캐시 무효화 시도 (아이디가 없더라도 전체 목록 갱신)
        queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    }, [socket, userId, queryClient]);

    // 컴포넌트 언마운트 시 클린업 로직 추가
    useEffect(() => {
        return () => {
            // 언마운트 시 대기 중이라면 취소 처리
            if (isWaiting) {
                console.log('👋 [Cleanup] 컴포넌트 언마운트 - 대기 취소');
                cancelWaiting();
            }
        };
    }, [isWaiting, cancelWaiting]);


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
                {/*<div className="flex flex-col">*/}
                {/*    <span className="text-sm font-medium text-gray-500">플랜</span>*/}
                {/*    <span className="mt-1 text-gray-700">{userInfo?.plan.planType || "–"}</span>*/}
                {/*</div>*/}
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
                        {(blockedUsers || []).filter(u => u && u._id).map((u, idx) => (
                            <li
                                key={u._id || idx}
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
                                {(currentParticipants || []).length} / {waitingCapacity || 0}명
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
