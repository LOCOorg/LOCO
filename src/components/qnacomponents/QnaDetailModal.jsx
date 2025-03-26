// QnaDetailModal.jsx
import React, { useState } from 'react';
import useAuthStore from '../../stores/authStore';
import { updateQna } from '../../api/qnaAPI';

/**
 * QnaDetailModal 컴포넌트
 * - 선택된 QnA의 상세 내용을 모달 창으로 표시합니다.
 * - onClose 함수를 통해 모달을 닫을 수 있습니다.
 * - 로그인한 사용자의 userLv가 2 이상인 경우 답변 작성(수정) 폼을 노출합니다.
 *
 * @param {Object} props - 컴포넌트 props
 * @param {Object} props.qna - 선택된 QnA 객체 (qnaTitle, qnaContents, qnaAnswer, qnaStatus, userId 등)
 * @param {Function} props.onClose - 모달 닫기 핸들러 함수
 */
function QnaDetailModal({ qna, onClose }) {
    // 로그인한 사용자 정보를 authStore에서 가져옴
    const { user } = useAuthStore();
    // 답변 작성 폼의 노출 여부와 입력값, 로딩/에러 상태 관리
    const [isEditing, setIsEditing] = useState(false);
    const [answerText, setAnswerText] = useState(qna.qnaAnswer || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    /**
     * 답변 작성(또는 수정) 폼 제출 핸들러
     * - updateQna API를 호출하여 qnaAnswer, answerUserId, qnaStatus를 업데이트합니다.
     */
    const handleAnswerSubmit = async () => {
        setLoading(true);
        setError("");
        try {
            const updatedQna = await updateQna(qna._id, {
                qnaAnswer: answerText,
                answerUserId: user._id,
                qnaStatus: "Answered"
            });
            // 업데이트된 답변 내용을 반영
            qna.qnaAnswer = updatedQna.qnaAnswer;
            qna.qnaStatus = updatedQna.qnaStatus;
            setIsEditing(false);
        } catch (err) {
            setError(err.message || "답변 제출 실패");
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-md w-11/12 max-w-lg relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                >
                    X
                </button>
                <h2 className="text-2xl font-bold mb-2">{qna.qnaTitle}</h2>
                {/* 작성자 정보 표시 */}
                <p className="text-sm text-gray-500 mb-4">
                    작성자: {qna.userId?.nickname || '알 수 없음'}
                </p>
                <p className="mb-4">{qna.qnaContents}</p>
                {/* 답변이 이미 있는 경우에는 답변 내용을 표시 */}
                {qna.qnaAnswer && !isEditing && (
                    <div className="mb-4">
                        <h3 className="text-xl font-semibold">답변</h3>
                        <p className="text-gray-700">{qna.qnaAnswer}</p>
                    </div>
                )}
                {error && <p className="text-red-500">{error}</p>}
                <p>
                    <span className="font-medium">상태: </span>{qna.qnaStatus}
                </p>
                {/* 로그인 사용자의 userLv가 2 이상인 경우 답변 작성(또는 수정) 버튼 노출 */}
                {user && user.userLv >= 2 && (
                    <div className="mt-4">
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                            >
                                {qna.qnaAnswer ? '답변 수정' : '답변 달기'}
                            </button>
                        )}
                        {isEditing && (
                            <div className="mt-2">
                                <textarea
                                    className="w-full p-2 border border-gray-300 rounded"
                                    rows="4"
                                    value={answerText}
                                    onChange={(e) => setAnswerText(e.target.value)}
                                    placeholder="여기에 답변을 입력하세요"
                                ></textarea>
                                <div className="mt-2 flex space-x-4">
                                    <button
                                        onClick={handleAnswerSubmit}
                                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                                        disabled={loading}
                                    >
                                        {loading ? '제출 중...' : '제출'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setAnswerText(qna.qnaAnswer || "");
                                        }}
                                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                                        disabled={loading}
                                    >
                                        취소
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default QnaDetailModal;
