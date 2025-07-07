import { useState } from "react";
import ChatOverlay from '../../components/chatcomponents/ChatOverlay.jsx';
import useFriendChatStore from '../../stores/useFriendChatStore.js';

function GlobalFriendChatOverlay() {
    const { friendChats, closeFriendChat, swapFriendChat, hiddenRoomIds, toggleHideChat } = useFriendChatStore();
    const MAX_CHAT_WINDOWS = 3;
    const [showMore, setShowMore] = useState(false);

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

    return (
        <>
            {visibleChats.map((chat, index) => (
                <ChatOverlay
                    key={chat.roomId}
                    roomId={chat.roomId}
                    customStyle={{ right: 20 + index * 360 + "px" }}
                    onClose={() => closeFriendChat(chat.roomId)}
                    friend={chat.friend}
                />
            ))}

            {hiddenChats.length > 0 && (
                <div
                    className="fixed bottom-5 z-[1100]"
                    style={{ right: 20 + MAX_CHAT_WINDOWS * 360 + "px" }}
                >
                    <button
                        onClick={toggleShowMore}
                        className="py-2.5 px-3.5 bg-[#0084ff] text-white border-0 cursor-pointer rounded-lg mb-[5px]"
                    >
                        {showMore ? "채팅 숨기기" : `+${hiddenChats.length}개 채팅`}
                    </button>

                    {showMore &&
                        hiddenChats.map((chat) => (
                            <button
                                key={chat.roomId}
                                onClick={() => handleRestoreChat(chat.roomId)}
                                className="block my-[5px] w-[40px] h-[40px] bg-[#eee] border border-[#ccc] rounded-full overflow-hidden cursor-pointer"
                                title={chat.friend?.nickname || chat.friend?.name || "채팅"}
                            >
                                {chat.friend?.photo?.length > 0 ? (
                                    <img
                                        src={chat.friend.photo[0]}
                                        alt={chat.friend.nickname || chat.friend.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="flex items-center justify-center w-full h-full text-sm font-medium text-gray-700">
          {chat.friend?.nickname?.[0] || "?"}
        </span>
                                )}
                            </button>
                        ))
                    }

                </div>
            )}
        </>
    );
}

export default GlobalFriendChatOverlay;
