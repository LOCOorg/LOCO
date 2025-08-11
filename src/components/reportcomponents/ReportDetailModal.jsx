import React from 'react';
import { useState, useEffect } from 'react';
import { replyToReport, fetchReportChatLog  } from '../../api/reportAPI.js';
import CommonModal from '../../common/CommonModal.jsx';
import useAuthStore from '../../stores/authStore.js';
import {useNavigate} from "react-router-dom";

// eslint-disable-next-line react/prop-types
const ReportDetailModal = ({ report, onClose, onUpdateReport }) => {
    const { user } = useAuthStore();
    const [replyContent, setReplyContent] = useState('');
    const [suspensionDays, setSuspensionDays] = useState('');
    const [selectedStopDetail, setSelectedStopDetail] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [localReport, setLocalReport] = useState(report);
    const [modalInfo, setModalInfo] = useState({ isOpen: false, title: '', message: '' });

    const [chatMessages, setChatMessages] = useState([]);
    const [showChatModal, setShowChatModal] = useState(false);

    const navigate = useNavigate();

    const [chatData, setChatData] = useState({ messages: [], roomType: '', totalMessages: 0 });


    const loadChatLog = async () => {
        try {
            const response = await fetchReportChatLog(localReport._id);
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

    useEffect(() => {
        setLocalReport(report);
        // eslint-disable-next-line react/prop-types
        setReplyContent(report?.reportAnswer || '');
        // eslint-disable-next-line react/prop-types
        setSelectedStopDetail(report?.stopDetail || '');
    }, [report]);

    if (!localReport) return null;

    const handleReplySubmit = async () => {
        try {
            const updatedReport = await replyToReport(localReport._id, {
                reportAnswer: replyContent,
                adminId: user?._id,
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
                <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg relative">
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
                    {localReport.anchor?.type === 'chat' && (
                        <button
                            onClick={loadChatLog}
                            className="
                                      inline-flex items-center gap-2
                                      px-4 py-2
                                      rounded-lg
                                      text-sm font-semibold text-white
                                      bg-gradient-to-r from-teal-400 to-blue-500
                                      shadow-md ring-1 ring-inset ring-white/20
                                      transition
                                      hover:brightness-110 hover:shadow-lg
                                      active:scale-95
                                      focus-visible:outline-none
                                      focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-300
                                    "
                        >
                            {/* 작은 채팅 아이콘 (Heroicons) */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
                                 viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round"
                                      d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4-4.03 7-9 7a9.77 9.77 0 01-4-.8l-4 1 1.1-3.5A6.8 6.8 0 013 12c0-4 4.03-7 9-7s9 3 9 7z" />
                            </svg>
                            채팅 내역 보기
                        </button>
                    )}


                    {localReport.anchor?.type !== 'chat' && (
                        <button
                            onClick={goTarget}
                            disabled={!localReport?.anchor}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl
                                       font-semibold text-sm text-white
                                       bg-gradient-to-br from-indigo-500 to-violet-500
                                       shadow-lg transition
                                       hover:-translate-y-1 hover:shadow-xl
                                       active:translate-y-0 active:shadow-lg
                                       disabled:opacity-45 disabled:shadow-none disabled:cursor-not-allowed
                                       focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
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

            {showChatModal && (
                <CommonModal
                    title={`(${chatData.roomType === 'friend' ? '친구 채팅' : '랜덤 채팅'}) - 총 ${chatData.totalMessages}개 메시지`}
                    isOpen={true}
                    onConfirm={() => setShowChatModal(false)}
                    showCancel={false}
                >
                    {/* ── 스크롤 컨테이너 ────────────────────────── */}
                    <div className="max-h-[70vh] overflow-y-auto px-3 py-4 bg-gray-50 rounded-lg">

                        {/* 친구 채팅방인 경우 날짜 범위 표시 */}
                        {chatData.roomType === 'friend' && chatData.dateRange && (
                            <div className="mb-4 p-2 bg-blue-50 rounded">
                                📅 표시 범위: {new Date(chatData.dateRange.from).toLocaleDateString()} ~ {new Date(chatData.dateRange.to).toLocaleDateString()}
                            </div>
                        )}

                        {chatMessages.length === 0 && (
                            <p className="text-center text-gray-500 py-8">채팅 기록이 없습니다.</p>
                        )}

                        {chatMessages.map((msg, idx) => {
                            /* 날짜 · 시간 포맷 */
                            const dateObj  = new Date(msg.textTime || msg.createdAt);
                            const prevDate = idx > 0 ? new Date(chatMessages[idx - 1].textTime || chatMessages[idx - 1].createdAt) : null;

                            const y = dateObj.getFullYear();
                            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                            const d = String(dateObj.getDate()).padStart(2, '0');
                            const dateStr = `${y}.${m}.${d}`;
                            const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                            const showDateLine = idx === 0 || dateStr !==
                                `${prevDate?.getFullYear()}.${String(prevDate?.getMonth()+1).padStart(2,'0')}.${String(prevDate?.getDate()).padStart(2,'0')}`;

                            /* “가해자” 기준 노란/회색 말풍선 구분 */
                            const offenderId = (localReport.offenderId?._id || localReport.offenderId || '').toString();
                            const senderId   = (msg.sender?._id        || msg.sender        || '').toString();
                            const isMe = offenderId === senderId;

                            /* 닉네임(실명) 표시 */
                            const nick = msg.sender?.nickname;
                            const real = msg.sender?.name;
                            const who  = nick && real ? `${nick}(${real})` : nick || real || '알 수 없음';

                            // System 메시지 체크
                            const isSystemMessage = msg.isSystem || msg.sender?.nickname === 'system';

                            if (isSystemMessage) {
                                // System 메시지는 TailwindCSS로 다른 스타일 적용
                                return (
                                    <div key={idx}>
                                        {showDateLine && (
                                            <div className="text-center my-2.5 text-gray-400 text-xs">
                                                {dateStr}
                                            </div>
                                        )}
                                        <div className="text-center my-2 mx-auto max-w-[80%] px-3 py-1.5 bg-gray-100 rounded-xl text-sm text-gray-600">
                                            <div className="text-xs text-gray-400 mb-0.5">
                                                {timeStr}
                                            </div>
                                            <div className="italic">
                                                {msg.text}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <React.Fragment key={msg._id}>
                                    {/* 날짜 구분선 ------------------------------------------------ */}
                                    {showDateLine && (
                                        <div className="w-full text-center my-3 text-[11px] text-gray-400 select-none">
                                            ── {dateStr} ──
                                        </div>
                                    )}

                                    {/* 메시지 한 줄 ---------------------------------------------- */}
                                    <div className={`w-full flex mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        {/* (내 메시지) 시간 → 말풍선 */}
                                        {isMe && (
                                            <span className="text-[10px] text-gray-500 mr-2 self-end">
                  {timeStr}
                </span>
                                        )}

                                        <div
                                            className={`
                  max-w-[80%] px-4 py-2 rounded-xl whitespace-pre-wrap
                  ${isMe
                                                ? 'bg-yellow-200 text-black rounded-bl-none'
                                                : 'bg-gray-100  text-gray-900 rounded-br-none'}
                `}
                                        >
                                            {/* 발신자 이름 */}
                                            <p className={`text-[11px] font-semibold mb-1 ${isMe ? 'text-right' : 'text-left'}`}>
                                                {who}
                                            </p>

                                            {/* 본문 */}
                                                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                                        </div>

                                        {/* (상대 메시지) 말풍선 → 시간 */}
                                        {!isMe && (
                                            <span className="text-[10px] text-gray-500 ml-2 self-end">
                  {timeStr}
                </span>
                                        )}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </CommonModal>
            )}


        </>
    );
};

export default ReportDetailModal;
