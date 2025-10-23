import { useState, useEffect } from "react";
import ChatOverlay from '../../components/chatcomponents/ChatOverlay.jsx';
import useFriendChatStore from '../../stores/useFriendChatStore.js';
import { getUserMinimal } from '../../api/userProfileLightAPI.js'; // 경량 API: 3개 필드만 (_id, nickname, profilePhoto)

function GlobalFriendChatOverlay() {
    const { friendChats, closeFriendChat, swapFriendChat, hiddenRoomIds, toggleHideChat } = useFriendChatStore();
    const MAX_CHAT_WINDOWS = 3;
    const [showMore, setShowMore] = useState(false);
    const [friendsInfo, setFriendsInfo] = useState({}); // 친구 정보를 저장할 state

    // 친구 정보를 가져오는 함수
    const fetchFriendInfo = async (friendId) => {
        try {
            const friendInfo = await getUserMinimal(friendId);
            setFriendsInfo(prev => ({
                ...prev,
                [friendId]: friendInfo
            }));
        } catch (error) {
            console.error(`친구 정보 가져오기 실패 (ID: ${friendId}):`, error);
        }
    };

    // friendChats가 변경될 때마다 친구 정보 가져오기
    useEffect(() => {
        friendChats.forEach(chat => {
            const friendId = chat.friend?._id || chat.friend?.id;
            if (friendId && !friendsInfo[friendId]) {
                fetchFriendInfo(friendId);
            }
        });
    }, [friendChats]);

    // 친구 정보를 가져오는 헬퍼 함수
    const getFriendInfo = (chat) => {
        const friendId = chat.friend?._id || chat.friend?.id;
        // API로 가져온 최신 정보가 있으면 사용, 없으면 기존 정보 사용
        return friendsInfo[friendId] || chat.friend;
    };

    /* 숨김된 채팅 제외 후 최대 3개 표시 */
    const visibleChats = friendChats
        .filter((c) => !hiddenRoomIds.includes(c.roomId))
        .slice(0, MAX_CHAT_WINDOWS);

    const hiddenChats = friendChats.filter(
        (c) => hiddenRoomIds.includes(c.roomId) || !visibleChats.includes(c)
    );

    const toggleShowMore = () => {
        setShowMore((prev) => !prev);
    };

    /* 숨김->보임 전환 */
    const handleRestoreChat = (roomId) => {
        toggleHideChat(roomId);                 // 1) 숨김 해제
        swapFriendChat(roomId, MAX_CHAT_WINDOWS); // 2) 3개 창 안으로 이동
    };

    // 컴포넌트 상단에 함수 추가
    const encodeImageUrl = (url) => {
        if (!url) return null;

        // 전체 URL을 인코딩 (공백을 %20으로 변환)
        return encodeURI(url);
    };

    return (
        <div className="chat-overlay-container">
            {visibleChats.map((chat, index) => {
                const friendInfo = getFriendInfo(chat); // 최신 친구 정보 가져오기
                return (
                    <ChatOverlay
                        key={chat.roomId}
                        roomId={chat.roomId}
                        customStyle={{ right: 20 + index * 360 + "px" }}
                        onClose={() => closeFriendChat(chat.roomId)}
                        friend={friendInfo} // 업데이트된 친구 정보 사용
                    />
                );
            })}

            {hiddenChats.length > 0 && (
                <div className="fixed left-4 bottom-4 z-50">
                    <button
                        onClick={toggleShowMore}
                        className="px-3 py-2 bg-blue-500 text-white text-sm rounded-full shadow-lg hover:bg-blue-700 transition"
                    >
                        {showMore ? "채팅 숨기기" : `+${hiddenChats.length}개 채팅`}
                    </button>

                    {showMore &&
                        hiddenChats.map((chat) => {
                            const friendInfo = getFriendInfo(chat); // 최신 친구 정보 가져오기

                            // // 더 상세한 디버깅
                            // console.log(`=== Chat ${chat.roomId} 디버깅 ===`);
                            // console.log("친구 정보: ", friendInfo)
                            // console.log("1. 원본 profilePhoto:", friendInfo?.profilePhoto);
                            // console.log("2. profilePhoto 타입:", typeof friendInfo?.profilePhoto);
                            // console.log("3. profilePhoto 길이:", friendInfo?.profilePhoto?.length);
                            // console.log("4. 인코딩된 URL:", encodeImageUrl(friendInfo?.profilePhoto));
                            // console.log("5. 조건 체크 결과:", friendInfo?.profilePhoto?.length > 0);
                            // console.log("===============================");

                            return (
                                <button
                                    key={chat.roomId}
                                    onClick={() => handleRestoreChat(chat.roomId)}
                                    className="block my-[5px] w-[40px] h-[40px] bg-[#eee] border border-[#ccc] rounded-full overflow-hidden cursor-pointer"
                                    title={friendInfo?.nickname || friendInfo?.name || "채팅"}
                                >
                                    {/* 조건을 더 명확하게 분리 */}
                                    {(() => {
                                        const hasPhoto = friendInfo?.profilePhoto && friendInfo.profilePhoto.length > 0;
                                        const encodedUrl = encodeImageUrl(friendInfo?.profilePhoto);

                                        // console.log(`렌더링 결정: hasPhoto=${hasPhoto}, encodedUrl=${encodedUrl}`);

                                        if (hasPhoto && encodedUrl) {
                                            return (
                                                <img
                                                    src={encodedUrl}
                                                    alt={friendInfo.nickname || friendInfo.name}
                                                    className="w-full h-full object-cover"
                                                    // onLoad={() => console.log(`✅ 이미지 로드 성공: ${chat.roomId}`)}
                                                    // onError={(e) => {
                                                    //     console.log(`❌ 이미지 로드 실패: ${chat.roomId}`, e);
                                                    //     console.log(`실패한 URL: ${encodedUrl}`);
                                                    // }}
                                                />
                                            );
                                        } else {
                                            return (
                                                <span className="flex items-center justify-center w-full h-full text-sm font-medium text-gray-700">
                                                    {friendInfo?.nickname?.[0] || "?"}
                                                </span>
                                            );
                                        }
                                    })()}
                                </button>
                            );
                        })
                    }

                </div>
            )}
        </div>
    );
}

export default GlobalFriendChatOverlay;
