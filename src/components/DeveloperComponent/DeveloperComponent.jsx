// File: src/components/DeveloperComponent/DeveloperComponent.jsx
// 관리자 페이지
import {useState, useEffect} from "react";
import {useDeveloperSearch} from "../../hooks/useDeveloperSearch.js";
import SearchPanel from "./SearchPanel.jsx";
import DetailPanel from "./DetailPanel.jsx";
import ModeToggle from "./chatcomponents/ModeToggle.jsx";
import ChatUserSearchPanel from "./chatcomponents/ChatUserSearchPanel.jsx";
import ChatRoomListPanel from "./chatcomponents/ChatRoomListPanel.jsx";
import ChatMessageView from "./chatcomponents/ChatMessageView.jsx";
import {useChatConversation} from "../../hooks/useChatConversation";
import HistoryPanel from "./HistoryPanel.jsx";
import {useSocket} from "../../hooks/useSocket.js";
import instance from "../../api/axiosInstance.js";
import ProfanityManager from './ProfanityManager.jsx'; // 비속어 관리 컴포넌트 import

const PAGE_SIZE = 30;

const DeveloperComponent = () => {

    // 1) 개발자 전용 사용자 검색 훅 (복호화 지원)
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
    // 🔧 온라인 통계 상태 추가
    const [onlineStats, setOnlineStats] = useState({ total: 0, online: 0, offline: 0 });
    
    // 🔧 소켓 인스턴스
    const socket = useSocket();

    // 2) 모드 & 선택된 채팅 유저
    const [mode, setMode] = useState("user");     // "user", "chat", "profanity"
    const [chatUser, setChatUser] = useState(null);
    const [userView, setUserView] = useState("friends"); // "friends" 또는 "photos"

    // 🚨 신고된 메시지 상태 추가
    const [reportedMessages, setReportedMessages] = useState([]);
    const [contextMessageIds, setContextMessageIds] = useState(new Set()); // 🆕 추가

    const {
        rooms,
        selectedRoom,
        setSelectedRoom,
        messages,
        genderSelections
    } = useChatConversation(chatUser, mode);

    // 🚨 선택된 방의 신고 메시지 가져오기 - ✅ 수정됨
    useEffect(() => {
        if (mode === 'chat' && selectedRoom) {
            console.log('🔍 [신고조회] API 호출:', `/api/chat/rooms/${selectedRoom._id}/reported-messages`);

            instance.get(`/api/chat/rooms/${selectedRoom._id}/reported-messages`)
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
        instance
            .get("/api/user/user-count")
            .then(res => {
                if (res.data.success) setTotalUsers(res.data.count);
            })
            .catch(err => console.error(err));

        // 2) 성별별 카운트
        instance.get("/api/user/gender-count")
            .then(res => {
                if (res.data.success) {
                    setMaleUsers(res.data.male);
                    setFemaleUsers(res.data.female);
                }
            })
            .catch(console.error);


        // 2) 소셜 기반 성별 집계
        instance
            .get("/api/user/social-gender-count")
            .then(res => {
                if (res.data.success) {
                    setSocialMaleUsers(res.data.male);
                    setSocialFemaleUsers(res.data.female);
                }
            })
            .catch(console.error);
            
        // 🔧 3) 온라인 통계 조회 및 실시간 업데이트 리스너 등록
        const fetchOnlineStats = () => {
            instance
                .get("/api/online-status/stats")
                .then(res => {
                    if (res.data.success) {
                        setOnlineStats(res.data.data);
                        console.log('📊 온라인 통계 업데이트:', res.data.data);
                    }
                })
                .catch(console.error);
        };
        
        fetchOnlineStats();
        
        // 🔧 소켓 리스너 등록 (사용자 상태 변경 시 실시간 업데이트)
        if (socket) {
            const handleStatusChange = () => {
                console.log('🔄 사용자 상태 변경 감지 - 통계 새로고침');
                fetchOnlineStats();
            };
            
            socket.on('userStatusChanged', handleStatusChange);
            
            return () => {
                socket.off('userStatusChanged', handleStatusChange);
            };
        }
    }, [socket]);  // 🔧 socket 의존성 추가


    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <div className="flex items-center space-x-4  p-4 bg-white border-b">
                <span className="text-lg text-gray-600">총 유저수 {totalUsers}명</span>
                <span className="text-lg text-gray-600">남자: {maleUsers}명</span>
                <span className="text-lg text-gray-600">여자: {femaleUsers}명</span>
                <span className="text-lg text-gray-600">소셜 (남자 : {socialMaleUsers}명</span>
                <span className="text-lg text-gray-600">여자 : {socialFemaleUsers}명)</span>
                {/* 🔧 온라인 통계 추가 */}
                <span className="text-lg text-green-600">🟢 온라인: {onlineStats.online}명</span>
                <span className="text-lg text-red-600">🔴 오프라인: {onlineStats.offline}명</span>
            </div>

            <ModeToggle mode={mode} setMode={setMode}/>

            {mode === "user" && (
                // ==== 사용자 모드 ====
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
            )}
            {mode === "chat" && (
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
                        genderSelections={genderSelections}
                    />

                    {/* 🆕 contextMessageIds 추가 전달 , 메세지 뷰*/}
                    <ChatMessageView
                        messages={messages}
                        currentUser={chatUser}
                        selectedRoom={selectedRoom}
                        reportedMessages={reportedMessages}
                        contextMessageIds={contextMessageIds}
                    />
                </div>
            )}
            {mode === "profanity" && (
                // ==== 비속어 관리 모드 ====
                <div className="flex-1 p-6">
                    <ProfanityManager />
                </div>
            )}
        </div>
    );
};

export default DeveloperComponent;
