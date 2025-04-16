// src/components/MainComponent.jsx
import { useEffect, useState } from "react";
import { getUserInfo, deleteFriend } from "../api/userAPI";
import { createFriendRoom, fetchChatRooms, joinChatRoom } from "../api/chatAPI";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/authStore.js";
import PlanButton from "./product/PlanButton.jsx";
import PaymentStatusModal from "./pay/PaymentStatusModal.jsx";
import MyPageButton from "./MyPageComponent/MyPageButton.jsx";
import ProfileButton from "./MyPageComponent/ProfileButton.jsx";
import useFriendChatStore from "../stores/useFriendChatStore.js";
import ReportNotificationModal from "./reportcomponents/ReportNotificationModal.jsx";
import CommonModal from "../common/CommonModal.jsx";

function MainComponent() {
    const [user, setUser] = useState(null);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [friendToDelete, setFriendToDelete] = useState(null);
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const navigate = useNavigate();
    const setStoreUser = useAuthStore((state) => state.setUser);
    const authUser = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const { openFriendChat } = useFriendChatStore();

    useEffect(() => {
        if (!authUser) return;
        const fetchUserData = async () => {
            try {
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
            openFriendChat({ roomId: newRoom._id, friend });
        } catch (error) {
            console.error("채팅방 처리 실패:", error);
        }
    };

    // 삭제 버튼 클릭 시, 모달을 열고 삭제할 친구 정보를 설정
    const openDeleteModal = (friend) => {
        setFriendToDelete(friend);
        setIsDeleteModalOpen(true);
    };

    // 모달에서 확인 버튼을 누르면 삭제 API 호출 후 상태 업데이트
    const confirmDeleteFriend = async () => {
        try {
            await deleteFriend(user._id, friendToDelete._id);
            setFriends(friends.filter((item) => item._id !== friendToDelete._id));
            setIsDeleteModalOpen(false);
            setFriendToDelete(null);
        } catch (error) {
            setErrorMessage(error.message);
            setErrorModalOpen(true);
            setIsDeleteModalOpen(false);
            setFriendToDelete(null);
        }
    };

    const cancelDelete = () => {
        setIsDeleteModalOpen(false);
        setFriendToDelete(null);
    };

    const closeErrorModal = () => {
        setErrorModalOpen(false);
        setErrorMessage("");
    };

    const handleNavigate = () => {
        navigate("/chat");
    };

    const handleNavigateLogin = () => {
        if (user) {
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
                                    friends.map((friend) => (
                                        <li key={friend._id} className="flex items-center space-x-2">
                                            <ProfileButton profile={friend} />
                                            <span
                                                className="cursor-pointer text-blue-500 hover:text-blue-700"
                                                onClick={() => handleFriendSelect(friend)}
                                            >
                                                {friend.nickname}
                                            </span>
                                            <button
                                                onClick={() => openDeleteModal(friend)}
                                                className="text-red-500 hover:text-red-700 ml-2"
                                            >
                                                삭제
                                            </button>
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

            {/* 친구 삭제 확인 모달 */}
            <CommonModal
                isOpen={isDeleteModalOpen}
                onClose={cancelDelete}
                title="친구 삭제 확인"
                onConfirm={confirmDeleteFriend}
            >
                {friendToDelete ? `${friendToDelete.nickname}님을 친구 목록에서 삭제하시겠습니까?` : ""}
            </CommonModal>

            {/* 오류 모달 (취소 버튼 숨김) */}
            <CommonModal
                isOpen={errorModalOpen}
                onClose={closeErrorModal}
                title="오류"
                onConfirm={closeErrorModal}
                showCancel={false}
            >
                {errorMessage}
            </CommonModal>
        </>
    );
}

export default MainComponent;
