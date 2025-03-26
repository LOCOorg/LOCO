import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQna } from '../../api/qnaAPI.js';
import useAuthStore from '../../stores/authStore';
import { getUserInfo } from '../../api/userAPI';
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
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // 제출 확인 모달 상태
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

    useEffect(() => {
        if (user && user._id) {
            getUserInfo(user._id)
                .then((data) => setUserData(data))
                .catch((err) => console.error(err));
        }
    }, [user]);

    const handleChange = (e) => {
        setQnaData({
            ...qnaData,
            [e.target.name]: e.target.value,
        });
    };

    // 실제 제출 함수: CommonModal의 확인 버튼 클릭 시 호출됨
    const confirmSubmit = async () => {
        setLoading(true);
        setError('');
        if (!user) {
            setError('로그인 후 문의를 작성할 수 있습니다.');
            setLoading(false);
            setIsSubmitModalOpen(false);
            return;
        }
        const newQnaData = { ...qnaData, userId: user._id };
        try {
            await createQna(newQnaData);
            setIsSubmitModalOpen(false);
            navigate('/qna');
        } catch (err) {
            setError(err.message || 'QnA 작성 실패');
        }
        setLoading(false);
    };

    // 폼 제출 이벤트 핸들러: 바로 제출하지 않고 모달을 오픈
    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitModalOpen(true);
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">새로운 QnA 문의 작성</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="qnaTitle" className="block text-gray-700 font-medium mb-2">
                        제목
                    </label>
                    <input
                        type="text"
                        id="qnaTitle"
                        name="qnaTitle"
                        value={qnaData.qnaTitle}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="QnA 제목을 입력하세요"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="qnaContents" className="block text-gray-700 font-medium mb-2">
                        내용
                    </label>
                    <textarea
                        id="qnaContents"
                        name="qnaContents"
                        value={qnaData.qnaContents}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="QnA 내용을 입력하세요"
                        rows="5"
                        required
                    ></textarea>
                </div>
                <div className="flex space-x-4">
                    <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                        disabled={loading}
                    >
                        {loading ? '작성 중...' : '작성'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/qna')}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                    >
                        취소
                    </button>
                </div>
            </form>

            {isSubmitModalOpen && (
                <CommonModal
                    isOpen={isSubmitModalOpen}
                    onClose={() => setIsSubmitModalOpen(false)}
                    title="작성 확인"
                    onConfirm={confirmSubmit}
                >
                    이 문의를 작성하시겠습니까?
                </CommonModal>
            )}
        </div>
    );
}

export default QnaWriteComponent;
