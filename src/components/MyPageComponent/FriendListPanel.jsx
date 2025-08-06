// src/components/FriendListPanel.jsx
import { useEffect, useState } from "react";
import {getFriendsPage, getUserInfo} from "../../api/userAPI.js";
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

    const [total, setTotal]   = useState(0);   // 전체 친구 수
    const [page,  setPage]    = useState(0);   // 현재 로드한 마지막 페이지(0-based)
    const [fetching, setFetching] = useState(false);

    const authUser = useAuthStore((state) => state.user);
    const { openFriendChat, addFriendRoom  } = useFriendChatStore();

    const PAGE_SIZE = 5;

    /* ① 내 프로필 + 첫 페이지 */
    useEffect(() => {
        if (!authUser) return;
        (async () => {
            try {
                const me = await getUserInfo(authUser._id);
                setUser(me);

                const { total, friends } =
                    await getFriendsPage(authUser._id, 0, PAGE_SIZE);    // 첫 페이지

                setTotal(total);
                setFriendsList(friends);
                setPage(0);
            } catch (e) {
                console.error("유저 정보 로드 실패", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [authUser]);

    /* ② 더보기 */
    const loadMore = async () => {
        if (fetching) return;
        setFetching(true);
        try {
            const nextPage = page + 1;
            const { friends: newFriends } =
                await getFriendsPage(authUser._id, nextPage * PAGE_SIZE, PAGE_SIZE);

            // 이미 있는 배열 뒤에 붙이기
            setFriendsList([...friends, ...newFriends]);   // [4]
            setPage(nextPage);
        } catch (e) {
            console.error("친구 더보기 실패", e);
            setErrorMessage("친구 목록을 더 가져오지 못했습니다.");
            setErrorModalOpen(true);
        } finally {
            setFetching(false);
        }
    };

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
                <p className="text-gray-400 text-center py-10">로그인 해주세요!</p>
            ) : (
                user && (
                    <>
                        {/* 프로필 헤더 */}
                        <div className="flex items-center mb-6">
                            <ProfileButton profile={user}/>
                            <div className="ml-3">
                                <p className="text-xl font-semibold">{user.nickname}님</p>
                                <p className="text-sm text-gray-500">친구 {total}명</p>
                            </div>
                        </div>

                        {/* 친구 리스트 */}
                        <div className="flex-1 overflow-y-auto">
                            {friends.length ? (
                                <ul className="divide-y divide-gray-200">
                                    {friends.map((f) => (
                                        <li key={f._id} className="p-3 flex items-center">
                                            <div className="cursor-pointer" onClick={() => {}}>
                                                <ProfileButton profile={f} size="sm" area="친구채팅"/>
                                            </div>
                                            <span
                                                className="ml-3 font-medium hover:text-blue-600 cursor-pointer"
                                                onClick={() => handleFriendSelect(f)}
                                            >
                        {f.nickname}
                      </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-400 text-center py-10">아직 친구가 없어요.</p>
                            )}
                        </div>

                        {/* 더보기 버튼: 아직 안 불러온 친구가 있을 때만 노출 */}
                        {friends.length < total && (
                            <button
                                className="mt-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
                                onClick={loadMore}
                                disabled={fetching}
                            >
                                {fetching ? "로딩..." : "더보기"}
                            </button>
                        )}
                    </>
                )
            )}

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
