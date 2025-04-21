// C:\Users\wjdtj\WebstormProjects\LOCO\src\components\DeveloperComponent\chatcomponents\ChatRoomListPanel.jsx
import React from 'react';

const ChatRoomListPanel = ({ rooms, selectedRoom, setSelectedRoom }) => (
    <div className="w-1/3 border-r p-4 overflow-y-auto bg-white">
        <h2 className="text-xl font-semibold mb-2">채팅방 목록</h2>
        {rooms.length > 0 ? (
            rooms.map(room => (
                <div
                    key={room._id}
                    onClick={() => setSelectedRoom(room)}
                    className={`p-2 mb-1 rounded cursor-pointer ${
                        selectedRoom?._id === room._id
                            ? 'bg-blue-100'
                            : 'hover:bg-gray-100'
                    }`}
                >
                    <p className="font-medium">방 ID: {room._id}</p>
                    <p className="text-sm text-gray-600">타입: {room.roomType}</p>
                </div>
            ))
        ) : (
            <p className="text-gray-500">회원 선택 후 방 목록이 표시됩니다</p>
        )}
    </div>
);

export default ChatRoomListPanel;
