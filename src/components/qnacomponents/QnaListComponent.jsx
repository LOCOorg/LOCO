import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QnaDetailModal from './QnaDetailModal';
import { getQnas, deleteQna } from '../../api/qnaAPI.js';
import useAuthStore from '../../stores/authStore';
import CommonModal from '../../common/CommonModal.jsx';
/**
 * QnaListComponent
 * - 백엔드 API에서 QnA 목록을 불러와 리스트로 출력합니다.
 * - 항목 클릭 시 상세 정보를 모달로 표시합니다.
 * - "새 QnA 문의" 버튼을 클릭하면 작성 페이지로 이동합니다.
 * - 답변 상태(답변대기 / 답변완료)에 따라 토글 버튼으로 목록을 필터링합니다.
 * - 삭제 버튼은 로그인한 사용자의 userLv가 2 이상이거나 작성자인 경우에만 표시되며,
 *   삭제 시 CommonModal을 사용하여 확인합니다.
 */
function QnaListComponent() {
    const [qnas, setQnas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedQna, setSelectedQna] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState("답변대기");
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // 삭제 확인 모달 상태
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    useEffect(() => {
        const fetchQnas = async () => {
            setLoading(true);
            try {
                const data = await getQnas();
                setQnas(data);
            } catch (err) {
                setError(err.message);
            }
            setLoading(false);
        };

        fetchQnas();
    }, []);

    const handleQnaClick = (qna) => {
        setSelectedQna(qna);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setSelectedQna(null);
        setShowModal(false);
    };

    // 삭제 요청 시 대상 ID를 저장하고 모달을 엽니다.
    const requestDelete = (id) => {
        setDeleteTargetId(id);
        setIsDeleteModalOpen(true);
    };

    // 삭제 확인 모달에서 "확인" 클릭 시 실제 삭제 수행
    const confirmDelete = async () => {
        try {
            await deleteQna(deleteTargetId);
            setQnas(qnas.filter((qna) => qna._id !== deleteTargetId));
            setIsDeleteModalOpen(false);
            setDeleteTargetId(null);
        } catch (err) {
            setError(err.message);
            setIsDeleteModalOpen(false);
            setDeleteTargetId(null);
        }
    };

    const handleNewQna = () => {
        navigate('/qna/new');
    };

    const filteredQnas = qnas.filter((qna) => qna.qnaStatus === filterStatus);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">QnA 목록</h2>
                <button
                    onClick={handleNewQna}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                >
                    새 QnA 문의
                </button>
            </div>
            {loading && <p>로딩 중...</p>}
            {error && <p className="text-red-500">에러: {error}</p>}

            {/* 토글 버튼: 답변대기 / 답변완료 */}
            <div className="flex space-x-4 mb-4">
                <button
                    onClick={() => setFilterStatus("답변대기")}
                    className={`px-4 py-2 rounded transition ${
                        filterStatus === "답변대기"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                    답변대기
                </button>
                <button
                    onClick={() => setFilterStatus("답변완료")}
                    className={`px-4 py-2 rounded transition ${
                        filterStatus === "답변완료"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                >
                    답변완료
                </button>
            </div>

            {filteredQnas.length > 0 ? (
                <ul className="space-y-4">
                    {filteredQnas.map((qna) => (
                        <li
                            key={qna._id}
                            className="p-4 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition"
                            onClick={() => handleQnaClick(qna)}
                        >
                            <h3 className="text-xl font-semibold">{qna.qnaTitle}</h3>
                            <p className="text-sm text-gray-500">
                                작성자: {qna.userId?.nickname || '알 수 없음'}
                            </p>
                            <p className="text-gray-600">{qna.qnaContents.substring(0, 100)}...</p>
                            <div className="mt-2 flex items-center justify-between">
                                <p>
                                    <span className="font-medium">상태: </span>
                                    {qna.qnaStatus}
                                </p>
                                {user && (user.userLv >= 2 || user._id === (qna.userId?._id || qna.userId)) && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            requestDelete(qna._id);
                                        }}
                                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                                    >
                                        삭제
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">
                    {filterStatus === "답변대기"
                        ? "답변대기 문의가 없습니다."
                        : "답변완료 문의가 없습니다."}
                </p>
            )}

            {showModal && selectedQna && (
                <QnaDetailModal qna={selectedQna} onClose={handleCloseModal} />
            )}

            {isDeleteModalOpen && (
                <CommonModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    title="삭제 확인"
                    onConfirm={confirmDelete}
                >
                    정말로 이 문의를 삭제하시겠습니까?
                </CommonModal>
            )}
        </div>
    );
}

export default QnaListComponent;
