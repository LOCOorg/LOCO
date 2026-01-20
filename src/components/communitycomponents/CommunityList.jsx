// src/components/communitycomponents/CommunityList.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchCommunities } from '../../api/communityApi.js';
import useSidebarData from '../../hooks/useSidebarData.js';
import PageComponent from '../../common/pageComponent.jsx';
import CommunityLayout from '../../layout/CommunityLayout/CommunityLayout.jsx';
import LeftSidebar from '../../layout/CommunityLayout/LeftSidebar.jsx';
import RightSidebar from '../../layout/CommunityLayout/RightSidebar.jsx';
import { Search } from 'lucide-react';
import useAuthStore from '../../stores/authStore.js';

// 유틸리티 함수
const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}초 전`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}분 전`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}시간 전`;
    return `${Math.floor(diffSeconds / 86400)}일 전`;
};

const CommunityList = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialCategory = searchParams.get('category') || '전체';

    // 사용자 정보
    const currentUser = useAuthStore((state) => state.user);
    const currentUserId = currentUser?._id;
    const API_HOST = import.meta.env.VITE_API_HOST;

    // 페이지네이션 상태
    const [pageResponse, setPageResponse] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    // 데이터 상태
    const [filteredCommunities, setFilteredCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 필터 및 정렬 상태
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [selectedSort, setSelectedSort] = useState('최신순');
    const [keyword, setKeyword] = useState('');
    const [searchType, setSearchType] = useState('title+content');
    const [selectedPeriod, setSelectedPeriod] = useState('전체');

    // // 사이드바 상태
    // const [topViewed, setTopViewed] = useState([]);
    // const [topCommented, setTopCommented] = useState([]);
    // const [sideTab, setSideTab] = useState('viewed');
    // ✅ useSidebarData Hook 사용
    const { sideTab, setSideTab, topViewed, topCommented } = useSidebarData();

    // 시간 범위 옵션 정의
    const periodOptions = [
        '전체',
        '지난 1일',
        '지난 1주',
        '지난 1달',
        '지난 1년'
    ];

    // 닉네임 표시 함수 (익명 처리)
    const getDisplayNickname = (community) => {
        if (community.isAnonymous) return '익명';
        return community.userNickname;
    };

    // 커뮤니티 데이터 로드
    const loadCommunities = async (page) => {
        setLoading(true);
        try {
            const data = await fetchCommunities(
                page,
                pageSize,
                selectedCategory,
                (selectedCategory === '내 글' || selectedCategory === '내 댓글') ? currentUserId : null,
                selectedSort,
                keyword,
                searchType,
                selectedPeriod
            );
            setPageResponse(data);
            setFilteredCommunities(data.dtoList || []);
        } catch (err) {
            setError('커뮤니티 목록을 불러오는 데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 이벤트 핸들러
    const handleSearch = () => {
        setCurrentPage(1);
        loadCommunities(1);
    };

    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
        setCurrentPage(1);
        navigate(`?category=${category}`);
    };

    const handleSortChange = (sortOption) => {
        setSelectedSort(sortOption);
        setCurrentPage(1);
    };

    // 새로 추가: 시간 범위 변경 핸들러
    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        setCurrentPage(1);
    };

    const changePage = (page) => {
        setCurrentPage(page);
    };

    // // Effects
    // useEffect(() => {
    //     const fetchGlobalTop = async () => {
    //         try {
    //             const [topViewedData, topCommentedData] = await Promise.all([
    //                 fetchTopViewed(),
    //                 fetchTopCommented()
    //             ]);
    //             setTopViewed(topViewedData);
    //             setTopCommented(topCommentedData);
    //         } catch (error) {
    //             console.error('사이드바 데이터 로드 실패:', error);
    //             setTopViewed([]);
    //             setTopCommented([]);
    //         }
    //     };
    //     fetchGlobalTop();
    // }, []);

    useEffect(() => {
        if ((selectedCategory === '내 글' || selectedCategory === '내 댓글') && !currentUserId) {
            return;
        }
        loadCommunities(currentPage);
    }, [currentPage, selectedCategory, selectedSort, currentUserId, selectedPeriod]);

    // 로딩 상태
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                로딩중...
            </div>
        );
    }

    // 에러 상태
    if (error) {
        return <div className="text-red-500 text-center mt-4">{error}</div>;
    }

    return (
        <CommunityLayout
            leftSidebar={
                <LeftSidebar
                    selectedCategory={selectedCategory}
                    handleCategoryClick={handleCategoryClick}
                />
            }
            rightSidebar={
                <RightSidebar
                    sideTab={sideTab}
                    setSideTab={setSideTab}
                    topViewed={topViewed}
                    topCommented={topCommented}
                />
            }
        >
            <div className="space-y-4">
                {/* 1단: 검색 및 액션 바 */}
                <div className="flex flex-col lg:flex-row items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                    {/* 검색 필터 그룹 */}
                    <div className="flex gap-2 w-full lg:flex-1">
                        <select
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                            className="w-24 sm:w-auto border-none bg-gray-50 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                        >
                            <option value="title">제목</option>
                            <option value="content">내용</option>
                            <option value="title+content">제목+내용</option>
                            <option value="author">작성자</option>
                        </select>

                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="어떤 글을 찾으시나요?"
                                className="w-full bg-gray-50 border-none rounded-xl pl-4 pr-10 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            />
                                                            <button
                                                                onClick={handleSearch}
                                                                className="absolute inset-y-0 right-2 flex items-center justify-center w-10 h-10 my-auto text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                            >
                                                                <Search size={20} strokeWidth={2.5} />
                                                            </button>                        </div>
                    </div>

                    {/* 부가 설정 그룹 */}
                    <div className="flex gap-2 w-full lg:w-auto">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => handlePeriodChange(e.target.value)}
                            className="flex-1 lg:w-32 border-none bg-gray-50 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
                        >
                            {periodOptions.map((period) => (
                                <option key={period} value={period}>{period}</option>
                            ))}
                        </select>

                        <button
                            onClick={() => navigate('/community/new')}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 whitespace-nowrap"
                        >
                            ✏️ 글쓰기
                        </button>
                    </div>
                </div>

                {/* 2단: 정렬 탭 (검색창 아래) */}
                <div className="flex justify-start">
                    <div className="inline-flex bg-gray-200/50 p-1 rounded-xl">
                        {['최신순', '인기순', '추천순'].map((sort) => (
                            <button
                                key={sort}
                                onClick={() => handleSortChange(sort)}
                                className={`px-5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-1.5 ${
                                    selectedSort === sort
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <span>{sort === '최신순' ? '🕒' : sort === '인기순' ? '🔥' : '👍'}</span>
                                <span>{sort.replace('순', '')}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 게시글 목록 */}
                {filteredCommunities.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-md">
                        게시글이 없습니다.
                    </div>
                ) : (
                    <ul className="grid grid-cols-1 gap-4">
                        {filteredCommunities.map((community) => {
                            const thumb = community.communityImages?.length
                                ? `${API_HOST}/uploads${community.communityImages[0]}`
                                : '/no-thumb.png';

                            return (
                                <li
                                    key={community._id}
                                    className="flex flex-col-reverse sm:flex-row bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow gap-4"
                                >

                                    <div className="flex-1 flex flex-col justify-between min-w-0">
                                        <button
                                            onClick={() => navigate(`/community/${community._id}`)}
                                            className="text-lg font-semibold text-blue-600 hover:underline text-left truncate w-full"
                                        >
                                            {community.communityTitle}{' '}
                                            <span className="text-sm text-gray-500 whitespace-nowrap">
                                                ({community.communityCategory})
                                            </span>
                                        </button>

                                        <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-y-1 gap-x-3 items-center">
                                            <span>
                                                작성일{' '}
                                                <span className="font-medium text-gray-700">
                                                    {formatRelativeTime(community.createdAt)}
                                                </span>
                                            </span>
                                            <span className="hidden sm:inline text-gray-300">|</span>
                                            <span>
                                                조회수{' '}
                                                <span className="font-medium text-gray-700">
                                                    {community.communityViews}
                                                </span>
                                            </span>
                                            <span className="hidden sm:inline text-gray-300">|</span>
                                            <span>
                                                추천{' '}
                                                <span className="font-medium text-gray-700">
                                                    {community.recommended}
                                                </span>
                                            </span>
                                            <span className="hidden sm:inline text-gray-300">|</span>
                                            <span>
                                                댓글{' '}
                                                <span className="font-medium text-gray-700">
                                                    {community.commentCount ?? 0}
                                                </span>
                                            </span>
                                        </div>

                                        <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden text-xs">
                                                {/* 프로필 이미지가 있다면 여기에 표시 */}
                                                🤖
                                            </div>
                                            <span className="font-medium text-gray-700">
                                                {getDisplayNickname(community)}
                                            </span>
                                        </div>
                                    </div>
                                    {community.communityImages?.length > 0 && (
                                        <div className="sm:w-32 sm:shrink-0">
                                            <img
                                                src={thumb}
                                                alt="thumbnail"
                                                className="w-full h-40 sm:h-24 object-cover rounded-lg"
                                            />
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}

                {/* 페이지네이션 */}
                {pageResponse && (
                    <div className="mt-6">
                        <PageComponent
                            pageResponse={pageResponse}
                            changePage={changePage}
                        />
                    </div>
                )}
            </div>
        </CommunityLayout>
    );
};

export default CommunityList;
