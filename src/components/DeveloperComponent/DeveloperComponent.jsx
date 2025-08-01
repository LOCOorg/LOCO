// File: src/components/DeveloperComponent/DeveloperComponent.jsx
import React, {useState, useEffect} from "react";
import {useSearch} from "../../hooks/search.js";  // 기존 사용자 검색 훅
import SearchPanel from "./SearchPanel.jsx";
import DetailPanel from "./DetailPanel.jsx";
import ModeToggle from "./chatcomponents/ModeToggle.jsx";
import ChatUserSearchPanel from "./chatcomponents/ChatUserSearchPanel.jsx";
import ChatRoomListPanel from "./chatcomponents/ChatRoomListPanel.jsx";
import ChatMessageView from "./chatcomponents/ChatMessageView.jsx";
import {useChatConversation} from "../../hooks/useChatConversation";  // 공통 훅
import {useLv} from "../../hooks/useLv";
import {Navigate} from "react-router-dom";
import HistoryPanel from "./HistoryPanel.jsx";
import axios from "axios";

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
        initialParams: {searchType: "both"},
        pageSize: PAGE_SIZE,
        minKeywordLength: 1
    });


    const [selectedUser, setSelectedUser] = useState(null);
    const [totalUsers, setTotalUsers] = useState(0);
    const [maleUsers, setMaleUsers] = useState(0);
    const [femaleUsers, setFemaleUsers] = useState(0);
    const [socialMaleUsers, setSocialMaleUsers] = useState(0);
    const [socialFemaleUsers, setSocialFemaleUsers] = useState(0);

    // 2) 모드 & 선택된 채팅 유저
    const [mode, setMode] = useState("user");     // "user" 또는 "chat"
    const [chatUser, setChatUser] = useState(null);
    const [userView, setUserView] = useState("friends"); // "friends" 또는 "photos"

    // 3) 채팅 관련 상태 및 페칭 로직 (훅으로 대체)
    const {
        rooms,
        selectedRoom,
        setSelectedRoom,
        messages
    } = useChatConversation(chatUser, mode);
//lv에따라 접근 차단
    // const { currentUser } = useLv();
    // // 아직 로딩 중인 경우 (user === null) 빈 화면 또는 로더 처리 가능
    // if (currentUser === null) {
    //     return null;
    // }
    // if (currentUser.userLv < 3) {
    //     window.alert("접근 권한이 없습니다.");
    //     return <Navigate to="/" replace />;
    // }

    useEffect(() => {
        axios
            .get("/api/user/user-count")
            .then(res => {
                if (res.data.success) setTotalUsers(res.data.count);
            })
            .catch(err => console.error(err));

        // 2) 성별별 카운트
        axios.get("/api/user/gender-count")
            .then(res => {
                if (res.data.success) {
                    setMaleUsers(res.data.male);
                    setFemaleUsers(res.data.female);
                }
            })
            .catch(console.error);


        // 2) 소셜 기반 성별 집계
        axios
            .get("/api/user/social-gender-count")
            .then(res => {
                if (res.data.success) {
                    setSocialMaleUsers(res.data.male);
                    setSocialFemaleUsers(res.data.female);
                }
            })
            .catch(console.error);
    }, []);


    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <div className="flex items-center space-x-4  p-4 bg-white border-b">
                <span className="text-lg text-gray-600">총 유저수 {totalUsers}명</span>
                <span className="text-lg text-gray-600">남자: {maleUsers}명</span>
                <span className="text-lg text-gray-600">여자: {femaleUsers}명</span>
                <span className="text-lg text-gray-600">소셜 (남자 : {socialMaleUsers}명</span>
                <span className="text-lg text-gray-600">여자 : {socialFemaleUsers}명)</span>
            </div>

            <ModeToggle mode={mode} setMode={setMode}/>

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
                    <DetailPanel user={selectedUser}
                                 view={userView}
                                 setView={setUserView}/>
                    <HistoryPanel
                        user={selectedUser}
                        view={userView}
                        className="w-1/3"
                    />

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
