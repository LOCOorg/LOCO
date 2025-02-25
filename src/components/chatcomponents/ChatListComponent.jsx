import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchChatRooms, createChatRoom } from "../../api/chatAPI";

const ChatListComponent = () => {
    const [rooms, setRooms] = useState([]);
    const [roomType, setRoomType] = useState("");
    const [capacity, setCapacity] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        fetchChatRooms().then(setRooms);
    }, []);

    const handleNavigate = (roomId) => {
        navigate(`/chat/${roomId}`);
    };

    const handleCreateChatRoom = async () => {

        const newRoom = await createChatRoom(roomType, capacity);
        if (newRoom) {
            setRooms(prevRooms => [...prevRooms, newRoom]);
        }
    };

    return (
        <div>
            <h2>채팅방 목록</h2>
            <ul>
                {rooms.map((room) => (
                    <li key={room._id}>
                        <button onClick={() => handleNavigate(room._id)}>
                            {room.roomType} 채팅방
                        </button>
                    </li>
                ))}
            </ul>

            <h3>-- 채팅방 생성 --</h3>
            <div>
                <input
                    type="text"
                    placeholder="채팅방 유형"
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                />
            </div>
            <div>
                <input
                    type="number"
                    placeholder="최대 인원 수"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                />
            </div>
            <button onClick={handleCreateChatRoom}>채팅방 생성</button>
        </div>
    );
};

export default ChatListComponent;
