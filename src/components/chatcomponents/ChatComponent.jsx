import { useParams } from "react-router-dom";
import ChatRoom from "../../components/chatcomponents/ChatRoom.jsx";
import useAuthStore from "../../stores/authStore.js";

const ChatComponent = () => {
    const { roomId } = useParams();
    const user = useAuthStore((state) => state.user);
    const userId = user?._id; // authStore에서 받아온 사용자 ID

    return <ChatRoom roomId={roomId || ""} userId={userId} />;
};

export default ChatComponent;
