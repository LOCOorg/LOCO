// src/components/FriendListPanel.jsx
import { useState, useEffect, useMemo  } from 'react';
import { usePaginatedFriends } from '../../hooks/usePaginatedFriends';
import useAuthStore from '../../stores/authStore';
//import { getUserInfo } from '../../api/userAPI.js';
import { getUserBasic } from '../../api/userLightAPI.js';  // ✅ 경량 API
import ProfileButton from './ProfileButton';
import CommonModal from '../../common/CommonModal.jsx';
import { findOrCreateFriendRoom, toggleFriendRoomActive,  } from '../../api/chatAPI.js';
import useFriendChatStore from '../../stores/useFriendChatStore.js';
import FriendSection from './FriendSection.jsx';

const FriendListPanel = () => {
    const [user, setUser] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const authUser = useAuthStore((state) => state.user);
    const { openSidePanelWithChat } = useFriendChatStore();

    // const { friends: onlineFriends,
    //     total: onlineTotal,
    //     hasMore: hasMoreOnline,
    //     loadMore: loadMoreOnline,
    //     loading: loadingOnline,
    //     refresh: refreshOnline } = usePaginatedFriends({ online: true });
    //
    // const { friends: offlineFriends,
    //     total: offlineTotal,
    //     hasMore: hasMoreOffline,
    //     loadMore: loadMoreOffline,
    //     loading: loadingOffline,
    //     refresh: refreshOffline } = usePaginatedFriends({ online: false });

    // 전체 친구 한 번에 가져오기
    const {
        friends: allFriends,
        total: totalFriendsCount,
        hasMore,
        loadMore,
        loading,
        refresh
    } = usePaginatedFriends({ online: undefined });


    // 프론트엔드에서 온라인/오프라인 분리

    const onlineFriends = useMemo(() => {
        console.log('🔍 온라인 친구 필터링 실행');
        return allFriends.filter(friend => friend.isOnline);
    }, [allFriends]);

    // allFriends가 변경될 때만 필터링 다시 실행

    const offlineFriends = useMemo(() => {
        console.log('🔍 오프라인 친구 필터링 실행');
        return allFriends.filter(friend => !friend.isOnline);
    }, [allFriends]);


    // 각 섹션의 total 계산

    const onlineTotal = onlineFriends.length;
    const offlineTotal = offlineFriends.length;

    const [isOnlineExpanded, setIsOnlineExpanded] = useState(true);
    const [isOfflineExpanded, setIsOfflineExpanded] = useState(true);

    useEffect(() => {
        if (!authUser) return;
        (async () => {
            try {
                const me = await getUserBasic(authUser._id);
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
        refresh();  // 1번만!
    }, [totalFriends, refresh]);

    const handleFriendSelect = async (friend) => {
        try {
            const friendId = friend._id;

            console.log(`🎯 친구 선택: ${friend.nickname} (${friendId})`);

            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // ✅ 1. 단일 API 호출로 통합
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // 차단 검증 + 방 찾기/생성 + 입장 시간 기록
            // 모두 백엔드에서 처리
            const response = await findOrCreateFriendRoom(user._id, friendId);

            console.log(`✅ 친구방 ${response.action}: ${response.roomId}`);

            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // ✅ 2. 방 활성화
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            await toggleFriendRoomActive(response.roomId, true);

            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // ✅ 3. 채팅 패널 열기
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            openSidePanelWithChat(response.roomId, friend);

        } catch (error) {
            console.error("❌ 친구 채팅 시작 오류:", error);

            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // ✅ 4. 에러 처리 (백엔드 errorCode 기반)
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            let message = "채팅을 시작할 수 없습니다.";

            if (error.response) {
                const status = error.response.status;
                const errorCode = error.response.data?.errorCode;

                if (status === 403 && errorCode === 'BLOCKED_USER') {
                    message = "차단 관계가 있는 사용자와는 채팅할 수 없습니다.";
                } else if (status === 404 && errorCode === 'USER_NOT_FOUND') {
                    message = "사용자를 찾을 수 없습니다.";
                } else if (status === 400 && errorCode === 'MISSING_PARAMS') {
                    message = "잘못된 요청입니다. 다시 시도해주세요.";
                } else if (status === 400 && errorCode === 'INVALID_PARAMS') {
                    message = "자기 자신과는 채팅할 수 없습니다.";
                }
            } else if (error.code === 'ERR_NETWORK') {
                message = "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.";
            }

            setErrorMessage(message);
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
                                hasMore={hasMore}
                                loadMore={loadMore}
                                loading={loading}
                                onFriendSelect={handleFriendSelect}
                                isExpanded={isOnlineExpanded}
                                toggleExpand={() => setIsOnlineExpanded(p => !p)}
                            />
                            <FriendSection
                                title="오프라인"
                                status="offline"
                                friends={offlineFriends}
                                total={offlineTotal}
                                hasMore={hasMore}
                                loadMore={loadMore}
                                loading={loading}
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