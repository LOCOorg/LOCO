import { useEffect, useState } from "react";
import { getUserInfo } from "../api/userAPI";
import { createFriendRoom, fetchChatRooms, joinChatRoom } from "../api/chatAPI";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/authStore.js";
import PlanButton from "./product/PlanButton.jsx";
import PaymentStatusModal from "./pay/PaymentStatusModal.jsx";
import MyPageButton from "./MyPageComponent/MyPageButton.jsx";
import ProfileButton from "./MyPageComponent/ProfileButton.jsx";
import useFriendChatStore from "../stores/useFriendChatStore.js";
import ReportNotificationModal from "./reportcomponents/ReportNotificationModal.jsx";

function MainComponent() {
    const [user, setUser] = useState(null);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const setStoreUser = useAuthStore((state) => state.setUser);
    const authUser = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    // 채팅 모달 관리는 GlobalFriendChatOverlay에서 처리하므로, 전역 상태의 openFriendChat만 사용합니다.
    const { openFriendChat } = useFriendChatStore();

    useEffect(() => {
        if (!authUser) return;
        const fetchUserData = async () => {
            try {
                // authStore에서 받아온 authUser의 _id로 상세 유저 정보를 불러옵니다.
                const userData = await getUserInfo(authUser._id);
                setUser(userData);

                const friendsData = await Promise.all(
                    userData.friends.map(async (friendId) => {
                        const friendInfo = await getUserInfo(friendId);
                        return friendInfo;
                    })
                );
                setFriends(friendsData);
            } catch (error) {
                console.error("유저 정보를 불러오는 데 실패했습니다.", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [authUser]);

    const handleFriendSelect = async (friend) => {
        try {
            if (!user) return;
            const friendId = friend._id;
            const chatRoomsData = await fetchChatRooms();
            const friendChatRooms = chatRoomsData.filter(
                (room) => room.roomType === "friend"
            );
            const existingRoom = friendChatRooms.find((room) => {
                if (!room.chatUsers) return false;
                const userIds = room.chatUsers.map((user) => user._id);
                return userIds.includes(user._id) && userIds.includes(friendId);
            });

            let newRoom;
            if (existingRoom) {
                newRoom = existingRoom;
            } else {
                const roomType = "friend";
                const capacity = 2;
                let room = await createFriendRoom(roomType, capacity);
                room = { ...room, chatUsers: [user._id, friendId] };

                await joinChatRoom(room._id, user._id);
                await joinChatRoom(room._id, friendId);

                newRoom = room;
            }
            // 전역 상태에 친구 채팅을 추가합니다.
            openFriendChat({ roomId: newRoom._id, friend });
        } catch (error) {
            console.error("채팅방 처리 실패:", error);
        }
    };

    const handleNavigate = () => {
        navigate("/chat");
    };

    const handleNavigateLogin = () => {
        if (user) {
            // 로그인 상태이면 로그아웃 처리 후 로그인 페이지로 이동
            logout();
            navigate("/loginPage");
        } else {
            navigate("/loginPage");
        }
    };

    const handleProductRegistration = () => {
        navigate("/adminproducts");
    };

    const handleCommunity = () => {
        navigate("/community");
    };

    return (
        <>
            {/* PaymentStatusModal을 최상위에 렌더링 */}
            <PaymentStatusModal />
            <ReportNotificationModal />

            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
                <h1 className="text-4xl font-bold text-gray-800 mb-6">홈</h1>
                {loading ? (
                    <p className="text-gray-500">로딩 중...</p>
                ) : (
                    user && (
                        <div className="mb-6 p-4 bg-white shadow-md rounded-lg w-80">
                            <h2 className="text-2xl font-semibold text-gray-700">
                                {user.nickname} 님
                            </h2>
                            <p className="text-gray-600">친구 목록:</p>
                            <ul className="list-disc pl-5 text-gray-700">
                                {friends.length > 0 ? (
                                    friends.map((friend, index) => (
                                        <li key={index} className="flex items-center space-x-2">
                                            {/* 프로필 버튼에 friend 객체를 prop으로 전달 */}
                                            <ProfileButton profile={friend} />
                                            {/* 친구의 이름 또는 닉네임 클릭 시 채팅방 열기 */}
                                            <span
                                                className="cursor-pointer text-blue-500 hover:text-blue-700"
                                                onClick={() => handleFriendSelect(friend)}
                                            >
                        {friend.nickname}
                      </span>
                                        </li>
                                    ))
                                ) : (
                                    <p className="text-gray-500">친구가 없습니다.</p>
                                )}
                            </ul>
                        </div>
                    )
                )}

                <MyPageButton />
                <button
                    onClick={handleNavigate}
                    className="px-6 py-3 bg-blue-500 text-white text-lg rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    채팅하러 가기
                </button>
                <button
                    onClick={handleCommunity}
                    className="px-6 py-3 bg-green-500 text-white text-lg rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                    커뮤니티
                </button>
                <button
                    onClick={handleNavigateLogin}
                    className="mt-4 px-6 py-3 bg-purple-500 text-white text-lg rounded-lg shadow-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    {user ? "로그아웃" : "로그인"}
                </button>
                <button
                    onClick={handleProductRegistration}
                    className="mt-4 px-6 py-3 bg-green-500 text-white text-lg rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                    상품등록
                </button>
                <PlanButton />
            </div>
        </>
    );
}

export default MainComponent;
