import { useParams } from "react-router-dom";
import ChatRoom from "../../components/chatcomponents/ChatRoom.jsx";

const ChatComponent = () => {
    const { roomId } = useParams();
    const userId = "67bc2846c9d62c1110715d8a"; // 예제 유저 ID

    return <ChatRoom roomId={roomId || ""} userId={userId} />;
};

export default ChatComponent;
