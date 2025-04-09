import ChatOverlay from '../../components/chatcomponents/ChatOverlay.jsx';
import useFriendChatStore from '../../stores/useFriendChatStore.js';

function GlobalFriendChatOverlay() {
    const { friendChats, closeFriendChat } = useFriendChatStore();

    return (
        <>
            {friendChats.map((chat, index) => (
                <ChatOverlay
                    key={chat.roomId}
                    roomId={chat.roomId}
                    customStyle={{ right: 20 + index * 360 + "px" }}
                    onClose={() => closeFriendChat(chat.roomId)}
                    friend={chat.friend}
                />
            ))}
        </>
    );
}

export default GlobalFriendChatOverlay;
