import React from 'react';
import { useState, useEffect } from 'react';
import { replyToReport, fetchReportChatLog, fetchReportedMessagePlaintext, fetchReportById } from '../../api/reportAPI.js';
import CommonModal from '../../common/CommonModal.jsx';
import useAuthStore from '../../stores/authStore.js';
import {useNavigate} from "react-router-dom";

// eslint-disable-next-line react/prop-types
const ReportDetailModal = ({ reportId, onClose, onUpdateReport }) => {
    const { user } = useAuthStore();
    const [replyContent, setReplyContent] = useState('');
    const [suspensionDays, setSuspensionDays] = useState('');
    const [selectedStopDetail, setSelectedStopDetail] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [localReport, setLocalReport] = useState(null);
    const [modalInfo, setModalInfo] = useState({ isOpen: false, title: '', message: '' });
    const [chatMessages, setChatMessages] = useState([]);
    const [showChatModal, setShowChatModal] = useState(false);
    const [plaintextData, setPlaintextData] = useState(null);
    const [showPlaintextModal, setShowPlaintextModal] = useState(false);
    const [chatData, setChatData] = useState({ messages: [], roomType: '', totalMessages: 0, mode: 'admin' });
    const navigate = useNavigate();

    useEffect(() => {
        if (reportId) {
            fetchReportById(reportId)
                .then(data => {
                    setLocalReport(data);
                    setReplyContent(data?.reportAnswer || '');
                    setSelectedStopDetail(data?.stopDetail || '');
                })
                .catch(err => {
                    setModalInfo({
                        isOpen: true,
                        title: '오류',
                        message: `신고 정보를 불러오는 데 실패했습니다: ${err.message}`
                    });
                });
        }
    }, [reportId]);

    // ✅ 평문 내용 조회 (관리자용)
    const loadPlaintextMessage = async () => {
        try {
            const response = await fetchReportedMessagePlaintext(localReport._id);
            console.log('🔒 평문 내용:', response);
            setPlaintextData(response);
            setShowPlaintextModal(true);
        } catch (err) {
            setModalInfo({
                isOpen: true,
                title: '오류',
                message: err.message
            });
        }
    };

    // 🎯 관리자 모드로 로그 조회 (신고된 메시지만) - 제거 예정
    const loadAdminChatLog = async () => {
        try {
            const response = await fetchReportChatLog(localReport._id, 'admin');
            console.log('🔒 관리자 모드 응답:', response);
            setChatData(response);
            setChatMessages(response.messages || []);
            setShowChatModal(true);
        } catch (err) {
            setModalInfo({
                isOpen: true,
                title: '오류',
                message: err.message
            });
        }
    };

    // 🛠️ 개발자 모드로 로그 조회 (전후 30개씩)
    const loadDeveloperChatLog = async () => {
        try {
            const response = await fetchReportChatLog(localReport._id, 'developer');
            console.log('🔍 개발자 모드 응답:', response);
            setChatData(response);
            setChatMessages(response.messages || []);
            setShowChatModal(true);
        } catch (err) {
            setModalInfo({
                isOpen: true,
                title: '오류',
                message: err.message
            });
        }
    };

    const goTarget = () => {
        if (!localReport?.anchor) return;
        const { parentId, type, targetId } = localReport.anchor;
        navigate(`/community/${parentId}#${type}-${targetId}`);
        onClose();
    };

    if (!localReport) return null;

    const handleReplySubmit = async () => {
        try {
            const updatedReport = await replyToReport(localReport._id, {
                reportAnswer: replyContent,
                suspensionDays: suspensionDays ? parseInt(suspensionDays) : 0,
                stopDetail: selectedStopDetail,
            });
            setLocalReport(updatedReport);
            setIsEditing(false);
            setModalInfo({
                isOpen: true,
                title: '성공',
                message: '답변과 제재 내용이 성공적으로 저장되었습니다.',
            });
            if (onUpdateReport) {
                onUpdateReport(updatedReport);
            }
        } catch (error) {
            setModalInfo({
                isOpen: true,
                title: '오류 발생',
                message: error.message,
            });
        }
    };

    const closeModal = () => setModalInfo(prev => ({ ...prev, isOpen: false }));

    return (
        <>
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                    <button
                        onClick={onClose}
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
                    >
                        ×
                    </button>
                    <h2 className="text-2xl font-bold mb-4">신고 상세 보기</h2>
                    <div className="mb-2">
                        <span className="font-semibold">신고 제목:</span> {localReport.reportTitle}
                    </div>
                    <div className="mb-2">
                        <span className="font-semibold">신고 구역:</span> {localReport.reportArea}
                    </div>
                    <div className="mb-2">
                        <span className="font-semibold">신고 카테고리:</span> {localReport.reportCategory}
                    </div>
                    <div className="mb-2">
                        <span className="font-semibold">신고 내용:</span> {localReport.reportContants}
                    </div>
                    <div className="mb-2">
                        <span className="font-semibold">신고일:</span> {new Date(localReport.reportDate).toLocaleString()}
                    </div>
                    <div className="mb-2">
                        <span className="font-semibold">신고자:</span> {localReport.reportErId?.nickname || localReport.reportErId}
                    </div>
                    <div className="mb-2">
                        <span className="font-semibold">가해자:</span> {localReport.offenderId?.nickname || localReport.offenderId}
                    </div>
                    {localReport.adminId?.nickname && (
                        <div className="mb-2">
                            <span className="font-semibold">처리 관리자:</span> {localReport.adminId.nickname}
                        </div>
                    )}
                    {localReport.stopDetail && (
                        <div className="mb-2">
                            <span className="font-semibold">제재 내용:</span> {localReport.stopDetail}
                        </div>
                    )}
                    {localReport.stopDate && (
                        <div className="mb-2">
                            <span className="font-semibold">정지 시작일:</span> {new Date(localReport.stopDate).toLocaleString()}
                        </div>
                    )}
                    {localReport.durUntil && (
                        <div className="mb-2">
                            <span className="font-semibold">정지 해제일:</span> {new Date(localReport.durUntil).toLocaleString()}
                        </div>
                    )}
                    
                    {/* ✅ 채팅 신고인 경우: 관리자 페이지에서는 모두 평문만 조회 */}
                    {localReport.anchor?.type === 'chat' && (
                        <div className="flex gap-3 mb-4">
                            {/* 관리자 + 개발자: 모두 평문 내용 보기 */}
                            {user && user.userLv >= 2 && (
                                <button
                                    onClick={loadPlaintextMessage}
                                    className="
                                        w-full
                                        inline-flex items-center justify-center gap-2
                                        px-4 py-2
                                        rounded-lg
                                        text-sm font-semibold text-white
                                        bg-gradient-to-r from-red-500 to-pink-500
                                        shadow-md ring-1 ring-inset ring-white/20
                                        transition
                                        hover:brightness-110 hover:shadow-lg
                                        active:scale-95
                                    "
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
                                         viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    신고 내용 보기
                                </button>
                            )}
                        </div>
                    )}

                    {localReport.anchor?.type !== 'chat' && localReport.reportArea !== '프로필' && (
                        <button
                            onClick={goTarget}
                            disabled={!localReport?.anchor}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl mb-4
                                       font-semibold text-sm text-white
                                       bg-gradient-to-br from-indigo-500 to-violet-500
                                       shadow-lg transition
                                       hover:-translate-y-1 hover:shadow-xl
                                       active:translate-y-0 active:shadow-lg
                                       disabled:opacity-45 disabled:shadow-none disabled:cursor-not-allowed"
                        >
                            <span className="text-lg -translate-y-px">📍</span>
                            대상 위치로 이동
                        </button>
                    )}

                    {localReport.reportAnswer && !isEditing && (
                        <div className="mb-4 p-3 bg-gray-100 rounded">
                            <span className="font-semibold text-green-700">답변 내용:</span>
                            <p className="mt-1">{localReport.reportAnswer}</p>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded"
                            >
                                답변 수정
                            </button>
                        </div>
                    )}

                    {(!localReport.reportAnswer || isEditing) && (
                        <div className="mt-4">
                            <textarea
                                placeholder="답변 내용을 입력하세요"
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="w-full border rounded p-2 mb-4"
                                rows={4}
                            />
                            <div className="mt-2 mb-4">
                                <label className="block mb-1 font-semibold">정지 기간 (일):</label>
                                <input
                                    type="number"
                                    value={suspensionDays}
                                    onChange={(e) => setSuspensionDays(e.target.value)}
                                    className="w-full border rounded p-2"
                                    placeholder="예: 7 (정지 기간이 없으면 0 또는 비워두세요)"
                                />
                            </div>
                            <div className="mt-2 mb-4">
                                <label className="block mb-1 font-semibold">제재 내용:</label>
                                <select
                                    value={selectedStopDetail}
                                    onChange={(e) => setSelectedStopDetail(e.target.value)}
                                    className="w-full border rounded p-2"
                                >
                                    <option value="활성">활성</option>
                                    <option value="영구정지">영구정지</option>
                                    <option value="일시정지">일시정지</option>
                                    <option value="경고">경고</option>
                                </select>
                            </div>
                            <button
                                onClick={handleReplySubmit}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
                            >
                                {localReport.reportAnswer ? '답변 수정 완료' : '답변 등록'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <CommonModal
                isOpen={modalInfo.isOpen}
                title={modalInfo.title}
                onClose={closeModal}
                onConfirm={closeModal}
                showCancel={false}
            >
                <p>{modalInfo.message}</p>
            </CommonModal>

            {/* 🔒 평문 내용 모달 */}
            {showPlaintextModal && plaintextData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
                        {/* 헤더 */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    🔒 신고된 메시지 ({plaintextData.roomInfo?.totalReportedMessages || 1}건)
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {plaintextData.roomInfo?.roomType} · 시간순 정렬
                                </p>
                            </div>
                            <button
                                onClick={() => setShowPlaintextModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                            >
                                ×
                            </button>
                        </div>

                        {/* 내용 */}
                        <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50">
                            {/* 신고 정보 */}
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-blue-600 font-bold text-xl">ℹ️</span>
                                    <h4 className="font-bold text-blue-800 text-lg">현재 신고 정보</h4>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex">
                                        <span className="font-semibold text-gray-700 w-24">신고 제목:</span>
                                        <span className="text-gray-900">{plaintextData.reportInfo.reportTitle}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="font-semibold text-gray-700 w-24">신고 유형:</span>
                                        <span className="text-gray-900">{plaintextData.reportInfo.reportCategory}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="font-semibold text-gray-700 w-24">가해자:</span>
                                        <span className="text-gray-900 font-medium">{plaintextData.reportInfo.offenderNickname}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="font-semibold text-gray-700 w-24">신고자:</span>
                                        <span className="text-gray-900">{plaintextData.reportInfo.reportErNickname}</span>
                                    </div>
                                </div>
                            </div>

                            {/* ✅ 신고된 메시지 타임라인 */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-4">
                                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4-4.03 7-9 7a9.77 9.77 0 01-4-.8l-4 1 1.1-3.5A6.8 6.8 0 013 12c0-4 4.03-7 9-7s9 3 9 7z" />
                                    </svg>
                                    <h4 className="font-bold text-gray-800">신고된 메시지 내역</h4>
                                    <span className="ml-auto text-xs text-gray-500">시간순 정렬</span>
                                </div>

                                {plaintextData.allReportedMessages && plaintextData.allReportedMessages.length > 0 && (
                                    plaintextData.allReportedMessages.map((msg, idx) => {
                                        const date = new Date(msg.createdAt);
                                        const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
                                        const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
                                        
                                        return (
                                            <div 
                                                key={msg.messageId}
                                                className={`p-4 rounded-lg border-2 ${
                                                    msg.isCurrentReport 
                                                        ? 'bg-red-50 border-red-300' 
                                                        : 'bg-white border-gray-200'
                                                }`}
                                            >
                                                {/* 헤더 */}
                                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                                                    {msg.isCurrentReport && (
                                                        <span className="text-red-600 font-bold">🚨</span>
                                                    )}
                                                    <span className="font-semibold text-gray-800">
                                                        {msg.sender?.nickname || '알 수 없음'}
                                                    </span>
                                                    {msg.isCurrentReport && (
                                                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                            현재 신고
                                                        </span>
                                                    )}
                                                    {msg.reportersCount > 1 && (
                                                        <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                            신고 {msg.reportersCount}건
                                                        </span>
                                                    )}
                                                    <span className="ml-auto text-xs text-gray-500 font-mono">
                                                        {dateStr} {timeStr}
                                                    </span>
                                                </div>
                                                
                                                {/* 메시지 내용 */}
                                                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                                    <p className="whitespace-pre-wrap break-words text-gray-900 text-sm leading-relaxed">
                                                        {msg.plaintextContent}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                </div>

                            {/* 추가 정보 */}
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <div className="text-xs text-gray-600 space-y-1">
                                    <div className="flex justify-between">
                                        <span>신고 일시:</span>
                                        <span className="font-mono">{new Date(plaintextData.allReportedMessages.find(m => m.isCurrentReport)?.reportedAt || Date.now()).toLocaleString('ko-KR')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>신고 횟수:</span>
                                        <span className="font-semibold text-red-600">{plaintextData.allReportedMessages.find(m => m.isCurrentReport)?.reportersCount || 0}명</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>보관 기한:</span>
                                        <span className="font-mono">{new Date(plaintextData.allReportedMessages.find(m => m.isCurrentReport)?.retentionUntil || Date.now()).toLocaleDateString('ko-KR')}까지</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 푸터 */}
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => setShowPlaintextModal(false)}
                                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-semibold transition"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🎯 채팅 로그 모달 */}
            {showChatModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
                        {/* 헤더 */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    {chatData.mode === 'admin' ? '🔒 신고된 메시지' : '🔍 채팅 맥락 (전후 30개)'}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {chatData.roomType === 'friend' ? '친구 채팅' : '랜덤 채팅'} · 
                                    총 {chatData.totalMessages}개 메시지
                                    {chatData.mode === 'developer' && chatData.contextInfo && 
                                        ` (이전 ${chatData.contextInfo.beforeCount} + 신고 1 + 이후 ${chatData.contextInfo.afterCount})`
                                    }
                                </p>
                            </div>
                            <button
                                onClick={() => setShowChatModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                            >
                                ×
                            </button>
                        </div>

                        {/* 메시지 목록 */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
                            {chatMessages.length === 0 && (
                                <p className="text-center text-gray-500 py-8">메시지가 없습니다.</p>
                            )}

                            {chatMessages.map((msg, idx) => {
                                const offenderId = (localReport.offenderId?._id || localReport.offenderId || '').toString();
                                const senderId = (msg.sender?._id || msg.sender || '').toString();
                                const isOffender = offenderId === senderId;
                                const isReportedMessage = msg.isReported;
                                
                                const nick = msg.sender?.nickname;
                                const real = msg.sender?.name;
                                const who = nick && real ? `${nick}(${real})` : nick || real || '알 수 없음';
                                
                                const dateObj = new Date(msg.textTime || msg.createdAt);
                                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                // 🎯 관리자 모드: 신고된 메시지만 빨간 배경
                                // 🛠️ 개발자 모드: 신고된 메시지는 빨간 배경, 나머지는 작게 표시
                                if (chatData.mode === 'admin') {
                                    // 관리자 모드: 신고된 메시지만 표시
                                    if (!isReportedMessage) return null;
                                    
                                    return (
                                        <div key={msg._id} className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-red-200">
                                                <span className="text-red-600 font-bold text-lg">🚨</span>
                                                <h4 className="font-bold text-red-800">신고된 메시지</h4>
                                                <span className="ml-auto text-xs text-red-600">{timeStr}</span>
                                            </div>
                                            
                                            <div className="bg-white rounded-lg p-4 border border-red-200">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                                            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="font-semibold text-gray-800">{who}</span>
                                                            {isOffender && (
                                                                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                                                    가해자
                                                                </span>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                                            <p className="whitespace-pre-wrap break-words text-gray-900 font-medium text-base">
                                                                {msg.text}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    // 개발자 모드: 전후 맥락 표시
                                    return (
                                        <div 
                                            key={msg._id} 
                                            className={`mb-3 p-3 rounded-lg ${
                                                isReportedMessage 
                                                    ? 'bg-red-50 border-2 border-red-300' 
                                                    : 'bg-white border border-gray-200 opacity-60'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                        isReportedMessage ? 'bg-red-100' : 'bg-gray-100'
                                                    }`}>
                                                        <svg className={`w-5 h-5 ${isReportedMessage ? 'text-red-600' : 'text-gray-400'}`} 
                                                             fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                                        </svg>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`font-semibold ${isReportedMessage ? 'text-gray-800' : 'text-gray-500 text-sm'}`}>
                                                            {who}
                                                        </span>
                                                        <span className={`${isReportedMessage ? 'text-xs text-gray-500' : 'text-xs text-gray-400'}`}>
                                                            {timeStr}
                                                        </span>
                                                        {isOffender && (
                                                            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                                가해자
                                                            </span>
                                                        )}
                                                        {isReportedMessage && (
                                                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                                                🚨 신고
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <p className={`whitespace-pre-wrap break-words ${
                                                        isReportedMessage 
                                                            ? 'text-gray-900 font-medium text-base' 
                                                            : 'text-gray-500 text-sm'
                                                    }`}>
                                                        {msg.text}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                            })}
                        </div>

                        {/* 푸터 */}
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => setShowChatModal(false)}
                                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-semibold transition"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ReportDetailModal;
