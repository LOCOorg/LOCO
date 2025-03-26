import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QnaDetailModal from './QnaDetailModal';
import { getQnaPageByStatus, deleteQna } from '../../api/qnaAPI.js';
import useAuthStore from '../../stores/authStore';
import CommonModal from '../../common/CommonModal.jsx';

function QnaListComponent() {
    // 현재 활성 탭: "답변대기" 또는 "답변완료"
    const [activeTab, setActiveTab] = useState("답변대기");

    // "답변대기" 상태 목록 및 페이징 상태
    const [waitingQnas, setWaitingQnas] = useState([]);
    const [waitingPagination, setWaitingPagination] = useState(null);
    const [waitingPage, setWaitingPage] = useState(1);

    // "답변완료" 상태 목록 및 페이징 상태
    const [answeredQnas, setAnsweredQnas] = useState([]);
    const [answeredPagination, setAnsweredPagination] = useState(null);
    const [answeredPage, setAnsweredPage] = useState(1);

    const [pageSize] = useState(5);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedQna, setSelectedQna] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // 삭제 확인 모달 상태
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    // "답변대기" 목록 데이터 불러오기
    useEffect(() => {
        const fetchWaitingQnas = async () => {
            setLoading(true);
            try {
                const data = await getQnaPageByStatus(waitingPage, pageSize, "답변대기");
                setWaitingQnas(data.dtoList);
                setWaitingPagination(data);
            } catch (err) {
                setError(err.message);
            }
            setLoading(false);
        };
        fetchWaitingQnas();
    }, [waitingPage, pageSize]);

    // "답변완료" 목록 데이터 불러오기
    useEffect(() => {
        const fetchAnsweredQnas = async () => {
            setLoading(true);
            try {
                const data = await getQnaPageByStatus(answeredPage, pageSize, "답변완료");
                setAnsweredQnas(data.dtoList);
                setAnsweredPagination(data);
            } catch (err) {
                setError(err.message);
            }
            setLoading(false);
        };
        fetchAnsweredQnas();
    }, [answeredPage, pageSize]);

    const handleQnaClick = (qna) => {
        setSelectedQna(qna);
        setShowModal(true);
    };

    // 모달을 닫을 때, 답변이 등록되어 상태가 "답변완료"라면 waitingQnas 상태를 로컬에서 직접 업데이트합니다.
    const handleCloseModal = () => {
        if (selectedQna && selectedQna.qnaStatus === "답변완료") {
            // 답변대기 목록에서 해당 QnA 항목 제거
            setWaitingQnas(prevWaiting => prevWaiting.filter(qna => qna._id !== selectedQna._id));
            // 답변완료 목록에 이미 존재하는지 확인 후 추가 또는 업데이트
            setAnsweredQnas(prevAnswered => {
                const exists = prevAnswered.some(qna => qna._id === selectedQna._id);
                if (exists) {
                    return prevAnswered.map(qna => qna._id === selectedQna._id ? selectedQna : qna);
                } else {
                    // 배열의 끝에 추가하여 순서대로 유지
                    return [...prevAnswered, selectedQna];
                }
            });
        }
        setSelectedQna(null);
        setShowModal(false);
    };



    // 삭제 요청 시 대상 ID 저장 후 모달 오픈
    const requestDelete = (id) => {
        setDeleteTargetId(id);
        setIsDeleteModalOpen(true);
    };

    // 삭제 확인 후 해당 목록만 갱신
    const confirmDelete = async () => {
        try {
            await deleteQna(deleteTargetId);
            if (activeTab === "답변대기") {
                const waitingData = await getQnaPageByStatus(waitingPage, pageSize, "답변대기");
                setWaitingQnas(waitingData.dtoList);
                setWaitingPagination(waitingData);
            } else {
                const answeredData = await getQnaPageByStatus(answeredPage, pageSize, "답변완료");
                setAnsweredQnas(answeredData.dtoList);
                setAnsweredPagination(answeredData);
            }
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

            {/* 탭 전환 버튼 */}
            <div className="flex space-x-4 mb-6">
                <button
                    onClick={() => setActiveTab("답변대기")}
                    className={`px-4 py-2 rounded transition ${activeTab === "답변대기" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                >
                    답변대기
                </button>
                <button
                    onClick={() => setActiveTab("답변완료")}
                    className={`px-4 py-2 rounded transition ${activeTab === "답변완료" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                >
                    답변완료
                </button>
            </div>

            {loading && <p>로딩 중...</p>}
            {error && <p className="text-red-500">에러: {error}</p>}

            {activeTab === "답변대기" && (
                <>
                    {waitingQnas.length > 0 ? (
                        <ul className="space-y-4">
                            {waitingQnas.map((qna) => (
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
                        <p className="text-gray-500">답변대기 문의가 없습니다.</p>
                    )}

                    {/* 답변대기 페이징 컨트롤 */}
                    {waitingPagination && (
                        <div className="mt-6 flex items-center justify-center space-x-2">
                            {waitingPagination.prev && (
                                <button
                                    onClick={() => setWaitingPage(waitingPagination.prevPage)}
                                    className="px-3 py-1 border rounded hover:bg-gray-200"
                                >
                                    이전
                                </button>
                            )}
                            {waitingPagination.pageNumList.map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setWaitingPage(page)}
                                    className={`px-3 py-1 border rounded hover:bg-gray-200 ${page === waitingPage ? 'bg-blue-500 text-white' : ''}`}
                                >
                                    {page}
                                </button>
                            ))}
                            {waitingPagination.next && (
                                <button
                                    onClick={() => setWaitingPage(waitingPagination.nextPage)}
                                    className="px-3 py-1 border rounded hover:bg-gray-200"
                                >
                                    다음
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}

            {activeTab === "답변완료" && (
                <>
                    {answeredQnas.length > 0 ? (
                        <ul className="space-y-4">
                            {answeredQnas.map((qna) => (
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
                        <p className="text-gray-500">답변완료 문의가 없습니다.</p>
                    )}

                    {/* 답변완료 페이징 컨트롤 */}
                    {answeredPagination && (
                        <div className="mt-6 flex items-center justify-center space-x-2">
                            {answeredPagination.prev && (
                                <button
                                    onClick={() => setAnsweredPage(answeredPagination.prevPage)}
                                    className="px-3 py-1 border rounded hover:bg-gray-200"
                                >
                                    이전
                                </button>
                            )}
                            {answeredPagination.pageNumList.map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setAnsweredPage(page)}
                                    className={`px-3 py-1 border rounded hover:bg-gray-200 ${page === answeredPage ? 'bg-blue-500 text-white' : ''}`}
                                >
                                    {page}
                                </button>
                            ))}
                            {answeredPagination.next && (
                                <button
                                    onClick={() => setAnsweredPage(answeredPagination.nextPage)}
                                    className="px-3 py-1 border rounded hover:bg-gray-200"
                                >
                                    다음
                                </button>
                            )}
                        </div>
                    )}
                </>
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
