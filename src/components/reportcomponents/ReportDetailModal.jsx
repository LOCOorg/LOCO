// ReportDetailModal.jsx
import { useState, useEffect } from 'react';
import { replyToReport } from '../../api/reportAPI.js';
import CommonModal from '../../common/CommonModal.jsx';
import useAuthStore from '../../stores/authStore.js';

const ReportDetailModal = ({ report, onClose, onUpdateReport }) => {
    const { user } = useAuthStore();
    const [replyContent, setReplyContent] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [localReport, setLocalReport] = useState(report);
    const [modalInfo, setModalInfo] = useState({ isOpen: false, title: '', message: '' });

    useEffect(() => {
        setLocalReport(report);
        setReplyContent(report?.reportAnswer || '');
    }, [report]);

    if (!localReport) return null;

    const handleReplySubmit = async () => {
        try {
            const updatedReport = await replyToReport(localReport._id, {
                reportAnswer: replyContent,
                adminId: user?._id,
            });
            setLocalReport(updatedReport);
            setIsEditing(false);
            setModalInfo({
                isOpen: true,
                title: '성공',
                message: '답변이 성공적으로 저장되었습니다.',
            });
            // 부모 컴포넌트에 업데이트된 report 정보를 전달
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
