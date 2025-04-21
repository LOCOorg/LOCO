// File: src/components/DeveloperComponent/chatcomponents/ChatSearchComponent.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModeToggle from './ModeToggle.jsx';
import ChatUserSearchPanel from './ChatUserSearchPanel.jsx';
import ChatRoomListPanel from './ChatRoomListPanel.jsx';
import ChatMessageView from './ChatMessageView.jsx';
import DeveloperComponent from '../DeveloperComponent.jsx';

const ChatSearchComponent = () => {
    const [mode, setMode] = useState('chat');
    const [chatUser, setChatUser] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages] = useState([]);

    // 유저 클릭 시: 전체 방을 가져와 client-side 필터링
    useEffect(() => {
        if (mode === 'chat' && chatUser) {
            axios
                .get('/api/chat/rooms')
                .then((res) => {
                    const allRooms = res.data || [];
                    // 수정된 필터: ObjectId 와 string 비교
                    const userIdStr = chatUser._id.toString();
                    const userRooms = allRooms.filter((room) =>
                        Array.isArray(room.chatUsers) &&
                        room.chatUsers.some((uid) => uid.toString() === userIdStr)
                    );
                    setRooms(userRooms);
                })
                .catch(console.error);
            setSelectedRoom(null);
            setMessages([]);
        } else {
            setRooms([]);
            setSelectedRoom(null);
            setMessages([]);
        }
    }, [mode, chatUser]);

    // 방 선택 시 메시지 로드
    useEffect(() => {
        if (mode === 'chat' && selectedRoom) {
            axios
                .get(`/api/chat/messages/${selectedRoom._id}`)
                .then((res) => setMessages(res.data || []))
                .catch(console.error);
        }
    }, [mode, selectedRoom]);

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* 모드 토글 */}
            <ModeToggle mode={mode} setMode={setMode} />

            {mode === 'user' ? (
                <div className="flex flex-1 overflow-hidden">
                    <DeveloperComponent />
                </div>
            ) : (
                <div className="flex flex-1 overflow-hidden">
                    <ChatUserSearchPanel
                        selectedUser={chatUser}
                        setSelectedUser={setChatUser}
                    />
                    <ChatRoomListPanel
                        rooms={rooms}
                        selectedRoom={selectedRoom}
                        setSelectedRoom={setSelectedRoom}
                    />
                    <ChatMessageView
                        messages={messages}
                        selectedRoom={selectedRoom}
                    />
                </div>
            )}
        </div>
    );
};

export default ChatSearchComponent;
