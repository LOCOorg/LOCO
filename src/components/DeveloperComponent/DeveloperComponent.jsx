// File: src/components/DeveloperComponent/DeveloperComponent.jsx
import React, {useState, useEffect} from "react";
import {useDeveloperSearch} from "../../hooks/useDeveloperSearch.js";
import SearchPanel from "./SearchPanel.jsx";
import DetailPanel from "./DetailPanel.jsx";
import ModeToggle from "./chatcomponents/ModeToggle.jsx";
import ChatUserSearchPanel from "./chatcomponents/ChatUserSearchPanel.jsx";
import ChatRoomListPanel from "./chatcomponents/ChatRoomListPanel.jsx";
import ChatMessageView from "./chatcomponents/ChatMessageView.jsx";
import {useChatConversation} from "../../hooks/useChatConversation";
import {useLv} from "../../hooks/useLv";
import {Navigate} from "react-router-dom";
import HistoryPanel from "./HistoryPanel.jsx";
import {useSocket} from "../../hooks/useSocket.js";
import axios from "axios";

const PAGE_SIZE = 30;

const DeveloperComponent = () => {

    const {
        data: users,
        pagination: userPagination,
        loading: userLoading,
        error: userError,
        keyword: userKeyword,
        setKeyword: setUserKeyword,
        setPage: setUserPage,
        loadMore
    } = useDeveloperSearch({
        pageSize: PAGE_SIZE,
        minKeywordLength: 1
    });

    const [selectedUser, setSelectedUser] = useState(null);
    const [totalUsers, setTotalUsers] = useState(0);
    const [maleUsers, setMaleUsers] = useState(0);
    const [femaleUsers, setFemaleUsers] = useState(0);
    const [socialMaleUsers, setSocialMaleUsers] = useState(0);
    const [socialFemaleUsers, setSocialFemaleUsers] = useState(0);
    const [onlineStats, setOnlineStats] = useState({ total: 0, online: 0, offline: 0 });
    
    const socket = useSocket();

    const [mode, setMode] = useState("user");
    const [chatUser, setChatUser] = useState(null);
    const [userView, setUserView] = useState("friends");

    // 🚨 신고된 메시지 상태 추가
    const [reportedMessages, setReportedMessages] = useState([]);
    const [contextMessageIds, setContextMessageIds] = useState(new Set()); // 🆕 추가

    const {
        rooms,
        selectedRoom,
        setSelectedRoom,
        messages
    } = useChatConversation(chatUser, mode);

    // 🚨 선택된 방의 신고 메시지 가져오기 - ✅ 수정됨
    useEffect(() => {
        if (mode === 'chat' && selectedRoom) {
            console.log('🔍 [신고조회] API 호출:', `/api/chat/rooms/${selectedRoom._id}/reported-messages`);
            
            axios.get(`/api/chat/rooms/${selectedRoom._id}/reported-messages`)
                .then(res => {
                    console.log('🚨 [신고조회] 응답 전체:', res.data);
                    console.log('🚨 [신고조회] reportedMessages:', res.data.reportedMessages);
                    console.log('🚨 [신고조회] contextMessageIds:', res.data.contextMessageIds);
                    
                    if (res.data.success) {
                        setReportedMessages(res.data.reportedMessages || []);
                        // 🆕 contextMessageIds를 Set으로 변환하여 저장
                        setContextMessageIds(new Set(res.data.contextMessageIds || []));
                        
                        console.log(`✅ [신고조회] 신고 메시지 ${res.data.totalReported}개, 컨텍스트 ${res.data.totalContext}개 로드됨`);
                        console.log(`✅ [신고조회] reportedMessages 배열:`, res.data.reportedMessages.map(m => m._id));
                        console.log(`✅ [신고조회] contextMessageIds Set:`, Array.from(res.data.contextMessageIds || []).slice(0, 10));
                    } else {
                        setReportedMessages([]);
                        setContextMessageIds(new Set());
                    }
                })
                .catch(err => {
                    console.error('❌ [신고조회] 실패:', err);
                    console.error('❌ [신고조회] 에러 상세:', err.response?.data || err.message);
                    setReportedMessages([]);
                    setContextMessageIds(new Set());
                });
        } else {
            setReportedMessages([]);
            setContextMessageIds(new Set());
        }
    }, [mode, selectedRoom]);

    useEffect(() => {
        axios
            .get("/api/user/user-count")
            .then(res => {
                if (res.data.success) setTotalUsers(res.data.count);
            })
            .catch(err => console.error(err));

        axios.get("/api/user/gender-count")
            .then(res => {
                if (res.data.success) {
                    setMaleUsers(res.data.male);
                    setFemaleUsers(res.data.female);
                }
            })
            .catch(console.error);

        axios
            .get("/api/user/social-gender-count")
            .then(res => {
                if (res.data.success) {
                    setSocialMaleUsers(res.data.male);
                    setSocialFemaleUsers(res.data.female);
                }
            })
            .catch(console.error);
            
        const fetchOnlineStats = () => {
            axios
                .get("/api/online-status/stats")
                .then(res => {
                    if (res.data.success) {
                        setOnlineStats(res.data.data);
                    }
                })
                .catch(console.error);
        };
        
        fetchOnlineStats();
        
        if (socket) {
            const handleStatusChange = () => {
                fetchOnlineStats();
            };
            
            socket.on('userStatusChanged', handleStatusChange);
            
            return () => {
                socket.off('userStatusChanged', handleStatusChange);
            };
        }
    }, [socket]);

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <div className="flex items-center space-x-4  p-4 bg-white border-b">
                <span className="text-lg text-gray-600">총 유저수 {totalUsers}명</span>
                <span className="text-lg text-gray-600">남자: {maleUsers}명</span>
                <span className="text-lg text-gray-600">여자: {femaleUsers}명</span>
                <span className="text-lg text-gray-600">소셜 (남자 : {socialMaleUsers}명</span>
                <span className="text-lg text-gray-600">여자 : {socialFemaleUsers}명)</span>
                <span className="text-lg text-green-600">🟢 온라인: {onlineStats.online}명</span>
                <span className="text-lg text-red-600">🔴 오프라인: {onlineStats.offline}명</span>
            </div>

            <ModeToggle mode={mode} setMode={setMode}/>

            {mode === "user" ? (
                <div className="flex flex-1 overflow-hidden">
                    <SearchPanel
                        keyword={userKeyword}
                        setKeyword={setUserKeyword}
                        pagination={userPagination}
                        users={users}
                        loading={userLoading}
                        error={userError}
                        onUserClick={setSelectedUser}
                        loadMore={loadMore}
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
                <div className="flex flex-1 overflow-hidden">
                    <ChatUserSearchPanel
                        selectedUser={chatUser}
                        setSelectedUser={u => {
                            setChatUser(u);
                            setSelectedRoom(null);
                        }}
                    />

                    <ChatRoomListPanel
                        rooms={rooms}
                        selectedRoom={selectedRoom}
                        setSelectedRoom={setSelectedRoom}
                    />

                    {/* 🆕 contextMessageIds 추가 전달 */}
                    <ChatMessageView
                        messages={messages}
                        currentUser={chatUser}
                        selectedRoom={selectedRoom}
                        reportedMessages={reportedMessages}
                        contextMessageIds={contextMessageIds}
                    />
                </div>
            )}
        </div>
    );
};

export default DeveloperComponent;
