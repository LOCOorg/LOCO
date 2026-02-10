// QnaDetailModal.jsx
import { useState } from 'react';
import useAuthStore from '../../stores/authStore';
import { useUpdateQnA, useDeleteQnA, useAddQnAAnswer } from '../../hooks/queries/useQnAQueries.js';
import CommonModal from '../../common/CommonModal.jsx';

function QnaDetailModal({ qna, onClose }) {
    const { user } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false); // 관리자 답변 수정
    const [isEditingQuestion, setIsEditingQuestion] = useState(false); // 작성자 질문 수정
    const [answerText, setAnswerText] = useState(qna.qnaAnswer || '');
    const [editTitle, setEditTitle] = useState(qna.qnaTitle);
    const [editContents, setEditContents] = useState(qna.qnaContents);
    
    // const [loading, setLoading] = useState(false); // 훅의 isPending 사용
    const [error, setError] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // 삭제 모달 상태

    const updateQnAMutation = useUpdateQnA(); // 질문 수정용
    const addAnswerMutation = useAddQnAAnswer(); // 답변 작성용 (관리자 전용)
    const deleteQnAMutation = useDeleteQnA(); // 삭제 Mutation Hook

    const isAdmin = user?.role === 'admin' || user?.userLv >= 3; // 관리자 Lv 3 이상
    const isOwner = user && (
        String(user._id) === String(qna.userId) ||
        String(user._id) === String(qna.userId?._id)
    );
// QnA 내용 및 답변 표시 로직
    const shouldHideContent = qna.isAdminOnly && !isAdmin && !isOwner;
    const showNickname = !qna.isAnonymous || isAdmin || isOwner;


    const handleAnswerSubmit = () => {
        if (!answerText.trim()) {
            setError('답변 내용을 입력해주세요.');
            return;
        }
        setError('');

        addAnswerMutation.mutate(
            {
                id: qna._id,
                answer: answerText
            },
            {
                onSuccess: (updated) => {
                    // 로컬 UI 업데이트
                    qna.qnaAnswer = updated.qnaAnswer;
                    qna.qnaStatus = updated.qnaStatus;
                    qna.answerUserId = updated.answerUserId;
                    setIsEditing(false);
                },
                onError: (err) => {
                    setError(err.message || '답변 제출 실패');
                }
            }
        );
    };

    const handleQuestionSubmit = () => {
        if (!editTitle.trim() || !editContents.trim()) {
            setError('제목과 내용을 모두 입력해주세요.');
            return;
        }
        setError('');

        updateQnAMutation.mutate(
            {
                id: qna._id,
                updateData: {
                    qnaTitle: editTitle,
                    qnaContents: editContents
                }
            },
            {
                onSuccess: (updated) => {
                    qna.qnaTitle = updated.qnaTitle;
                    qna.qnaContents = updated.qnaContents;
                    setIsEditingQuestion(false);
                },
                onError: (err) => {
                    setError(err.message || '질문 수정 실패');
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

    const loading = updateQnAMutation.isPending || addAnswerMutation.isPending;

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
                {isEditingQuestion ? (
                    <input
                        className="w-full text-2xl font-semibold text-gray-800 mb-3 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="문의 제목을 입력하세요"
                    />
                ) : (
                    <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                        {shouldHideContent ? '비공개 게시글입니다.' : qna.qnaTitle}
                    </h2>
                )}
                
                <div className="flex text-sm text-gray-500 mb-5 space-x-6">
                    <div>
                        <span className="font-medium text-gray-700">작성자</span>:{' '}
                        {showNickname ? (qna.userId?.nickname || "알 수 없음") : '익명'}
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">답변자</span>:{' '}
                        {qna.answerUserId?.nickname || '-'}
                    </div>
                </div>

                {/* Question Content */}
                <div className="prose prose-sm max-w-full mb-6 text-gray-700">
                    {isEditingQuestion ? (
                        <textarea
                            className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                            value={editContents}
                            onChange={(e) => setEditContents(e.target.value)}
                            placeholder="문의 내용을 입력하세요"
                        />
                    ) : (
                        shouldHideContent ? '비공개 게시글입니다. 관리자만 내용을 볼 수 있습니다.' : qna.qnaContents
                    )}
                </div>

                {/* Existing Answer */}
                {qna.qnaAnswer && !isEditing && !isEditingQuestion && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-5 border border-gray-200">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">답변</h3>
                        <p className="text-gray-700">{shouldHideContent ? '비공개 답변입니다.' : qna.qnaAnswer}</p>
                    </div>
                )}

                {error && <p className="text-red-500 mb-4">{error}</p>}

                <div className="flex justify-end gap-3 mt-6">
                    {/* 질문 수정 버튼 (작성자 전용, 답변이 아직 달리지 않았을 때만 가능) */}
                    {isOwner && !isEditingQuestion && qna.qnaStatus !== '답변완료' && (
                        <button
                            onClick={() => setIsEditingQuestion(true)}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 transition"
                        >
                            질문 수정
                        </button>
                    )}

                    {/* 질문 수정 폼 완료 버튼 */}
                    {isEditingQuestion && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleQuestionSubmit}
                                disabled={loading}
                                className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
                            >
                                {updateQnAMutation.isPending ? '수정 중…' : '수정 완료'}
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditingQuestion(false);
                                    setEditTitle(qna.qnaTitle);
                                    setEditContents(qna.qnaContents);
                                }}
                                className="bg-gray-300 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-400 transition"
                            >
                                취소
                            </button>
                        </div>
                    )}

                    {/* 삭제 버튼 (작성자 또는 관리자) */}
                    {(isAdmin || isOwner) && !isEditing && !isEditingQuestion && (
                        <button
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-600 transition"
                        >
                            삭제
                        </button>
                    )}

                    {/* 답변 작성/수정 버튼 (관리자 Lv≥3 전용) */}
                    {user?.userLv >= 3 && (
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
