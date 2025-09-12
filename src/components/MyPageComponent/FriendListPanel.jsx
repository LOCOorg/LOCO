// src/components/FriendListPanel.jsx
import { useState, useEffect } from 'react';
import { usePaginatedFriends } from '../../hooks/usePaginatedFriends';
import useAuthStore from '../../stores/authStore';
import { getUserInfo } from '../../api/userAPI.js';
import ProfileButton from './ProfileButton';
import CommonModal from '../../common/CommonModal.jsx';
import { createFriendRoom, joinChatRoom, toggleFriendRoomActive, fetchChatRooms } from '../../api/chatAPI.js';
import useFriendChatStore from '../../stores/useFriendChatStore.js';
import FriendSection from './FriendSection.jsx';

const FriendListPanel = () => {
    const [user, setUser] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const authUser = useAuthStore((state) => state.user);
    const { openSidePanelWithChat } = useFriendChatStore();

    const { friends: onlineFriends, total: onlineTotal, hasMore: hasMoreOnline, loadMore: loadMoreOnline, loading: loadingOnline, refresh: refreshOnline } = usePaginatedFriends({ online: true });
    const { friends: offlineFriends, total: offlineTotal, hasMore: hasMoreOffline, loadMore: loadMoreOffline, loading: loadingOffline, refresh: refreshOffline } = usePaginatedFriends({ online: false });

    const [isOnlineExpanded, setIsOnlineExpanded] = useState(true);
    const [isOfflineExpanded, setIsOfflineExpanded] = useState(true);

    useEffect(() => {
        if (!authUser) return;
        (async () => {
            try {
                const me = await getUserInfo(authUser._id);
                setUser(me);
            } catch (e) {
                console.error("유저 정보 로드 실패", e);
            } finally {
                setLoadingProfile(false);
            }
        })();
    }, [authUser]);
    
    const totalFriends = useAuthStore(state => state.user?.friends?.length);
    useEffect(() => {
        refreshOnline();
        refreshOffline();
    }, [totalFriends, refreshOnline, refreshOffline]);

    const handleFriendSelect = async (friend) => {
        try {
            const friendId = friend._id;
            const chatRoomsData = await fetchChatRooms({ roomType: 'friend' });

            let room = chatRoomsData.find((room) => {
                if (!room.chatUsers) return false;
                const ids = room.chatUsers.map((u) => u._id);
                return ids.includes(user._id) && ids.includes(friendId);
            });

            if (!room) {
                const newRoomResponse = await createFriendRoom("friend", 2);
                room = newRoomResponse;
                await joinChatRoom(room._id, user._id);
                await joinChatRoom(room._id, friendId);
            }

            openSidePanelWithChat(room._id, friend);
            await toggleFriendRoomActive(room._id, true);
        } catch (error) {
            console.error("친구 채팅 시작 오류:", error);
            setErrorMessage("채팅을 시작할 수 없습니다.");
            setErrorModalOpen(true);
        }
    };

    const closeErrorModal = () => {
        setErrorModalOpen(false);
        setErrorMessage("");
    };

    return (
        <div className="h-full flex flex-col bg-white">
            {loadingProfile ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-500 text-center">로그인 해주세요!</p>
                </div>
            ) : (
                user && (
                    <>
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
                                친구 {onlineTotal + offlineTotal}명
                            </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            <FriendSection
                                title="온라인"
                                status="online"
                                friends={onlineFriends}
                                total={onlineTotal}
                                hasMore={hasMoreOnline}
                                loadMore={loadMoreOnline}
                                loading={loadingOnline}
                                onFriendSelect={handleFriendSelect}
                                isExpanded={isOnlineExpanded}
                                toggleExpand={() => setIsOnlineExpanded(p => !p)}
                            />
                            <FriendSection
                                title="오프라인"
                                status="offline"
                                friends={offlineFriends}
                                total={offlineTotal}
                                hasMore={hasMoreOffline}
                                loadMore={loadMoreOffline}
                                loading={loadingOffline}
                                onFriendSelect={handleFriendSelect}
                                isExpanded={isOfflineExpanded}
                                toggleExpand={() => setIsOfflineExpanded(p => !p)}
                            />
                        </div>
                    </>
                )
            )}
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