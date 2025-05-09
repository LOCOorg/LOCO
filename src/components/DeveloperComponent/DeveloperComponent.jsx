// File: src/components/DeveloperComponent/DeveloperComponent.jsx
import React, { useState } from "react";
import { useSearch } from "../../hooks/search.js";  // 기존 사용자 검색 훅
import SearchPanel from "./SearchPanel.jsx";
import DetailPanel from "./DetailPanel.jsx";
import ModeToggle from "./chatcomponents/ModeToggle.jsx";
import ChatUserSearchPanel from "./chatcomponents/ChatUserSearchPanel.jsx";
import ChatRoomListPanel from "./chatcomponents/ChatRoomListPanel.jsx";
import ChatMessageView from "./chatcomponents/ChatMessageView.jsx";
import { useChatConversation } from "../../hooks/useChatConversation";  // 공통 훅

const PAGE_SIZE = 30;

const DeveloperComponent = () => {
    // 1) 사용자 검색 훅 (유저 모드)
    const {
        data: users,
        pagination: userPagination,
        loading: userLoading,
        error: userError,
        keyword: userKeyword,
        setPage: setUserPage,
        setKeyword: setUserKeyword
    } = useSearch({
        endpoint: "/api/search/users",
        initialParams: { searchType: "both" },
        pageSize: PAGE_SIZE,
        minKeywordLength: 1
    });
    const [selectedUser, setSelectedUser] = useState(null);

    // 2) 모드 & 선택된 채팅 유저
    const [mode, setMode] = useState("user");     // "user" 또는 "chat"
    const [chatUser, setChatUser] = useState(null);

    // 3) 채팅 관련 상태 및 페칭 로직 (훅으로 대체)
    const {
        rooms,
        selectedRoom,
        setSelectedRoom,
        messages
    } = useChatConversation(chatUser, mode);

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <ModeToggle mode={mode} setMode={setMode} />

            {mode === "user" ? (
                // ==== 사용자 모드 ====
                <div className="flex flex-1 overflow-hidden">
                    <SearchPanel
                        query={userKeyword}
                        setQuery={setUserKeyword}
                        page={userPagination?.current || 1}
                        setPage={setUserPage}
                        users={users}
                        total={userPagination?.totalCount || 0}
                        loading={userLoading}
                        error={userError}
                        onUserClick={setSelectedUser}
                    />
                    <DetailPanel user={selectedUser} />
                </div>
            ) : (
                // ==== 채팅 모드 ====
                <div className="flex flex-1 overflow-hidden">
                    {/* 1) 유저 선택 */}
                    <ChatUserSearchPanel
                        selectedUser={chatUser}
                        setSelectedUser={u => {
                            setChatUser(u);
                            setSelectedRoom(null);
                        }}
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

export default DeveloperComponent;
