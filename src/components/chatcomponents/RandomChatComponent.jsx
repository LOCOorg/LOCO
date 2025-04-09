import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo } from "../../api/userAPI";
import { createChatRoom, joinChatRoom, fetchChatRooms, fetchUserLeftRooms } from "../../api/chatAPI";
import LoadingComponent from "../../common/LoadingComponent.jsx";
import CommonModal from "../../common/CommonModal";
import useAuthStore from "../../stores/authStore.js";

const RandomChatComponent = () => {
    const [capacity, setCapacity] = useState("");
    const [matchedGender, setMatchedGender] = useState("any");
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [modalTitle, setModalTitle] = useState("");
    const [modalButtons, setModalButtons] = useState([]);
    const navigate = useNavigate();
    const authUser = useAuthStore((state) => state.user);
    const userId = authUser?._id; // authStore에서 받아온 사용자 ID

    // 생년월일을 이용한 나이 계산 함수
    const calculateAge = (birthdate) => {
        const today = new Date();
        const birth = new Date(birthdate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    // 유저 정보 호출 함수
    const fetchUserInfoAsync = async (userId) => {
        try {
            const data = await getUserInfo(userId);
            setUserInfo(data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchUserInfoAsync(userId);
        }
    }, [userId]);

    // 랜덤 채팅방 찾기 및 생성 함수
    const findOrCreateRandomRoom = async (capacity, matchedGender) => {
        if (!userId) return;
        setLoading(true);
        try {
            if (capacity < 2 || capacity > 5) {
                setModalTitle("경고");
                setModalMessage("참여 인원은 2~5명 사이로 입력해주세요.");
                setModalButtons([{ text: "확인", action: () => setModalOpen(false) }]);
                setModalOpen(true);
                setLoading(false);
                return;
            }

            if (!userInfo) {
                setModalTitle("경고");
                setModalMessage("유저 정보를 불러오는 중입니다.");
                setModalButtons([{ text: "확인", action: () => setModalOpen(false) }]);
                setModalOpen(true);
                setLoading(false);
                return;
            }

            // 채팅횟수가 0인 경우 랜덤 채팅 이용 제한
            if (userInfo.numOfChat === 0) {
                setModalTitle("경고");
                setModalMessage("채팅횟수가 부족하여 랜덤 채팅을 이용할 수 없습니다.");
                setModalButtons([{ text: "확인", action: () => setModalOpen(false) }]);
                setModalOpen(true);
                setLoading(false);
                return;
            }
            // 신고로 인한 제한: reportStatus가 active가 아니고, reportTimer가 현재 시간보다 미래인 경우
            if (userInfo.reportStatus !== "active" && userInfo.reportTimer && new Date(userInfo.reportTimer) > new Date()) {
                setModalTitle("채팅 제한");
                setModalMessage("신고로 인해 현재 랜덤 채팅 이용이 제한되어 있습니다.");
                setModalButtons([{ text: "확인", action: () => setModalOpen(false) }]);
                setModalOpen(true);
                setLoading(false);
                return;
            }

            const age = calculateAge(userInfo.birthdate);
            const ageGroup = age >= 19 ? 'adult' : 'minor';

            // 백엔드 필터링에 필요한 쿼리 파라미터 구성
            const query = {
                roomType: "random",
                capacity,
                matchedGender,
                ageGroup,
            };

            const rooms = await fetchChatRooms(query);
            console.log("현재 채팅방 목록:", rooms);

            const availableRooms = rooms.filter((room) => {
                if (room.roomType !== "random") return false;
                if (room.capacity !== capacity) return false;
                if (room.chatUsers.length >= room.capacity) return false;
                if (room.isActive || room.status !== "waiting") return false;

                if (matchedGender === "same") {
                    if (room.matchedGender !== "same" || room.chatUsers.some(user => user.gender !== userInfo.gender)) return false;
                }
                if (matchedGender === "opposite") {
                    if (room.matchedGender !== "opposite" || room.chatUsers.every(user => user.gender === userInfo.gender)) return false;
                }
                if (matchedGender === "any" && room.matchedGender !== "any") return false;

                if (room.ageGroup !== ageGroup) return false;

                return true;
            });

            let room;

            const leftRooms = await fetchUserLeftRooms(userId);
            const existingRoom = rooms.find(
                (room) =>
                    room.roomType === "random" &&
                    room.chatUsers.some(user => user._id === userId) &&
                    !leftRooms.includes(room._id)
            );

            if (existingRoom) {
                setModalTitle("알림");
                setModalMessage("이미 참여중인 채팅방으로 이동합니다.");
                setModalButtons([{ text: "확인", action: () => navigate(`/chat/${existingRoom._id}/${userId}`) }]);
                setModalOpen(true);
                setLoading(false);
                return;
            }

            if (availableRooms.length > 0) {
                room = availableRooms[Math.floor(Math.random() * availableRooms.length)];
                setModalTitle("알림");
                setModalMessage(`랜덤 채팅방(${capacity}명, ${matchedGender} 매칭, ${ageGroup})에 참가했습니다.`);
                setModalButtons([{ text: "확인", action: () => navigate(`/chat/${room._id}/${userId}`) }]);
                setModalOpen(true);
            } else {
                room = await createChatRoom("random", capacity, matchedGender, ageGroup);
                setModalTitle("알림");
                setModalMessage(`새로운 랜덤 채팅방(${capacity}명, ${matchedGender} 매칭, ${ageGroup})을 생성했습니다.`);
                setModalButtons([{ text: "확인", action: () => navigate(`/chat/${room._id}/${userId}`) }]);
                setModalOpen(true);
            }

            await joinChatRoom(room._id, userId);
            console.log("채팅방에 참가했습니다.");
        } catch (error) {
            console.error("랜덤 채팅방 참가에 실패:", error);
            setModalTitle("에러");
            setModalMessage("랜덤 채팅방 참가에 실패했습니다.");
            setModalButtons([{ text: "확인", action: () => setModalOpen(false) }]);
            setModalOpen(true);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingComponent message="대기 중입니다... 채팅방을 찾고 있습니다." />;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-semibold mb-4">랜덤 채팅 시작</h2>

            <div className="mb-4">
                <p>닉네임: {userInfo.nickname}</p>
                <p>성별: {userInfo.gender}</p>
                <p>생년월일: {userInfo.birthdate}</p>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="참여 인원 (2~5명)"
                    value={capacity}
                    onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        if (!isNaN(value) && value >= 2 && value <= 5) {
                            setCapacity(value);
                        } else {
                            setCapacity("");
                        }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="mb-4">
                <select
                    value={matchedGender}
                    onChange={(e) => setMatchedGender(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="any">상관없음</option>
                    <option value="opposite">이성</option>
                    <option value="same">동성</option>
                </select>
            </div>

            <button
                onClick={() => findOrCreateRandomRoom(capacity, matchedGender)}
                className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg shadow-md hover:bg-purple-600 focus:outline-none"
            >
                랜덤 채팅 시작
            </button>

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
                <p>{modalMessage}</p>
            </CommonModal>
        </div>
    );
};

export default RandomChatComponent;
