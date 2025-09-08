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
import { useOnlineStatus } from "../../hooks/useOnlineStatus.js";

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
    const { addFriendRoom, openSidePanelWithChat  } = useFriendChatStore();

    // 🔧 친구들의 온라인 상태 추적 (이미 백엔드에서 온라인 상태를 내려주지만 실시간 업데이트를 위해 추가)
    const friendIds = friends.map(friend => friend._id).filter(Boolean);
    const { onlineStatus } = useOnlineStatus(friendIds);

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

            openSidePanelWithChat({ roomId: newRoom._id, friend });
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
        <div className="h-full flex flex-col bg-white">
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-500 text-center">로그인 해주세요!</p>
                </div>
            ) : (
                user && (
                    <>
                        {/* 프로필 헤더 */}
                        <div className="p-4 border-b bg-gray-50">
                            <div className="flex items-center mb-3">
                                <ProfileButton profile={user}/>
                                <div className="ml-3 flex-1 min-w-0">
                                    <p className="text-lg font-semibold text-gray-900 truncate">{user.nickname}님</p>
                                    <p className="text-sm text-gray-500">나의 프로필</p>
                                </div>
                            </div>
                            <div className="text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 font-medium">
                                친구 {total}명
                            </span>
                            </div>
                        </div>

                        {/* 친구 리스트 */}
                        <div className="flex-1 overflow-y-auto">
                            {friends.length ? (
                                <div className="p-2">
                                    {friends.map((f) => {
                                        // 친구의 온라인 상태: 백엔드에서 온 데이터 우선, 실시간 데이터로 fallback
                                        const isOnline = f.isOnline ?? onlineStatus[f._id] ?? false;

                                        return (
                                            <div key={f._id} className="p-3 flex items-center justify-between hover:bg-gray-50 rounded-lg transition-colors">
                                                <div className="flex items-center flex-1 min-w-0">
                                                    <div className="cursor-pointer relative" onClick={() => {}}>
                                                        <ProfileButton profile={f} size="sm" area="친구채팅"/>
                                                        {/* 온라인 상태 지시자 */}
                                                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                                                            isOnline ? 'bg-green-400' : 'bg-gray-400'
                                                        }`} />
                                                    </div>
                                                    <div className="ml-3 flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                        <span className="font-medium text-black hover:text-blue-600 cursor-pointer truncate">
                                                            {f.nickname}
                                                        </span>
                                                            {/* 채팅 아이콘 버튼 */}
                                                            <button
                                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 flex-shrink-0"
                                                                onClick={() => handleFriendSelect(f)}
                                                                title={`${f.nickname}님과 채팅하기`}
                                                            >
                                                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                                                                    <path
                                                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                                                        stroke="currentColor"
                                                                        strokeWidth="2"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            {isOnline ? '온라인' : '오프라인'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full p-6">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-lg font-medium text-gray-600 mb-2">아직 친구가 없어요</p>
                                        <p className="text-sm text-gray-500">새로운 친구를 추가해보세요!</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 더보기 버튼: 아직 안 불러온 친구가 있을 때만 노출 */}
                        {friends.length < total && (
                            <div className="p-3 border-t bg-gray-50">
                                <button
                                    className="w-full py-3 bg-blue-500 text-white rounded-lg disabled:opacity-50 hover:bg-blue-600 transition-colors font-medium"
                                    onClick={loadMore}
                                    disabled={fetching}
                                >
                                    {fetching ? (
                                        <span className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        로딩...
                                    </span>
                                    ) : (
                                        `더보기 (${friends.length}/${total})`
                                    )}
                                </button>
                            </div>
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
