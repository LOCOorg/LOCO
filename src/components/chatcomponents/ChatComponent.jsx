import { useParams } from "react-router-dom";
import ChatRoom from "../../components/chatcomponents/ChatRoom.jsx";
import useAuthStore from "../../stores/authStore.js";

const ChatComponent = () => {
    const { roomId } = useParams();
    const user = useAuthStore((state) => state.user);

    if (!user) {
        // user 정보가 아직 준비되지 않았으면 로딩 상태를 보여줍니다.
        return <div>Loading...</div>;
    }

    const userId = user._id; // authStore에서 받아온 사용자 ID

    return <ChatRoom roomId={roomId || ""} userId={userId} />;
};

export default ChatComponent;
