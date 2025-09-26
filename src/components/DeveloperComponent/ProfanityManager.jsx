import React, {useState, useEffect, useCallback, useRef} from 'react';
import axios from 'axios';

const ProfanityManager = () => {
    const [words, setWords] = useState([]);
    const [newWord, setNewWord] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const scrollContainerRef = useRef(null);

    // 비속어 목록 불러오기 (페이징 적용)
    const fetchWords = useCallback(async (page = 1, loadMore = false, preserveScroll = false) => {
        let scrollPosition = 0;

        // 스크롤 위치 저장 (컨테이너 기준)
        if (preserveScroll && scrollContainerRef.current) {
            scrollPosition = scrollContainerRef.current.scrollTop;
        }

        try {
            setLoading(true);
            const response = await axios.get('/api/profanity/words', {
                params: { page, limit: 50 },
                withCredentials: true
            });
            const data = response.data;
            if (data.success) {
                setWords(prev => loadMore ? [...prev, ...data.words] : data.words);
                setTotalPages(data.pagination.totalPages);
                setHasMore(page < data.pagination.totalPages);
                setError(null);

                // 스크롤 위치 복원
                if (preserveScroll && scrollContainerRef.current) {
                    setTimeout(() => {
                        scrollContainerRef.current.scrollTop = scrollPosition;
                    }, 50); // DOM 업데이트 후 실행
                }
            }
        } catch (err) {
            setError('비속어 목록을 불러오는 데 실패했습니다.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWords(1);
    }, [fetchWords]);

    // 단어 추가
    const handleAddWord = async (e) => {
        e.preventDefault();
        if (!newWord.trim()) return;

        try {
            await axios.post('/api/profanity/words', { word: newWord.trim() }, { withCredentials: true });
            setNewWord('');
            setCurrentPage(1);
            fetchWords(1);
        } catch (err) {
            setError(err.response?.data?.message || '단어 추가에 실패했습니다.');
        }
    };

    // 단어 삭제 (컨테이너 스크롤 위치 기준)
    const handleDeleteWord = async (wordToDelete) => {
        if (!confirm(`"${wordToDelete}"를 삭제하시겠습니까?`)) return;

        // 컨테이너의 현재 스크롤 위치 저장
        const currentScrollPosition = scrollContainerRef.current?.scrollTop || 0;

        try {
            await axios.delete('/api/profanity/words', {
                data: { word: wordToDelete },
                withCredentials: true
            });

            // state에서 단어 제거
            setWords(prevWords => prevWords.filter(word => word !== wordToDelete));

            // 컨테이너 스크롤 위치 복원
            setTimeout(() => {
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = currentScrollPosition;
                }
            }, 0);

        } catch (err) {
            setError(err.response?.data?.message || '삭제에 실패했습니다.');
        }
    };

    // 더 보기 (컨테이너 스크롤 위치 기준)
    const loadMoreWords = async () => {

        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);

        // 데이터 로드 시 스크롤 위치 보존 플래그 전달
        await fetchWords(nextPage, true, true);
    };

    return (
        <div className="p-6 bg-white shadow-lg rounded-xl h-full flex flex-col">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">비속어 관리</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}

            {/* 단어 추가 폼 */}
            <form onSubmit={handleAddWord} className="flex gap-2 mb-6">
                <input
                    type="text"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    placeholder="추가할 단어 입력"
                    className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    type="submit"
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    추가
                </button>
            </form>

            {/* 그리드 레이아웃 목록 */}
            <div
                ref={scrollContainerRef}
                className="flex-1 border rounded-lg p-4 overflow-y-auto bg-gray-50"
            >
                {loading && currentPage === 1 ? (
                    <p className="text-center py-8 text-gray-500">목록을 불러오는 중...</p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {words.map((word) => (
                                <div
                                    key={word}
                                    className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200"
                                >
                                    <span className="text-gray-700 text-sm font-medium truncate mr-2">
                                        {word}
                                    </span>
                                    <button
                                        onClick={() => handleDeleteWord(word)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded text-xs font-medium transition-colors duration-200 flex-shrink-0"
                                    >
                                        삭제
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* 더 보기 버튼 */}
                        {hasMore && (
                            <div className="mt-6 text-center">
                                <button
                                    onClick={loadMoreWords}
                                    disabled={loading}
                                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? '로딩 중...' : '더 보기'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ProfanityManager;
