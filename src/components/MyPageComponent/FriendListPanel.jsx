// src/components/FriendListPanel.jsx
import { useEffect, useState } from "react";
import { getUserInfo, deleteFriend } from "../../api/userAPI.js";
import { fetchChatRooms, createFriendRoom, joinChatRoom } from "../../api/chatAPI.js";
import ProfileButton from "../MyPageComponent/ProfileButton.jsx";
import CommonModal from "../../common/CommonModal.jsx";
import useAuthStore from "../../stores/authStore.js";
import useFriendChatStore from "../../stores/useFriendChatStore.js";

const FriendListPanel = () => {
    const [user, setUser] = useState(null);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [friendToDelete, setFriendToDelete] = useState(null);
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const authUser = useAuthStore((state) => state.user);
    const { openFriendChat } = useFriendChatStore();

    useEffect(() => {
        if (!authUser) return;

        const fetchUserData = async () => {
            try {
                const userData = await getUserInfo(authUser._id);
                setUser(userData);
                const friendsData = await Promise.all(
                    userData.friends.map(async (friendId) => {
                        return await getUserInfo(friendId);
                    })
                );
                setFriends(friendsData);
            } catch (error) {
                console.error("유저 정보 로드 실패", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [authUser]);

    const handleFriendSelect = async (friend) => {
        try {
            const friendId = friend._id;
            const chatRoomsData = await fetchChatRooms();
            const friendChatRooms = chatRoomsData.filter(
                (room) => room.roomType === "friend"
            );

            const existingRoom = friendChatRooms.find((room) => {
                if (!room.chatUsers) return false;
                const ids = room.chatUsers.map((u) => u._id);
                return ids.includes(user._id) && ids.includes(friendId);
            });

            let newRoom = existingRoom;
            if (!existingRoom) {
                const room = await createFriendRoom("friend", 2);
                await joinChatRoom(room._id, user._id);
                await joinChatRoom(room._id, friendId);
                newRoom = { ...room, chatUsers: [user._id, friendId] };
            }

            openFriendChat({ roomId: newRoom._id, friend });
        } catch (error) {
            console.error("친구 채팅 시작 오류:", error);
        }
    };

    const openDeleteModal = (friend) => {
        setFriendToDelete(friend);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteFriend = async () => {
        try {
            await deleteFriend(user._id, friendToDelete._id);
            setFriends(friends.filter((f) => f._id !== friendToDelete._id));
            setIsDeleteModalOpen(false);
            setFriendToDelete(null);
        } catch (error) {
            setErrorMessage(error.message || "삭제 실패");
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

    return (
        <div className="w-80 p-4 bg-white shadow-md rounded-lg">
            {loading ? (
                <p className="text-gray-500">로딩 중...</p>
            ) : user ? (
                <>
                    <div className="flex items-center mb-4">
                        <ProfileButton profile={user} />
                        <span className="ml-2 text-lg font-medium text-gray-700">{user.nickname} 님</span>
                    </div>
                    <p className="text-gray-600 mb-2">친구 목록:</p>
                    <ul className="list-disc pl-5 text-gray-700">
                        {friends.length > 0 ? (
                            friends.map((friend) => (
                                <li key={friend._id} className="flex items-center space-x-2 mb-2">
                                    <ProfileButton profile={friend} />
                                    <span
                                        className="cursor-pointer text-blue-500 hover:text-blue-700"
                                        onClick={() => handleFriendSelect(friend)}
                                    >
                                        {friend.nickname}
                                    </span>
                                    <button
                                        onClick={() => openDeleteModal(friend)}
                                        className="text-red-500 hover:text-red-700 ml-auto"
                                    >
                                        삭제
                                    </button>
                                </li>
                            ))
                        ) : (
                            <p className="text-gray-500">친구가 없습니다.</p>
                        )}
                    </ul>
                </>
            ) : null}

            <CommonModal
                isOpen={isDeleteModalOpen}
                onClose={cancelDelete}
                title="친구 삭제 확인"
                onConfirm={confirmDeleteFriend}
            >
                {friendToDelete ? `${friendToDelete.nickname}님을 친구 목록에서 삭제하시겠습니까?` : ""}
            </CommonModal>

            <CommonModal
                isOpen={errorModalOpen}
                onClose={closeErrorModal}
                title="오류"
                onConfirm={closeErrorModal}
                showCancel={false}
            >
                {errorMessage}
            </CommonModal>
        </div>
    );
};

export default FriendListPanel;
