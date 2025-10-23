import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQna } from '../../api/qnaAPI.js';
import useAuthStore from '../../stores/authStore';
// import { getUserInfo } from '../../api/userAPI';
import CommonModal from '../../common/CommonModal.jsx';

/**
 * QnaWriteComponent
 * - 로그인한 사용자의 정보를 반영하여 새로운 QnA 문의를 작성할 수 있는 페이지입니다.
 * - 로그인하지 않은 경우 에러 메시지를 표시합니다.
 * - 작성 버튼 클릭 시 CommonModal로 최종 작성 확인 후 QnA를 등록합니다.
 */
function QnaWriteComponent() {
    const [qnaData, setQnaData] = useState({
        qnaTitle: '',
        qnaContents: '',
        isAnonymous: false,
        isAdminOnly: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    // const [userData, setUserData] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

    // useEffect(() => {
    //     if (user && user._id) {
    //         getUserInfo(user._id)
    //             .then((data) => setUserData(data))
    //             .catch((err) => console.error(err));
    //     }
    // }, [user]);

    const handleChange = (e) => {
        const { name, type, value, checked } = e.target;
        setQnaData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const confirmSubmit = async () => {
        setLoading(true);
        setError('');
        if (!user) {
            setError('로그인 후 문의를 작성할 수 있습니다.');
            setLoading(false);
            setIsSubmitModalOpen(false);
            return;
        }
        try {
            await createQna({ ...qnaData, userId: user._id });
            setIsSubmitModalOpen(false);
            navigate('/qna');
        } catch (err) {
            setError(err.message || 'QnA 작성 실패');
        }
        setLoading(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-8">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
                    새로운 Q&A 문의 작성
                </h2>

                {error && (
                    <p className="text-red-600 bg-red-50 border border-red-200 rounded-md p-3 mb-6">
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                    <label>
                        <input
                            type="checkbox"
                            name="isAnonymous"
                            checked={qnaData.isAnonymous}
                            onChange={handleChange}
                        />
                        익명으로 작성
                    </label>
                    </div>
                    <label>
                        <input
                            type="checkbox"
                            name="isAdminOnly"
                            checked={qnaData.isAdminOnly}
                            onChange={handleChange}
                        />
                        비공개 작성
                    </label>
                    {/* 제목 */}
                    <div>
                        <label
                            htmlFor="qnaTitle"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            제목
                        </label>
                        <input
                            type="text"
                            id="qnaTitle"
                            name="qnaTitle"
                            value={qnaData.qnaTitle}
                            onChange={handleChange}
                            placeholder="문의 제목을 입력하세요"
                            required
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition"
                        />
                    </div>

                    {/* 내용 */}
                    <div>
                        <label
                            htmlFor="qnaContents"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            내용
                        </label>
                        <textarea
                            id="qnaContents"
                            name="qnaContents"
                            value={qnaData.qnaContents}
                            onChange={handleChange}
                            placeholder="문의 내용을 입력하세요"
                            rows={6}
                            required
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition"
                        />
                    </div>

                    {/* 버튼 그룹 */}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => navigate('/qna')}
                            className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`inline-flex items-center px-6 py-2 rounded-md text-white transition ${
                                loading
                                    ? 'bg-indigo-300 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700'
                            }`}
                        >
                            {loading ? '작성 중...' : '작성하기'}
                        </button>
                    </div>
                </form>
            </div>

            {/* 제출 확인 모달 */}
            {isSubmitModalOpen && (
                <CommonModal
                    isOpen={isSubmitModalOpen}
                    onClose={() => setIsSubmitModalOpen(false)}
                    title="작성 확인"
                    onConfirm={confirmSubmit}
                >
                    <p className="text-gray-800">이 문의를 작성하시겠습니까?</p>
                </CommonModal>
            )}
        </div>
    );
}

export default QnaWriteComponent;
