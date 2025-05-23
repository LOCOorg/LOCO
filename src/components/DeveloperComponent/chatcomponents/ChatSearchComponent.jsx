// File: src/components/DeveloperComponent/chatcomponents/ChatSearchComponent.jsx
import React, { useState } from "react";
import ModeToggle from "./ModeToggle.jsx";
import ChatUserSearchPanel from "./ChatUserSearchPanel.jsx";
import ChatRoomListPanel from "./ChatRoomListPanel.jsx";
import ChatMessageView from "./ChatMessageView.jsx";
import DeveloperComponent from "../DeveloperComponent.jsx";
import { useChatConversation } from "../../../hooks/useChatConversation";  // 공통 훅


const ChatSearchComponent = () => {
    const [mode, setMode] = useState("chat");       // "user" 또는 "chat"
    const [chatUser, setChatUser] = useState(null);

    // 채팅 관련 상태/페칭 훅
    const {
        rooms,
        selectedRoom,
        setSelectedRoom,
        messages
    } = useChatConversation(chatUser, mode);

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <ModeToggle mode={mode} setMode={setMode} />

            {mode === "user" ? (
                <div className="flex flex-1 overflow-hidden">
                    <DeveloperComponent />
                </div>
            ) : (
                <div className="flex flex-1 overflow-hidden">
                    {/* 1) 유저 선택 */}
                    <ChatUserSearchPanel
                        selectedUser={chatUser}
                        setSelectedUser={setChatUser}
                    />

                    {/* 2) 방 목록 */}
                    <ChatRoomListPanel
                        rooms={rooms}
                        selectedRoom={selectedRoom}
                        setSelectedRoom={setSelectedRoom}
                    />

                    {/* 3) 메시지 뷰 */}
                    <ChatMessageView
                        messages={messages}
                        currentUser={chatUser}
                        selectedRoom={selectedRoom}
                    />
                </div>
            )}
        </div>
    );
};

export default ChatSearchComponent;
