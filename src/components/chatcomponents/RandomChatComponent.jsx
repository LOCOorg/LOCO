import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    getUserInfo,
    getBlockedUsers,
    unblockUser
} from "../../api/userAPI";
import {
    createChatRoom,
    joinChatRoom,
    fetchChatRooms,
    fetchUserLeftRooms
} from "../../api/chatAPI";
import CommonModal from "../../common/CommonModal";
import useAuthStore from "../../stores/authStore.js";

const RandomChatComponent = () => {
    const [capacity, setCapacity] = useState(2);
    const [matchedGender, setMatchedGender] = useState("any");
    const [userInfo, setUserInfo] = useState(null);
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [modalTitle, setModalTitle] = useState("");
    const [modalButtons, setModalButtons] = useState([]);
    const [showBlockedModal, setShowBlockedModal] = useState(false);

    const navigate = useNavigate();
    const authUser = useAuthStore((state) => state.user);
    const userId = authUser?._id;

    const genderLabels = {
        any: "상관없음",
        same: "동성",
        opposite: "이성"
    };

    // 생년월일을 이용한 나이 계산 함수
    const calculateAge = (birthdate) => {
        const today = new Date();
        const birth = new Date(birthdate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    // 유저 정보 호출 함수
    const fetchUserInfoAsync = async (userId) => {
        try {
            const data = await getUserInfo(userId);
            setUserInfo(data);
            const blocked = await getBlockedUsers(userId);
            setBlockedUsers(blocked);
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
            setBlockedUsers((prev) =>
                prev.filter((u) => u._id !== blockedUserId)
            );
        } catch {
            setModalTitle("에러");
            setModalMessage("차단 해제에 실패했습니다.");
            setModalButtons([{ text: "확인", action: () => setModalOpen(false) }]);
            setModalOpen(true);
        }
    };

    // 랜덤 채팅방 찾기 및 생성 함수
    const findOrCreateRandomRoom = async (capacity, matchedGender) => {
        if (!userId) return;

        try {
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

            // 채팅횟수가 0인 경우 랜덤 채팅 이용 제한
            if (userInfo.numOfChat === 0) {
                setModalTitle("경고");
                setModalMessage("채팅횟수가 부족하여 랜덤 채팅을 이용할 수 없습니다.");
                setModalButtons([{ text: "확인", action: () => setModalOpen(false) }]);
                setModalOpen(true);
                return;
            }
            // 신고로 인한 제한: reportStatus가 active가 아니고, reportTimer가 현재 시간보다 미래인 경우
            if (userInfo.reportStatus !== "active" && userInfo.reportTimer && new Date(userInfo.reportTimer) > new Date()) {
                setModalTitle("채팅 제한");
                setModalMessage("신고로 인해 현재 랜덤 채팅 이용이 제한되어 있습니다.");
                setModalButtons([{ text: "확인", action: () => setModalOpen(false) }]);
                setModalOpen(true);
                return;
            }

            const age = calculateAge(userInfo.birthdate);
            const ageGroup = age >= 19 ? "adult" : "minor";

            // 백엔드 필터링에 필요한 쿼리 파라미터 구성
            const query = {
                roomType: "random",
                ...(matchedGender !== "any" && { matchedGender }),
                ageGroup,
                userId
            };

            const rooms = await fetchChatRooms(query);
            console.log("현재 채팅방 목록:", rooms);

            const blockedIds = blockedUsers.map(u => u._id);
            const availableRooms = rooms.filter(room => {
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
                if (room.chatUsers.some((u) => blockedIds.includes(u._id))) return false;
                return true;
            });

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

            if (availableRooms.length > 0) {
                const room =
                    availableRooms[Math.floor(Math.random() * availableRooms.length)];
                setModalTitle("알림");
                setModalMessage(
                    `랜덤 채팅방(${capacity}명, ${genderLabels[matchedGender]})에 참가합니다.`
                );
                setModalButtons([
                    {
                        text: "확인",
                        action: async () => {
                            await joinChatRoom(room._id, userId);
                            navigate(`/chat/${room._id}/${userId}`);
                        }
                    }
                ]);
                setModalOpen(true);
                return;
            }

            // 새로운 방 생성 전 확인 모달 띄우기
            setModalTitle("랜덤 채팅 시작");
            setModalMessage(
                `랜덤 채팅방(${capacity}명, ${genderLabels[matchedGender]})을 참가하시겠습니까?`
            );
            setModalButtons([
                {
                    text: "생성",
                    action: async () => {
                        try {
                            const room = await createChatRoom(
                                "random",
                                capacity,
                                matchedGender,
                                ageGroup
                            );
                            await joinChatRoom(room._id, userId);
                            navigate(`/chat/${room._id}/${userId}`);
                        } catch {
                            setModalTitle("에러");
                            setModalMessage("랜덤 채팅방 참가에 실패했습니다.");
                            setModalButtons([
                                { text: "확인", action: () => setModalOpen(false) }
                            ]);
                            setModalOpen(true);
                        }
                    }
                }
            ]);
            setModalOpen(true);
        } catch {
            setModalTitle("에러");
            setModalMessage("랜덤 채팅방 참가에 실패했습니다.");
            setModalButtons([{ text: "확인", action: () => setModalOpen(false) }]);
            setModalOpen(true);
        }
    };

    if (error) return <div>{error}</div>;

    return (
        <div className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-white to-purple-50 rounded-3xl shadow-2xl">
            {/* 헤더 */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">랜덤 채팅</h2>
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
                    <span className="text-sm font-medium text-gray-500">닉네임</span>
                    <span className="mt-1 text-gray-700">{userInfo?.nickname || "–"}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500">성별</span>
                    <span className="mt-1 text-gray-700">{userInfo?.gender || "–"}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500">생년월일</span>
                    <span className="mt-1 text-gray-700">{userInfo?.birthdate || "–"}</span>
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
                랜덤 채팅 시작
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
                <p className="text-gray-700">{modalMessage}</p>
            </CommonModal>

            {/* 차단 목록 모달 */}
            <CommonModal
                isOpen={showBlockedModal}
                onClose={() => setShowBlockedModal(false)}
                title="차단 목록"
                showCancel={false}
                onConfirm={() => setShowBlockedModal(false)}
            >
                {blockedUsers.length > 0 ? (
                    <ul className="space-y-3 max-h-64 overflow-y-auto">
                        {blockedUsers.map(u => (
                            <li
                                key={u._id}
                                className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm
                         hover:bg-gray-50 transition"
                            >
                                <div className="flex items-center space-x-3">
                                    {u.photo?.[0] && (
                                        <img
                                            src={u.photo[0]}
                                            alt={u.nickname}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    )}
                                    <span className="font-medium text-gray-800">{u.nickname}</span>
                                </div>
                                <button
                                    onClick={() => handleUnblock(u._id)}
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
        </div>
    );

};

export default RandomChatComponent;
