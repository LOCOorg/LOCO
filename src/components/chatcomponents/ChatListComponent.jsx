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
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-semibold mb-4">채팅방 목록</h2>
            <ul className="space-y-3">
                {rooms.map((room) => (
                    <li key={room._id} className="flex items-center space-x-3">
                        <button
                            onClick={() => handleNavigate(room._id)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 focus:outline-none"
                        >
                            {room.roomType} 채팅방
                        </button>
                    </li>
                ))}
            </ul>

            <div className="mt-6">
                <h3 className="text-xl font-medium mb-4">-- 채팅방 생성 --</h3>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="채팅방 유형"
                        value={roomType}
                        onChange={(e) => setRoomType(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="mb-4">
                    <input
                        type="number"
                        placeholder="최대 인원 수"
                        value={capacity}
                        onChange={(e) => setCapacity(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button
                    onClick={handleCreateChatRoom}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 focus:outline-none"
                >
                    채팅방 생성
                </button>
            </div>
        </div>
    );
};

export default ChatListComponent;
