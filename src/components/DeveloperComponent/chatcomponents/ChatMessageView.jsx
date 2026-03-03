import { useState } from 'react';
import ReportDetailModal from './ReportDetailModal.jsx';

// 날짜를 YYYY.MM.DD로 포맷
const formatDate = date => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
};

// 시간을 HH:MM 형식으로 포맷
const formatTime = date =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const ChatMessageView = ({ 
    messages, 
    selectedRoom, 
    currentUser, 
    reportedMessages = [],
    contextMessageIds = new Set() // 🆕 백엔드에서 받은 컨텍스트 ID Set
}) => {
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedReportData, setSelectedReportData] = useState(null);

    // 🔧 신고된 메시지 ID 집합 생성 - 수정됨
    // reportedMessages 배열의 _id를 직접 사용
    const reportedMessageIds = new Set(
        reportedMessages.map(r => {
            const id = r._id?.toString() || r._id;
            console.log('🔍 [메시지뷰] 신고 메시지 ID:', id);
            return id;
        })
    );

    console.log('🔍 [메시지뷰] reportedMessages:', reportedMessages);
    console.log('🔍 [메시지뷰] reportedMessageIds Set:', Array.from(reportedMessageIds));
    console.log('🔍 [메시지뷰] contextMessageIds Set:', Array.from(contextMessageIds).slice(0, 10));
    console.log('🔍 [메시지뷰] messages 개수:', messages.length);

    // 신고 상세 정보 모달 열기
    const openReportDetail = (messageId) => {
        const reportData = reportedMessages.find(r => 
            (r._id?.toString() || r._id) === messageId
        );
        if (reportData) {
            setSelectedReportData(reportData);
            setShowReportModal(true);
        }
    };

    // 신고 상세 정보 모달 닫기
    const closeReportDetail = () => {
        setShowReportModal(false);
        setSelectedReportData(null);
    };

    // 날짜별 메시지 그룹화
    const groupMessagesByDate = (messages) => {
        return messages.reduce((groups, message) => {
            const date = formatDate(new Date(message.createdAt));
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(message);
            return groups;
        }, {});
    };

    const groupedMessages = groupMessagesByDate(messages);

    return (
        <div className="w-1/3 p-4 overflow-y-auto bg-gray-50 flex flex-col">
            <h2 className="text-xl font-semibold mb-4">대화 내용</h2>
            
            {/* 🆕 디버깅 정보 표시 */}
            {reportedMessages.length > 0 && (
                <div className="mb-4 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs">
                    <div>🚨 신고 메시지: {reportedMessages.length}개</div>
                    <div>📍 컨텍스트: {contextMessageIds.size}개</div>
                </div>
            )}

            {!selectedRoom ? (
                <p className="text-gray-500">채팅방을 선택해주세요</p>
            ) : messages.length > 0 ? (
                <div className="space-y-4">
                    {Object.entries(groupedMessages).map(([date, dayMessages]) => (
                        <div key={date}>
                            {/* 날짜 구분선 */}
                            <div className="text-center mb-4">
                                <span className="bg-white text-gray-500 text-sm px-3 py-1 rounded-full shadow-sm border">{date}</span>
                            </div>
                            
                            {dayMessages.map((msg) => {
                                const senderId = msg.sender?._id || msg.sender;
                                const isMe = !!currentUser && senderId && senderId.toString() === currentUser._id.toString();
                                const displayName = msg.sender?.nickname || '알 수 없음';
                                const isSystemMessage = msg.isSystem || msg.sender?.nickname === 'system';
                                
                                // 🔧 ID 비교 개선 - toString() 사용
                                const msgId = msg._id?.toString() || msg._id;
                                const isReported = reportedMessageIds.has(msgId);
                                const isContext = contextMessageIds.has(msgId);
                                
                                // 🎯 텍스트 표시 여부 판단
                                const shouldShowText = isReported || isContext;

                                // 디버깅 로그 (처음 5개 메시지만)
                                if (dayMessages.indexOf(msg) < 5) {
                                    console.log(`🔍 [메시지${dayMessages.indexOf(msg)}] ID: ${msgId}, 신고됨: ${isReported}, 컨텍스트: ${isContext}, 표시: ${shouldShowText}`);
                                }

                                // 시스템 메시지 처리
                                if (isSystemMessage) {
                                    return (
                                        <div key={msg._id} className="text-center my-4">
                                            <div className="inline-block bg-gray-200 text-gray-600 text-sm px-4 py-2 rounded-full">
                                                <div className="text-xs text-gray-500 mb-1">
                                                    {formatTime(new Date(msg.createdAt))}
                                                </div>
                                                <div>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}>
                                        {/* 상대방 메시지의 경우 프로필 이미지 */}
                                        {!isMe && (
                                            <div className="flex-shrink-0 mr-3">
                                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                                    </svg>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                            {/* 상대방 메시지에만 닉네임 표시 */}
                                            {!isMe && (
                                                <div className="mb-1 text-sm font-medium text-gray-700">
                                                    {displayName}
                                                </div>
                                            )}
                                            
                                            {/* 메시지와 시간을 같은 줄에 배치 */}
                                            <div className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                                                {/* 메시지 말풍선과 상태 표시를 세로로 배치 */}
                                                <div className="flex flex-col">
                                                    {shouldShowText ? (
                                                        // 🎯 텍스트 표시 (신고된 메시지 + 컨텍스트 메시지)
                                                        <div
                                                            className={`px-4 py-2 rounded-2xl whitespace-pre-wrap max-w-full break-words ${
                                                                isReported 
                                                                    ? 'cursor-pointer hover:shadow-lg transition-all border-2 border-red-300 bg-red-50 text-red-900'
                                                                    : isContext
                                                                        ? 'border-2 border-blue-300 bg-blue-50 text-blue-900'
                                                                        : isMe
                                                                            ? 'bg-blue-500 text-white'
                                                                            : 'bg-white text-gray-800 shadow-sm'
                                                            }`}
                                                            onClick={isReported ? () => openReportDetail(msgId) : undefined}
                                                            title={isReported ? "신고 상세 정보 보기" : undefined}
                                                        >
                                                            <div className="break-words">
                                                                {msg.text}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        // 일반 메시지 - 빈 말풍선만 표시
                                                        <div className="px-4 py-3 rounded-2xl bg-white shadow-sm border border-gray-200 min-w-[60px] flex items-center justify-center">
                                                            {/* 빈 말풍선 - 점 3개로 표시 */}
                                                            <div className="flex space-x-1">
                                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* 상태 표시들을 말풍선 바깥 밑에 배치 */}
                                                    <div className={`mt-1 space-y-0.5 ${isMe ? 'text-right' : 'text-left'}`}>
                                                        {/* 삭제 표시 */}
                                                        {msg.isDeleted && (
                                                            <div className="text-[10px] text-gray-500">
                                                                • 삭제됨
                                                            </div>
                                                        )}
                                                        
                                                        {/* 신고됨 표시 */}
                                                        {isReported && (
                                                            <div className="text-[10px] text-red-500 font-medium">
                                                                • 신고됨 🚨
                                                            </div>
                                                        )}
                                                        
                                                        {/* 🎯 맥락 메시지 표시 */}
                                                        {!isReported && isContext && (
                                                            <div className="text-[10px] text-blue-500 font-medium">
                                                                • 맥락 메시지 📍
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* 시간 표시 */}
                                                <div className="text-xs text-gray-500 whitespace-nowrap self-end mb-1">
                                                    {formatTime(new Date(msg.createdAt))}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* 내 메시지의 경우 오른쪽에 프로필 공간 (빈 공간) */}
                                        {isMe && (
                                            <div className="flex-shrink-0 ml-3 w-10"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">메시지가 없습니다</p>
            )}
            
            {/* 신고 상세 정보 모달 */}
            <ReportDetailModal
                isOpen={showReportModal}
                onClose={closeReportDetail}
                reportData={selectedReportData}
            />
        </div>
    );
};

export default ChatMessageView;
