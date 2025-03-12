import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo } from "../../api/userAPI"; // 유저 정보 호출 API
import { createChatRoom, joinChatRoom, fetchChatRooms } from "../../api/chatAPI";
import LoadingComponent from "../../common/LoadingComponent.jsx"; // 로딩 컴포넌트 import
import CommonModal from "../../common/CommonModal"; // CommonModal import

const RandomChatComponent = () => {
    const [capacity, setCapacity] = useState("");
    const [matchedGender, setMatchedGender] = useState("any"); // 성별 매칭 상태
    const [userInfo, setUserInfo] = useState(null); // 유저 정보 상태
    const [loading, setLoading] = useState(true); // 로딩 상태
    const [error, setError] = useState(null); // 에러 상태
    const [modalOpen, setModalOpen] = useState(false); // 모달 상태
    const [modalMessage, setModalMessage] = useState(""); // 모달 메시지
    const [modalTitle, setModalTitle] = useState(""); // 모달 제목
    const [modalButtons, setModalButtons] = useState([]); // 모달 버튼 상태
    const navigate = useNavigate();
    const userId = "67bc2846c9d62c1110715d89"; // 실제 로그인된 사용자 ID

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
    const fetchUserInfo = async (userId) => {
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
        fetchUserInfo(userId);
    }, [userId]);

    // 랜덤 채팅방 찾기 및 생성 함수
    const findOrCreateRandomRoom = async (userId, capacity, matchedGender) => {
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

            // 생년월일을 이용해 현재 나이와 ageGroup 결정
            const age = calculateAge(userInfo.birthdate);
            const ageGroup = age >= 18 ? 'adult' : 'minor';

            // 현재 존재하는 랜덤 채팅방 중에서 조건에 맞는 채팅방 찾기
            const rooms = await fetchChatRooms();
            console.log("현재 채팅방 목록:", rooms);

            const availableRooms = rooms.filter((room) => {
                if (room.roomType !== "random") return false;
                if (room.capacity !== capacity) return false;
                if (room.chatUsers.length >= room.capacity) return false;
                if (room.isActive || room.status !== "waiting") return false;

                // 성별 매칭 조건
                if (matchedGender === "same") {
                    if (room.matchedGender !== "same" || room.chatUsers.some(user => user.gender !== userInfo.gender)) return false;
                }
                if (matchedGender === "opposite") {
                    if (room.matchedGender !== "opposite" || room.chatUsers.some(user => user.gender === userInfo.gender)) return false;
                }
                if (matchedGender === "any" && room.matchedGender !== "any") return false;

                // 나이 매칭 조건: 채팅방의 ageGroup과 사용자의 ageGroup이 일치해야 함
                if (room.ageGroup !== ageGroup) return false;

                return true;
            });

            let room;

            // 이미 참여 중인 채팅방 확인
            const existingRoom = rooms.find(
                (room) =>
                    room.roomType === "random" &&
                    room.chatUsers.some(user => user._id === userId)
            );

            if (existingRoom) {
                setModalTitle("알림");
                setModalMessage("이미 참여중인 채팅방으로 이동합니다.");
                setModalButtons([{ text: "확인", action: () => navigate(`/chat/${existingRoom._id}/${userId}`) }]);
                setModalOpen(true);
                setLoading(false);
                return;
            }

            // 조건에 맞는 채팅방이 있으면 참가, 없으면 새로 생성
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

            {/* 유저 정보 출력 */}
            <div className="mb-4">
                <h3>유저 정보</h3>
                <p>이름: {userInfo.name}</p>
                <p>닉네임: {userInfo.nickname}</p>
                <p>성별: {userInfo.gender}</p>
                <p>전화번호: {userInfo.phone}</p>
                <p>생년월일: {userInfo.birthdate}</p>
            </div>

            {/* 랜덤 채팅방 참가 폼 */}
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
                onClick={() => findOrCreateRandomRoom(userId, capacity, matchedGender)}
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
