import { useState, useEffect } from 'react';
import { getQnaPageByStatus } from '../../api/qnaAPI.js';

const QnaHistoryComponent = ({ profile }) => {
    const [qnaHistory, setQnaHistory] = useState([]);
    const [activeQnaId, setActiveQnaId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const pageSize = 6;

    const fetchQnaHistory = async (page) => {
        if (!profile?._id || loading) return;

        try {
            setLoading(true);
            const waitingRes = await getQnaPageByStatus(page, pageSize, '답변대기', profile.nickname, 'author');
            const answeredRes = await getQnaPageByStatus(page, pageSize, '답변완료', profile.nickname, 'author');

            const newQnas = [...(waitingRes.dtoList || []), ...(answeredRes.dtoList || [])];
            const sortedNewQnas = newQnas.sort((a, b) => new Date(b.qnaRegdate) - new Date(a.qnaRegdate));

            if (page === 1) {
                setQnaHistory(sortedNewQnas);
            } else {
                setQnaHistory(prev => [...prev, ...sortedNewQnas]);
            }

            const totalCount = (waitingRes.totalCount || 0) + (answeredRes.totalCount || 0);
            setHasMore(qnaHistory.length + sortedNewQnas.length < totalCount);
        } catch (error) {
            console.error("QnA 내역을 불러오는데 실패했습니다.", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (profile?._id) {
            setCurrentPage(1);
            setQnaHistory([]);
            fetchQnaHistory(1);
        }
    }, [profile]);

    const handleLoadMore = () => {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        fetchQnaHistory(nextPage);
    };

    const handleToggle = (id) => {
        setActiveQnaId(prevId => prevId === id ? null : id);
    };

    return (
        <div className="mt-8 px-4">
            {/* 헤더 섹션 */}
            <div className="mb-8">
                <h3 className="text-3xl font-bold text-gray-800 mb-2">
                    본인 QnA 내역
                </h3>
                <p className="text-gray-500 text-sm">
                    등록하신 질문과 답변을 확인하세요
                </p>
            </div>

            {qnaHistory.length > 0 ? (
                <>
                    {/* 그리드 레이아웃 */}
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6 items-start">
                        {qnaHistory.map((qna) => {
                            const isActive = activeQnaId === qna._id;
                            const isAnswered = qna.qnaStatus === '답변완료';

                            return (
                                <div
                                    key={qna._id}
                                    className={`
                                        bg-white rounded-2xl shadow-md hover:shadow-xl 
                                        transition-all duration-300 ease-in-out 
                                        border border-gray-100 overflow-hidden
                                        ${isActive ? 'ring-2 ring-blue-400 shadow-2xl' : ''}
                                    `}
                                >
                                    {/* 카드 헤더 */}
                                    <button
                                        onClick={() => handleToggle(qna._id)}
                                        className="w-full text-left p-5 flex items-start justify-between gap-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-800 text-lg mb-2 line-clamp-2">
                                                {qna.qnaTitle}
                                            </h4>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`
                                                    px-3 py-1 rounded-full text-xs font-medium
                                                    ${isAnswered
                                                    ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                                                    : 'bg-gradient-to-r from-orange-400 to-amber-500 text-white'
                                                }
                                                `}>
                                                    {qna.qnaStatus}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(qna.qnaRegdate).toLocaleDateString('ko-KR', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`
                                            flex-shrink-0 w-8 h-8 flex items-center justify-center
                                            rounded-full bg-gradient-to-br from-blue-100 to-purple-100
                                            transform transition-all duration-300
                                            ${isActive ? 'rotate-180 bg-gradient-to-br from-blue-200 to-purple-200' : ''}
                                        `}>
                                            <svg
                                                className="w-4 h-4 text-gray-600"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </button>

                                    {/* 확장 콘텐츠 */}
                                    {isActive && (
                                        <div className="px-5 pb-5 pt-2 bg-gradient-to-b from-gray-50 to-white border-t border-gray-100 animate-fadeIn">
                                            <div className="space-y-4">
                                                <div className="bg-white rounded-xl p-4 border border-gray-100">
                                                    <div className="flex items-start gap-2 mb-2">
                                                        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">질문 내용</p>
                                                            <p className="text-gray-700 leading-relaxed text-sm">{qna.qnaContents}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={`
                                                    rounded-xl p-4 border
                                                    ${isAnswered
                                                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100'
                                                    : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
                                                }
                                                `}>
                                                    <div className="flex items-start gap-2">
                                                        <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isAnswered ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">답변</p>
                                                            <p className={`leading-relaxed text-sm ${isAnswered ? 'text-gray-700' : 'text-gray-500 italic'}`}>
                                                                {qna.qnaAnswer || '답변 대기 중입니다. 곧 답변이 등록될 예정입니다.'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* 더보기 버튼 */}
                    {hasMore && (
                        <div className="flex justify-center mt-10">
                            <button
                                onClick={handleLoadMore}
                                disabled={loading}
                                className="
                                    group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600
                                    text-white font-semibold rounded-xl
                                    hover:from-blue-600 hover:to-purple-700
                                    transform hover:scale-105 hover:shadow-2xl
                                    transition-all duration-300 ease-out
                                    disabled:from-gray-300 disabled:to-gray-400
                                    disabled:cursor-not-allowed disabled:transform-none
                                    focus:outline-none focus:ring-4 focus:ring-blue-300
                                "
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        로딩 중...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        더 보기
                                        <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </span>
                                )}
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <svg className="w-24 h-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-400 text-lg font-medium">등록된 QnA 내역이 없습니다</p>
                    <p className="text-gray-400 text-sm mt-2">질문을 등록하면 여기에 표시됩니다</p>
                </div>
            )}
        </div>
    );
};

export default QnaHistoryComponent;
