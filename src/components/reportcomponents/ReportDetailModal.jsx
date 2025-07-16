import { useState, useEffect } from 'react';
import { replyToReport } from '../../api/reportAPI.js';
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

    const navigate = useNavigate();

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
                    <button
                        onClick={goTarget}
                        disabled={!localReport?.anchor}
                        className="
                            inline-flex items-center gap-2 px-6 py-3 rounded-xl
                            font-semibold text-sm text-white
                            bg-gradient-to-br from-indigo-500 to-violet-500
                            shadow-lg transition
                            hover:-translate-y-1 hover:shadow-xl
                            active:translate-y-0 active:shadow-lg
                            disabled:opacity-45 disabled:shadow-none disabled:cursor-not-allowed
                            focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100
                          "
                    >
                        <span className="text-lg -translate-y-px">📍</span>
                        대상 위치로 이동
                    </button>

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
        </>
    );
};

export default ReportDetailModal;
