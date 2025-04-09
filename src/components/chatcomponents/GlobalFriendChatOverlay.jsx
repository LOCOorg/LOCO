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
                    style={{
                        position: "fixed",
                        bottom: "20px",
                        right: 20 + MAX_CHAT_WINDOWS * 360 + "px",
                        zIndex: 1100,
                    }}
                >
                    <button
                        onClick={toggleShowMore}
                        style={{
                            padding: "10px 15px",
                            backgroundColor: "#0084ff",
                            color: "white",
                            border: "none",
                            cursor: "pointer",
                            borderRadius: "8px",
                            marginBottom: "5px",
                        }}
                    >
                        {showMore ? "채팅 숨기기" : `+${hiddenChats.length}개의 채팅`}
                    </button>

                    {showMore &&
                        hiddenChats.map((chat) => (
                            <button
                                key={chat.roomId}
                                onClick={() => handleSwapChat(chat.roomId)}
                                style={{
                                    display: "block",
                                    margin: "5px 0",
                                    padding: "5px",
                                    backgroundColor: "#eee",
                                    border: "1px solid #ccc",
                                    borderRadius: "50%",
                                    width: "40px",
                                    height: "40px",
                                    textAlign: "center",
                                    cursor: "pointer",
                                }}
                                title={chat.friend ? chat.friend.nickname || chat.friend.name : "채팅"}
                            >
                                {chat.friend && chat.friend.nickname
                                    ? chat.friend.nickname[0]
                                    : "채팅"}
                            </button>
                        ))}
                </div>
            )}
        </>
    );
}

export default GlobalFriendChatOverlay;
