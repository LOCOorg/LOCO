import { useState, useEffect } from 'react';
import { replyToReport, fetchSingleReportedMessage, fetchReportedMessagePlaintext, fetchReportById } from '../../api/reportAPI.js';
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

    // --- Plaintext Modal State ---
    const [showPlaintextModal, setShowPlaintextModal] = useState(false);
    const [viewMode, setViewMode] = useState('single'); // 'single' or 'all'
    const [singleMessageData, setSingleMessageData] = useState(null);
    const [allMessagesData, setAllMessagesData] = useState(null);
    const [totalReportedMessagesCount, setTotalReportedMessagesCount] = useState(0); // 추가된 상태

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
                    setModalInfo({ isOpen: true, title: '오류', message: `신고 정보를 불러오는 데 실패했습니다: ${err.message}` });
                });
        }
    }, [reportId]);

    const openPlaintextModal = async () => {
        if (!localReport?.anchor?.targetId) {
            setModalInfo({ isOpen: true, title: '오류', message: '신고 대상 메시지를 찾을 수 없습니다.' });
            return;
        }
        try {
            setViewMode('single'); // 항상 단일 보기로 시작
            const response = await fetchSingleReportedMessage(localReport.anchor.targetId);
            setSingleMessageData(response.reportedMessage);
            setTotalReportedMessagesCount(response.reportedMessage.totalReportedMessagesInRoom); // 상태 저장
            setShowPlaintextModal(true);
        } catch (err) {
            setModalInfo({ isOpen: true, title: '오류', message: err.message });
        }
    };

    const loadAllReportedMessages = async () => {
        try {
            const response = await fetchReportedMessagePlaintext(reportId);
            setAllMessagesData(response);
            setViewMode('all'); // 전체 보기로 전환
        } catch (err) {
            setModalInfo({ isOpen: true, title: '오류', message: err.message });
        }
    };

    const handleClosePlaintextModal = () => {
        setShowPlaintextModal(false);
        setSingleMessageData(null);
        setAllMessagesData(null);
        setTotalReportedMessagesCount(0); // 상태 초기화
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
            setModalInfo({ isOpen: true, title: '성공', message: '답변과 제재 내용이 성공적으로 저장되었습니다.' });
            if (onUpdateReport) {
                onUpdateReport(updatedReport);
            }
        } catch (error) {
            setModalInfo({ isOpen: true, title: '오류 발생', message: error.message });
        }
    };

    const closeModal = () => setModalInfo(prev => ({ ...prev, isOpen: false }));

    return (
        <>
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                    <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold">×</button>
                    <h2 className="text-2xl font-bold mb-4">신고 상세 보기</h2>
                    <div className="mb-2"><span className="font-semibold">신고 제목:</span> {localReport.reportTitle}</div>
                    <div className="mb-2"><span className="font-semibold">신고 구역:</span> {localReport.reportArea}</div>
                    <div className="mb-2"><span className="font-semibold">신고 카테고리:</span> {localReport.reportCategory}</div>
                    <div className="mb-2"><span className="font-semibold">신고 내용:</span> {localReport.reportContants}</div>
                    <div className="mb-2"><span className="font-semibold">신고일:</span> {new Date(localReport.reportDate).toLocaleString()}</div>
                    <div className="mb-2"><span className="font-semibold">신고자:</span> {localReport.reportErId?.nickname || localReport.reportErId}</div>
                    <div className="mb-2"><span className="font-semibold">가해자:</span> {localReport.offenderId?.nickname || localReport.offenderId}</div>
                    {localReport.adminId?.nickname && <div className="mb-2"><span className="font-semibold">처리 관리자:</span> {localReport.adminId.nickname}</div>}
                    {localReport.stopDetail && <div className="mb-2"><span className="font-semibold">제재 내용:</span> {localReport.stopDetail}</div>}
                    {localReport.stopDate && <div className="mb-2"><span className="font-semibold">정지 시작일:</span> {new Date(localReport.stopDate).toLocaleString()}</div>}
                    {localReport.durUntil && <div className="mb-2"><span className="font-semibold">정지 해제일:</span> {new Date(localReport.durUntil).toLocaleString()}</div>}

                    {localReport.anchor?.type === 'chat' && (
                        <div className="flex gap-3 mb-4">
                            {user && user.userLv >= 2 && (
                                <button onClick={openPlaintextModal} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-pink-500 shadow-md ring-1 ring-inset ring-white/20 transition hover:brightness-110 hover:shadow-lg active:scale-95">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    신고 내용 보기
                                </button>
                            )}
                        </div>
                    )}

                    {localReport.anchor?.type !== 'chat' && localReport.reportArea !== '프로필' && (
                        <button onClick={goTarget} disabled={!localReport?.anchor} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl mb-4 font-semibold text-sm text-white bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg transition hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:shadow-lg disabled:opacity-45 disabled:shadow-none disabled:cursor-not-allowed">
                            <span className="text-lg -translate-y-px">📍</span>
                            대상 위치로 이동
                        </button>
                    )}

                    {localReport.reportAnswer && !isEditing && (
                        <div className="mb-4 p-3 bg-gray-100 rounded">
                            <span className="font-semibold text-green-700">답변 내용:</span>
                            <p className="mt-1">{localReport.reportAnswer}</p>
                            <button onClick={() => setIsEditing(true)} className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded">답변 수정</button>
                        </div>
                    )}

                    {(!localReport.reportAnswer || isEditing) && (
                        <div className="mt-4">
                            <textarea placeholder="답변 내용을 입력하세요" value={replyContent} onChange={(e) => setReplyContent(e.target.value)} className="w-full border rounded p-2 mb-4" rows={4} />
                            <div className="mt-2 mb-4">
                                <label className="block mb-1 font-semibold">정지 기간 (일):</label>
                                <input type="number" value={suspensionDays} onChange={(e) => setSuspensionDays(e.target.value)} className="w-full border rounded p-2" placeholder="예: 7 (정지 기간이 없으면 0 또는 비워두세요)" />
                            </div>
                            <div className="mt-2 mb-4">
                                <label className="block mb-1 font-semibold">제재 내용:</label>
                                <select value={selectedStopDetail} onChange={(e) => setSelectedStopDetail(e.target.value)} className="w-full border rounded p-2">
                                    <option value="활성">활성</option>
                                    <option value="영구정지">영구정지</option>
                                    <option value="일시정지">일시정지</option>
                                    <option value="경고">경고</option>
                                </select>
                            </div>
                            <button onClick={handleReplySubmit} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded">{localReport.reportAnswer ? '답변 수정 완료' : '답변 등록'}</button>
                        </div>
                    )}
                </div>
            </div>

            <CommonModal isOpen={modalInfo.isOpen} title={modalInfo.title} onClose={closeModal} onConfirm={closeModal} showCancel={false}>
                <p>{modalInfo.message}</p>
            </CommonModal>

            {/* Plaintext Modal with view mode logic */}
            {showPlaintextModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
                        <div className="px-6 py-4 border-b flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-800">
                                {viewMode === 'single' ? `🔒 신고된 메시지 (총 신고된 메시지 ${totalReportedMessagesCount}건) ` : `🔒 전체 신고된 메시지 (${allMessagesData?.roomInfo?.totalReportedMessages || 0}건)`}
                            </h3>
                            <div>
                                {viewMode === 'single' && totalReportedMessagesCount > 1 && (
                                    <button onClick={loadAllReportedMessages} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm">
                                        전체 보기
                                    </button>
                                )}
                                <button onClick={handleClosePlaintextModal} className="ml-4 text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                            {viewMode === 'single' && singleMessageData && (
                                <div className="p-4 rounded-lg border-2 bg-red-50 border-red-300">
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                                        <span className="font-semibold text-gray-800">{singleMessageData.sender?.nickname || '알 수 없음'}</span>
                                        {singleMessageData.reportersCount > 1 && <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">신고 {singleMessageData.reportersCount}건</span>}
                                        <span className="ml-auto text-xs text-gray-500 font-mono">{new Date(singleMessageData.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="whitespace-pre-wrap break-words text-gray-900">{singleMessageData.plaintextContent}</p>
                                </div>
                            )}

                            {viewMode === 'all' && allMessagesData?.allReportedMessages?.map((msg) => (
                                <div key={msg.messageId} className={`p-4 rounded-lg border-2 mb-3 ${msg.isCurrentReport ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}>
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                                        <span className="font-semibold text-gray-800">{msg.sender?.nickname || '알 수 없음'}</span>
                                        {msg.isCurrentReport && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">현재 신고</span>}
                                        {msg.reportersCount > 1 && <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">신고 {msg.reportersCount}건</span>}
                                        <span className="ml-auto text-xs text-gray-500 font-mono">{new Date(msg.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="whitespace-pre-wrap break-words text-gray-900">{msg.plaintextContent}</p>
                                </div>
                            ))}
                        </div>

                        <div className="px-6 py-4 border-t bg-gray-50">
                            <button onClick={handleClosePlaintextModal} className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-semibold transition">닫기</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ReportDetailModal;

