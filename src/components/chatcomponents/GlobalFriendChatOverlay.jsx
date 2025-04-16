import { useState } from "react";
import ChatOverlay from '../../components/chatcomponents/ChatOverlay.jsx';
import useFriendChatStore from '../../stores/useFriendChatStore.js';

function GlobalFriendChatOverlay() {
    const { friendChats, closeFriendChat, swapFriendChat } = useFriendChatStore();
    const MAX_CHAT_WINDOWS = 3;
    const [showMore, setShowMore] = useState(false);

    const visibleChats = friendChats.slice(0, MAX_CHAT_WINDOWS);
    const hiddenChats = friendChats.slice(MAX_CHAT_WINDOWS);

    const toggleShowMore = () => {
        setShowMore((prev) => !prev);
    };

    const handleSwapChat = (selectedRoomId) => {
        swapFriendChat(selectedRoomId, MAX_CHAT_WINDOWS);
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
                        {showMore ? "채팅 숨기기" : `+${hiddenChats.length}개의 채팅`}
                    </button>

                    {showMore &&
                        hiddenChats.map((chat) => (
                            <button
                                key={chat.roomId}
                                onClick={() => handleSwapChat(chat.roomId)}
                                className="block my-[5px] p-[5px] bg-[#eee] border border-[#ccc] rounded-full w-[40px] h-[40px] text-center cursor-pointer"
                                title={chat.friend ? chat.friend.nickname || chat.friend.name : "채팅"}
                            >
                                {chat.friend && chat.friend.nickname ? chat.friend.nickname[0] : "채팅"}
                            </button>
                        ))}
                </div>
            )}
        </>
    );
}

export default GlobalFriendChatOverlay;
