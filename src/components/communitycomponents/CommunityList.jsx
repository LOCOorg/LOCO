// src/components/communitycomponents/CommunityList.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchCommunities, fetchTopViewed, fetchTopCommented } from '../../api/communityApi.js';
import { getUserInfo } from '../../api/userAPI.js';
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
    const [pageResponse, setPageResponse] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    // 데이터 상태
    const [filteredCommunities, setFilteredCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userMap, setUserMap] = useState({});

    // 필터 및 정렬 상태
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [selectedSort, setSelectedSort] = useState('최신순');
    const [keyword, setKeyword] = useState('');
    const [searchType, setSearchType] = useState('title+content');

    // 사이드바 상태
    const [topViewed, setTopViewed] = useState([]);
    const [topCommented, setTopCommented] = useState([]);
    const [sideTab, setSideTab] = useState('viewed');

    // 닉네임 표시 함수 (익명 처리)
    const getDisplayNickname = (community) => {
        if (community.isAnonymous) return '익명';
        return userMap[community.userId] || community.userId;
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
                searchType
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
    };

    const changePage = (page) => {
        setCurrentPage(page);
    };

    // Effects
    useEffect(() => {
        const fetchGlobalTop = async () => {
            try {
                const [topViewedData, topCommentedData] = await Promise.all([
                    fetchTopViewed(),
                    fetchTopCommented()
                ]);
                setTopViewed(topViewedData);
                setTopCommented(topCommentedData);
            } catch (error) {
                console.error('사이드바 데이터 로드 실패:', error);
                setTopViewed([]);
                setTopCommented([]);
            }
        };
        fetchGlobalTop();
    }, []);

    useEffect(() => {
        if ((selectedCategory === '내 글' || selectedCategory === '내 댓글') && !currentUserId) {
            return;
        }
        loadCommunities(currentPage);
    }, [currentPage, selectedCategory, selectedSort, currentUserId]);

    useEffect(() => {
        const fetchUserNames = async () => {
            if (!pageResponse?.dtoList) return;

            const userIds = new Set();
            pageResponse.dtoList.forEach((comm) => {
                if (comm.userId && !comm.isAnonymous) {
                    userIds.add(comm.userId);
                }
            });

            const newUserMap = {};
            await Promise.all(
                Array.from(userIds).map(async (uid) => {
                    try {
                        const userInfo = await getUserInfo(uid);
                        newUserMap[uid] = userInfo.nickname || userInfo.name || uid;
                    } catch (err) {
                        newUserMap[uid] = uid;
                        console.error(err);
                    }
                })
            );
            setUserMap(newUserMap);
        };
        fetchUserNames();
    }, [pageResponse]);

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
            <div className="space-y-8">
                {/* 헤더 */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                        커뮤니티 목록<span className="text-blue-600"> ({selectedCategory})</span>
                    </h1>
                    <div className="inline-flex space-x-2">
                        {['최신순', '인기순'].map((option) => (
                            <button
                                key={option}
                                onClick={() => handleSortChange(option)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    selectedSort === option
                                        ? 'bg-blue-500 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {option}
                            </button>
                        ))}
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

                    <button
                        onClick={() => navigate('/community/new')}
                        className="w-full sm:w-auto bg-blue-500 text-white px-5 py-2 rounded-md hover:bg-blue-600 transition-colors"
                    >
                        새 게시글 작성
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
                                ? `${API_HOST}${community.communityImages[0]}`
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
                                                    {formatRelativeTime(community.communityRegDate)}
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
