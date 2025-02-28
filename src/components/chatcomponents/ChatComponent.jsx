import { useParams } from "react-router-dom";
import ChatRoom from "../../components/chatcomponents/ChatRoom.jsx";

const ChatComponent = () => {
    const { roomId } = useParams();
    const userId = "67bea7c29118c00aca0d5f1b"; // 예제 유저 ID

    return <ChatRoom roomId={roomId || ""} userId={userId} />;
};

export default ChatComponent;
