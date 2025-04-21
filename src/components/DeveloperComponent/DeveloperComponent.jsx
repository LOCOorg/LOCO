// File: src/components/DeveloperComponent/DeveloperComponent.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import SearchPanel from "./SearchPanel.jsx";
import DetailPanel from "./DetailPanel.jsx";

// Chat 모드용 컴포넌트
import ModeToggle from "./chatcomponents/ModeToggle.jsx";
import ChatUserSearchPanel from "./chatcomponents/ChatUserSearchPanel.jsx";
import ChatRoomListPanel from "./chatcomponents/ChatRoomListPanel.jsx";
import ChatMessageView from "./chatcomponents/ChatMessageView.jsx";

const DeveloperComponent = () => {
    // --- User Search용 상태 ---
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);

    // --- Chat Search용 상태 ---
    const [mode, setMode] = useState("user"); // "user" or "chat"
    const [chatUser, setChatUser] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages] = useState([]);

    // Chat 모드에서 회원 선택 시 채팅방 불러오기
    useEffect(() => {
        if (mode === "chat" && chatUser) {
            axios
                .get(`/api/chat/rooms?userId=${chatUser._id}`)
                .then((res) => setRooms(res.data || []))
                .catch(console.error);
            setSelectedRoom(null);
            setMessages([]);
        }
    }, [mode, chatUser]);

    // Chat 모드에서 방 선택 시 메시지 불러오기
    useEffect(() => {
        if (mode === "chat" && selectedRoom) {
            axios
                .get(`/api/chat/messages?roomId=${selectedRoom._id}`)
                .then((res) => setMessages(res.data || []))
                .catch(console.error);
        }
    }, [mode, selectedRoom]);

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* 모드 토글 */}
            <ModeToggle mode={mode} setMode={setMode} />

            {mode === "user" ? (
                // ==== 기존 개발자(User) 모드 ====
                <div className="flex flex-1 overflow-hidden">
                    {/* 좌측: User Search */}
                    <SearchPanel
                        query={query}
                        setQuery={setQuery}
                        page={page}
                        setPage={setPage}
                        users={users}
                        total={total}
                        loading={loading}
                        error={error}
                        onUserClick={setSelectedUser}
                    />
                    {/* 우측: User Detail */}
                    <DetailPanel user={selectedUser} />
                </div>
            ) : (
                // ==== Chat Search 모드 ====
                <div className="flex flex-1 overflow-hidden">
                    {/* 1/3: 회원 검색 → 채팅용 */}
                    <ChatUserSearchPanel
                        selectedUser={chatUser}
                        setSelectedUser={setChatUser}
                    />
                    {/* 1/3: 방 목록 */}
                    <ChatRoomListPanel
                        rooms={rooms}
                        selectedRoom={selectedRoom}
                        setSelectedRoom={setSelectedRoom}
                    />
                    {/* 1/3: 메시지 뷰 */}
                    <ChatMessageView
                        messages={messages}
                        selectedRoom={selectedRoom}
                    />
                </div>
            )}
        </div>
    );
};

export default DeveloperComponent;
