import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QnaDetailModal from './QnaDetailModal';
//import { getQnaPageByStatus, deleteQna } from '../../api/qnaAPI.js';
import { useQnAList, useDeleteQnA } from '../../hooks/queries/useQnAQueries';
import { useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../stores/authStore';
import CommonModal from '../../common/CommonModal.jsx';
import {toKST} from "../../utils/dateUtils.js";

function QnaListComponent() {
    // 현재 활성 탭: "답변대기" 또는 "답변완료"
    const [activeTab, setActiveTab] = useState("답변대기");

    // 검색어 상태
    const [searchKeyword, setSearchKeyword] = useState("");
    const [inputKeyword, setInputKeyword] = useState("");
    const [searchType, setSearchType]    = useState('both');

    // "답변대기" 상태 목록 및 페이징 상태
    // const [waitingQnas, setWaitingQnas] = useState([]);
    // const [waitingPagination, setWaitingPagination] = useState(null);
    const [waitingPage, setWaitingPage] = useState(1);

    // "답변완료" 상태 목록 및 페이징 상태
    // const [answeredQnas, setAnsweredQnas] = useState([]);
    // const [answeredPagination, setAnsweredPagination] = useState(null);
    const [answeredPage, setAnsweredPage] = useState(1);

    const [pageSize] = useState(6);

    // ✅ "답변대기" Query Hook
    const {
        data: waitingData,
        isLoading: waitingLoading,
        error: waitingError,
    } = useQnAList({
        status: '답변대기',
        page: waitingPage,
        size: pageSize,
        keyword: searchKeyword,
        searchType: searchType,
    });

    const waitingQnas = waitingData?.qnas || [];
    const waitingPagination = waitingData?.pagination;

    // ✅ "답변완료" Query Hook
    const {
        data: answeredData,
        isLoading: answeredLoading,
        error: answeredError,
    } = useQnAList({
        status: '답변완료',
        page: answeredPage,
        size: pageSize,
        keyword: searchKeyword,
        searchType: searchType,
    });

    const answeredQnas = answeredData?.qnas || [];
    const answeredPagination = answeredData?.pagination;


    const [selectedQna, setSelectedQna] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const navigate = useNavigate();
    const { user } = useAuthStore();

    // 삭제 확인 모달 상태
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    // ✅ 삭제 Mutation
    const deleteMutation = useDeleteQnA();

    //
    const queryClient = useQueryClient();

    // QnA 필터링(관리자만 볼 수 있음 처리)
    const isAdmin = user?.role === 'admin' || user?.userLv >= 2; // admin 판정
    const isOwner = (qna, user) =>
        user &&
        (String(user._id) === String(qna.userId) ||
            String(user._id) === String(qna.userId?._id));





    const handleQnaClick = (qna) => {
        setSelectedQna(qna);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        if (selectedQna && selectedQna.qnaStatus === "답변완료") {
            // ✅ 캐시 무효화 → 양쪽 목록 자동 리프레시
            queryClient.invalidateQueries({ queryKey: ['qna', 'list'] });
        }
        setSelectedQna(null);
        setShowModal(false);
    };

    const requestDelete = (id) => {
        setDeleteTargetId(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete =  () => {
        deleteMutation.mutate(deleteTargetId, {
            onSuccess: () => {
                // ✅ React Query가 자동으로 캐시 무효화
                // ✅ 목록 자동 리로드
                setIsDeleteModalOpen(false);
                setDeleteTargetId(null);
            },
            onError: (err) => {
                console.error('삭제 실패:', err);
                setIsDeleteModalOpen(false);
                setDeleteTargetId(null);
            },
        });
    };

    const handleNewQna = () => {
        navigate('/qna/new');
    };

    // 검색 실행 핸들러
    const handleSearch = () => {
               // 페이지 초기화
            setWaitingPage(1);
            setAnsweredPage(1);
            setSearchKeyword(inputKeyword);
    };

       // 엔터키 눌렀을 때 검색 실행
           const handleSearchKeyDown = (e) => {
               if (e.key === 'Enter') {
                       handleSearch();
                   }
           };

    return (
        <div className="bg-gray-50 min-h-screen p-6">
            {/* 헤더 */}
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-extrabold text-gray-900">QnA 목록</h2>
                {user?.userLv === 1 && (
                    <button
                        onClick={handleNewQna}
                        className="px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-full shadow-lg hover:from-blue-600 hover:to-indigo-700 transition"
                    >
                        새 QnA 문의
                    </button>
                )}
            </div>

            {/* 탭 */}
            <div role="tablist" className="flex justify-center space-x-6 mb-8">
                {["답변대기", "답변완료"].map((tab) => (
                    <button
                        key={tab}
                        role="tab"
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 font-medium rounded-full transition 
            ${
                            activeTab === tab
                                ? "bg-blue-600 text-white shadow"
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* 검색 & 필터 */}
            <div className="flex flex-col md:flex-row items-center gap-4 mb-8 justify-center">
                <div className="flex items-center bg-white border border-gray-200 rounded-lg shadow px-4 py-2 w-full md:w-1/2">
                    <select
                        value={searchType}
                        onChange={e => setSearchType(e.target.value)}
                        className="bg-transparent mr-2 text-gray-600 outline-none"
                    >
                        <option value="title">제목</option>
                        <option value="contents">내용</option>
                        <option value="both">제목+내용</option>
                        <option value="author">작성자</option>
                        <option value="answerer">답변자</option>
                    </select>
                    <input
                        type="text"
                        placeholder={
                            searchType === "title" ? "제목 검색"
                                : searchType === "contents" ? "내용 검색"
                                    : searchType === "author" ? "작성자 검색"
                                        : searchType === "answerer" ? "답변자 검색"
                                            : "제목+내용 검색"
                        }
                        value={inputKeyword}
                        onChange={e => setInputKeyword(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        className="flex-grow px-3 py-2 placeholder-gray-400 focus:outline-none"
                    />
                    {inputKeyword && (
                        <button onClick={() => setInputKeyword("")} className="text-gray-400 hover:text-gray-600">
                            ✕
                        </button>
                    )}
                </div>
                <button
                    onClick={handleSearch}
                    className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition"
                >
                    검색
                </button>
            </div>

            {/* 콘텐츠 */}
            {(waitingLoading || answeredLoading) && (
                <div className="flex justify-center items-center py-20">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-600">로딩 중...</p>
                    </div>
                </div>
            )}
            {(waitingError || answeredError) && (
                <p className="text-center text-red-600">
                    에러: {waitingError?.message || answeredError?.message}
                </p>
            )}

            {activeTab === "답변대기" && (
                <>
                    {waitingQnas.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {waitingQnas.map(qna => {
                                const hide = qna.isAdminOnly && !isAdmin && !isOwner(qna, user);
                                const showNickname = !qna.isAnonymous || isAdmin || isOwner(qna, user);
                                return (
                                <div
                                key={qna._id}
                            onClick={() => handleQnaClick(qna)}
                            className="bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-xl transform hover:scale-105 transition p-6 cursor-pointer"
                        >
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">{hide ? '비공개 게시글입니다.' : qna.qnaTitle}</h3>
                            <p className="text-sm text-gray-500 mb-4">작성자: {showNickname ? (qna.userNickname || qna.userId?.nickname || "알 수 없음") : '익명'}</p>
                            <p className="text-gray-600 leading-relaxed mb-6">
                                {hide ? <i>비공개</i> : qna.qnaContents.substring(0, 100) + '…'}
                            </p>
                            <p className="text-sm text-gray-500 mb-4">작성일: {toKST(qna.createdAt)}</p>
                            <div className="flex justify-between items-center text-sm">
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                        {qna.qnaStatus}
                                      </span>
                                {qna.isAdminOnly && <span style={{ color: 'gray', fontWeight: 'bold' }}>비공개</span>}
                                {(user?.userLv >= 2 || user?._id === qna.userId?._id) && (
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            requestDelete(qna._id);
                                        }}
                                        className="px-3 py-1 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                                    >
                                        삭제
                                    </button>
                                )}
                            </div>
                        </div>
                                )})}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500">검색 조건에 맞는 문의가 없습니다.</p>
                    )}

                    {/* 페이지네이션 */}
                    {waitingPagination && (
                        <div className="mt-8 flex justify-center items-center space-x-2">
                            {waitingPagination.prev && (
                                <button
                                    onClick={() => setWaitingPage(waitingPagination.prevPage)}
                                    className="px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-100"
                                >
                                    이전
                                </button>
                            )}
                            {waitingPagination.pageNumList.map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setWaitingPage(page)}
                                    className={`px-3 py-1 border rounded-full transition 
                  ${
                                        page === waitingPage
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "border-gray-300 hover:bg-gray-100"
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                            {waitingPagination.next && (
                                <button
                                    onClick={() => setWaitingPage(waitingPagination.nextPage)}
                                    className="px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-100"
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {answeredQnas.map(qna => {
                                const hide = qna.isAdminOnly && !isAdmin && !isOwner(qna, user);
                                const showNickname = !qna.isAnonymous || isAdmin || isOwner(qna, user);
                                return(
                                <div
                                key={qna._id}
                            onClick={() => handleQnaClick(qna)}
                            className="bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-xl transform hover:scale-105 transition p-6 cursor-pointer"
                        >
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">{hide ? '비공개 게시글입니다.' : qna.qnaTitle}</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                작성자: {showNickname ? (qna.userNickname || qna.userId?.nickname || "알 수 없음") : '익명'}
                                <span className="ml-4">답변자: {qna.answerUserNickname || "알 수 없음"}</span>
                            </p>
                            <p className="text-gray-600 leading-relaxed mb-6">
                                {hide ? <i>비공개</i> : qna.qnaContents.substring(0, 100) + '…'}
                            </p>
                            <p className="text-sm text-gray-500 mb-4">작성일: {toKST(qna.createdAt)}</p>
                            <p className="text-sm text-gray-500 mb-4">답변일: {toKST(qna.updatedAt)}</p>
                            <div className="flex justify-between items-center text-sm">
                                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                        {qna.qnaStatus}
                                      </span>
                                {qna.isAdminOnly && <span style={{ color: 'gray', fontWeight: 'bold' }}>비공개</span>}
                                {(user?.userLv >= 2 || user?._id === qna.userId?._id) && (
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            requestDelete(qna._id);
                                        }}
                                        className="px-3 py-1 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
                                    >
                                        삭제
                                    </button>
                                )}
                            </div>
                        </div>
                                )})}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500">검색 조건에 맞는 문의가 없습니다.</p>
                    )}

                    {answeredPagination && (
                        <div className="mt-8 flex justify-center items-center space-x-2">
                            {answeredPagination.prev && (
                                <button
                                    onClick={() => setAnsweredPage(answeredPagination.prevPage)}
                                    className="px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-100"
                                >
                                    이전
                                </button>
                            )}
                            {answeredPagination.pageNumList.map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setAnsweredPage(page)}
                                    className={`px-3 py-1 border rounded-full transition 
                  ${
                                        page === answeredPage
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "border-gray-300 hover:bg-gray-100"
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}
                            {answeredPagination.next && (
                                <button
                                    onClick={() => setAnsweredPage(answeredPagination.nextPage)}
                                    className="px-3 py-1 border border-gray-300 rounded-full hover:bg-gray-100"
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
