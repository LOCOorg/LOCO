// src/components/FriendListPanel.jsx
import { useEffect, useState } from "react";
import { getUserInfo } from "../../api/userAPI.js";
import {
    fetchChatRooms,
    createFriendRoom,
    joinChatRoom, toggleFriendRoomActive,
} from "../../api/chatAPI.js";
import ProfileButton from "../MyPageComponent/ProfileButton.jsx";
import CommonModal from "../../common/CommonModal.jsx";
import useAuthStore from "../../stores/authStore.js";
import useFriendChatStore from "../../stores/useFriendChatStore.js";
import useFriendListStore from "../../stores/useFriendListStore.js";

const FriendListPanel = () => {
    const [user, setUser] = useState(null);

    const [loading, setLoading] = useState(true);
    const friends        = useFriendListStore((s) => s.friends);
    const setFriendsList = useFriendListStore((s) => s.setFriends);

    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const authUser = useAuthStore((state) => state.user);
    const { openFriendChat, addFriendRoom  } = useFriendChatStore();

    useEffect(() => {
        if (!authUser) return;
        (async () => {
            try {
                const userData = await getUserInfo(authUser._id);
                setUser(userData);
                const friendsData = await Promise.all(userData.friends.map(fid => getUserInfo(fid)));
                setFriendsList(friendsData);
            } catch (e) {
                console.error("유저 정보 로드 실패", e);
            } finally {
                setLoading(false);
            }
        })();
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
            addFriendRoom({ roomId: newRoom._id, friend });
            // 드롭다운에 보여야 하므로 isActive true 로 전환
            try { await toggleFriendRoomActive(newRoom._id, true); } catch (e) { console.error(e); }
        } catch (error) {
            console.error("친구 채팅 시작 오류:", error);
        }
    };
    const closeErrorModal = () => {
        setErrorModalOpen(false);
        setErrorMessage("");
    };

    return (
        <div className="w-80 bg-gray-50 shadow-lg rounded-xl p-5 flex flex-col">
            {loading ? (
                <p className="text-gray-400 text-center py-10">로딩 중...</p>
            ) : user ? (
                <>
                    {/* 프로필 헤더 */}
                    <div className="flex items-center mb-6">
                        <ProfileButton profile={user} />
                        <div className="ml-3">
                            <p className="text-xl font-semibold text-gray-800">
                                {user.nickname}님
                            </p>
                            <p className="text-sm text-gray-500">친구 {friends.length}명</p>
                        </div>
                    </div>

                    {/* 친구 리스트 */}
                    <div className="flex-1 overflow-y-auto">
                        {friends.length > 0 ? (
                            <ul className="divide-y divide-gray-200">
                                {friends.map((friend) => (
                                    <li
                                        key={friend._id}
                                        className="flex items-center justify-between p-3 hover:bg-white rounded-lg transition-shadow shadow-sm hover:shadow-md mb-2"
                                    >
                                        {/* 1. 프로필 버튼 + 닉네임 분리 */}
                                        <div className="flex items-center space-x-3">
                                            {/* 2. 프로필 버튼 클릭: 프로필 보기 (stopPropagation 으로 채팅 오픈 방지) */}
                                            <div
                                                className="cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                }}
                                            >
                                                <ProfileButton profile={friend} size="sm" area="친구채팅" />
                                            </div>

                                            {/* 3. 닉네임 클릭: 친구 채팅 열기 */}
                                            <span
                                                className="text-gray-700 font-medium hover:text-blue-600 transition cursor-pointer"
                                                onClick={() => handleFriendSelect(friend)}
                                            >
                                            {friend.nickname}
                                          </span>
                                        </div>

                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-400 text-center py-10">
                                아직 친구가 없어요.
                            </p>
                        )}
                    </div>
                </>
            ) : null}

            {/* 에러 모달 */}
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
