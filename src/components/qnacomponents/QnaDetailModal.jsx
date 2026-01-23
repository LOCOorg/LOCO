// QnaDetailModal.jsx
import { useState } from 'react';
import useAuthStore from '../../stores/authStore';
// import { updateQna } from '../../api/qnaAPI'; // 직접 호출 제거
import { useUpdateQnA, useDeleteQnA } from '../../hooks/queries/useQnAQueries.js'; // 훅 추가
import CommonModal from '../../common/CommonModal.jsx'; // 모달 추가

function QnaDetailModal({ qna, onClose }) {
    const { user } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [answerText, setAnswerText] = useState(qna.qnaAnswer || '');
    // const [loading, setLoading] = useState(false); // 훅의 isPending 사용
    const [error, setError] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // 삭제 모달 상태

    const updateQnAMutation = useUpdateQnA(); // Mutation Hook
    const deleteQnAMutation = useDeleteQnA(); // 삭제 Mutation Hook

    const isAdmin = user?.role === 'admin' || user?.userLv >= 2;
    const isOwner = user && (
        String(user._id) === String(qna.userId) ||
        String(user._id) === String(qna.userId?._id)
    );
// QnA 내용 및 답변 표시 로직
    const shouldHideContent = qna.isAdminOnly && !isAdmin && !isOwner;
    const showNickname = !qna.isAnonymous || isAdmin || isOwner;


    const handleAnswerSubmit = () => {
        setError('');
        
        updateQnAMutation.mutate(
            {
                id: qna._id,
                updateData: {
                    qnaAnswer: answerText,
                    answerUserId: user._id,
                    qnaStatus: 'Answered',
                }
            },
            {
                onSuccess: (updated) => {
                    // 로컬 UI 업데이트 (캐시 무효화는 훅 내부에서 처리됨)
                    // 하지만 모달이 열려있는 상태이므로 즉시 반영을 위해 로컬 객체도 수정
                    qna.qnaAnswer = updated.qnaAnswer;
                    qna.qnaStatus = updated.qnaStatus;
                    setIsEditing(false);
                },
                onError: (err) => {
                    setError(err.message || '답변 제출 실패');
                }
            }
        );
    };

    const handleDelete = () => {
        deleteQnAMutation.mutate(qna._id, {
            onSuccess: () => {
                onClose(); // 삭제 성공 시 모달 닫기
            },
            onError: (err) => {
                setError(err.message || '삭제 실패');
                setIsDeleteModalOpen(false);
            }
        });
    };

    const loading = updateQnAMutation.isPending;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6 relative transform transition-transform duration-300 ease-out scale-95 animate-fade-in">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                >
                    <svg
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>

                {/* Header */}
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                    {shouldHideContent ? '비공개 게시글입니다.' : qna.qnaTitle}
                </h2>
                <div className="flex text-sm text-gray-500 mb-5 space-x-6">
                    <div>
                        <span className="font-medium text-gray-700">작성자</span>:{' '}
                        {showNickname ? (qna.userNickname || qna.userId?.nickname || "알 수 없음") : '익명'}
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">답변자</span>:{' '}
                        {qna.answerUserNickname || '-'}
                    </div>
                </div>

                {/* Question Content */}
                <div className="prose prose-sm max-w-full mb-6 text-gray-700">
                    {shouldHideContent ? '비공개 게시글입니다. 관리자만 내용을 볼 수 있습니다.' : qna.qnaContents}
                </div>

                {/* Existing Answer */}
                {qna.qnaAnswer && !isEditing && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-5 border border-gray-200">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">답변</h3>
                        <p className="text-gray-700">{shouldHideContent ? '비공개 답변입니다.' : qna.qnaAnswer}</p>
                    </div>
                )}

                {error && <p className="text-red-500 mb-4">{error}</p>}

                <div className="flex justify-end gap-3 mt-6">
                    {/* 삭제 버튼 (작성자 또는 관리자) */}
                    {(isAdmin || isOwner) && !isEditing && (
                        <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-600 transition"
                        >
                            삭제
                        </button>
                    )}

                    {/* 답변 작성/수정 버튼 */}
                    {user?.userLv >= 2 && (
                        <>
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-indigo-600 text-white px-5 py-2 rounded-lg shadow hover:bg-indigo-700 transition"
                                >
                                    {qna.qnaAnswer ? '답변 수정' : '답변 달기'}
                                </button>
                            ) : null}
                        </>
                    )}
                </div>

                {/* 답변 수정 폼 */}
                {isEditing && (
                    <div className="space-y-4 mt-4 border-t pt-4">
                        <textarea
                            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            placeholder="여기에 답변을 입력하세요"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleAnswerSubmit}
                                disabled={loading}
                                className="bg-blue-500 text-white px-5 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                            >
                                {loading ? '제출 중…' : '제출'}
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setAnswerText(qna.qnaAnswer || '');
                                }}
                                disabled={loading}
                                className="bg-gray-300 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-400 transition disabled:opacity-50"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 삭제 확인 모달 */}
            {isDeleteModalOpen && (
                <CommonModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    title="삭제 확인"
                    onConfirm={handleDelete}
                >
                    정말로 이 문의를 삭제하시겠습니까?
                </CommonModal>
            )}
        </div>
    );
}

export default QnaDetailModal;
