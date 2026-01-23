// src/components/communitycomponents/CommunityList.jsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
//import { fetchCommunities } from '../../api/communityApi.js';
import { useCommunities } from '../../hooks/queries/useCommunityQueries';
import useSidebarData from '../../hooks/useSidebarData.js';
import PageComponent from '../../common/pageComponent.jsx';
import CommunityLayout from '../../layout/CommunityLayout/CommunityLayout.jsx';
import LeftSidebar from '../../layout/CommunityLayout/LeftSidebar.jsx';
import RightSidebar from '../../layout/CommunityLayout/RightSidebar.jsx';
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
    // const [pageResponse, setPageResponse] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;


    // 필터 및 정렬 상태
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [selectedSort, setSelectedSort] = useState('최신순');
    const [keyword, setKeyword] = useState('');
    const [searchType, setSearchType] = useState('title+content');
    const [selectedPeriod, setSelectedPeriod] = useState('전체');


    // ✅ useSidebarData Hook 사용
    const { sideTab, setSideTab, topViewed, topCommented } = useSidebarData();


    // 🆕 게시글 목록 Query Hook 추가
    const {
        data: pageResponse,
        isLoading: loading,
        error,
    } = useCommunities({
        page: currentPage,
        pageSize,
        category: selectedCategory,
        userId: (selectedCategory === '내 글' || selectedCategory === '내 댓글')
            ? currentUserId
            : null,
        sort: selectedSort,
        keyword,
        searchType,
        period: selectedPeriod,
    });

    // 🆕 게시글 목록 추출
    const filteredCommunities = pageResponse?.dtoList || [];


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



    // 이벤트 핸들러
    const handleSearch = () => {
        setCurrentPage(1);

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
        return (
            <div className="text-red-500 text-center mt-4">
                {error.message || '커뮤니티 목록을 불러오는 데 실패했습니다.'}
            </div>
        );
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
            <div className="space-y-8">
                {/* 헤더 */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                        커뮤니티 목록<span className="text-blue-600"> ({selectedCategory})</span>
                    </h1>
                    {/* 정렬 버튼 섹션 - TailwindCSS */}
                    <div className="flex space-x-2 my-5">
                        <button
                            onClick={() => handleSortChange('최신순')}
                            className={`px-4 py-2 rounded border text-sm font-medium transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                selectedSort === '최신순'
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
                            }`}
                        >
                            최신
                        </button>

                        <button
                            onClick={() => handleSortChange('인기순')}
                            className={`px-4 py-2 rounded border text-sm font-medium transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                selectedSort === '인기순'
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
                            }`}
                        >
                            인기
                        </button>

                        <button
                            onClick={() => handleSortChange('추천순')}
                            className={`px-4 py-2 rounded border text-sm font-medium transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                selectedSort === '추천순'
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
                            }`}
                        >
                            추천
                        </button>
                    </div>

                </div>

                {/* 검색 및 글쓰기 */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <select
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                        className="w-full sm:w-auto border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
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
                            placeholder="검색어를 입력하세요"
                            className="w-full border border-gray-300 rounded-full pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 transition"
                        />
                        <button
                            onClick={handleSearch}
                            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* 시간 범위 옵션 */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600">기간:</span>
                        <select
                            value={selectedPeriod}
                            onChange={(e) => handlePeriodChange(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                        >
                            {periodOptions.map((period) => (
                                <option key={period} value={period}>
                                    {period}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => navigate('/community/new')}
                        className="w-full sm:w-auto bg-blue-500 text-white px-5 py-2 rounded-md hover:bg-blue-600 transition-colors"
                    >
                        ✏️ 글쓰기
                    </button>
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
                                    className="flex bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                                >

                                    <div className="flex-1 flex flex-col justify-between">
                                        <button
                                            onClick={() => navigate(`/community/${community._id}`)}
                                            className="text-lg font-semibold text-blue-600 hover:underline text-left"
                                        >
                                            {community.communityTitle}{' '}
                                            <span className="text-sm text-gray-500">
                                                ({community.communityCategory})
                                            </span>
                                        </button>

                                        <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-2">
                                            <span>
                                                작성일{' '}
                                                <span className="font-medium text-gray-700">
                                                    {formatRelativeTime(community.createdAt)}
                                                </span>
                                            </span>
                                            <span>
                                                조회수{' '}
                                                <span className="font-medium text-gray-700">
                                                    {community.communityViews}
                                                </span>
                                            </span>
                                            <span>
                                                추천{' '}
                                                <span className="font-medium text-gray-700">
                                                    {community.recommended}
                                                </span>
                                            </span>
                                            <span>
                                                댓글{' '}
                                                <span className="font-medium text-gray-700">
                                                    {community.commentCount ?? 0}
                                                </span>
                                            </span>
                                        </div>

                                        <div className="mt-1 text-xs text-gray-500">
                                            작성자:{' '}
                                            <span className="font-medium text-gray-700">
                                                {getDisplayNickname(community)}
                                            </span>
                                        </div>
                                    </div>
                                    {community.communityImages?.length > 0 && (
                                        <img
                                            src={thumb}
                                            alt="thumbnail"
                                            className="h-20 w-28 shrink-0 object-cover rounded mr-4"
                                        />
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
