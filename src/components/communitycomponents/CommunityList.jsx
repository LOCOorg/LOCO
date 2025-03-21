// src/components/CommunityList.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCommunities } from '../../api/communityApi.js';
import { getUserInfo } from '../../api/userAPI.js';

// 카테고리 목록
const categories = ['전체', '자유', '유머', '질문', '사건사고', '전적인증'];

// 정렬 옵션
const sortOptions = ['최신순', '인기순'];

// 상대 시간 포맷 함수
const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    if (diffSeconds < 60) {
        return `${diffSeconds}초 전`;
    } else if (diffSeconds < 3600) {
        const minutes = Math.floor(diffSeconds / 60);
        return `${minutes}분 전`;
    } else if (diffSeconds < 86400) {
        const hours = Math.floor(diffSeconds / 3600);
        return `${hours}시간 전`;
    } else {
        const days = Math.floor(diffSeconds / 86400);
        return `${days}일 전`;
    }
};

const CommunityList = () => {
    const [communities, setCommunities] = useState([]);
    const [filteredCommunities, setFilteredCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('전체');
    const [selectedSort, setSelectedSort] = useState('최신순');

    // 오른쪽 사이드바용 (최다 조회, 최다 댓글)
    const [topViewed, setTopViewed] = useState([]);
    const [topCommented, setTopCommented] = useState([]);
    // 사이드바에서 "최다 조회" vs "최다 댓글" 토글 상태
    const [sideTab, setSideTab] = useState('viewed');

    // 작성자 정보를 저장할 맵: { [userId]: nickname }
    const [userMap, setUserMap] = useState({});

    const navigate = useNavigate();

    useEffect(() => {
        const loadCommunities = async () => {
            try {
                const data = await fetchCommunities();
                setCommunities(data);
                setFilteredCommunities(data);

                // 사이드바용 상위 5개 추출 (조회수 기준)
                const viewed = [...data]
                    .sort((a, b) => b.communityViews - a.communityViews)
                    .slice(0, 5);
                setTopViewed(viewed);

                // 최다 댓글 계산: 댓글 배열의 길이를 기준으로 정렬
                const commented = [...data]
                    .sort((a, b) => {
                        const aCount = a.comments ? a.comments.length : 0;
                        const bCount = b.comments ? b.comments.length : 0;
                        return bCount - aCount;
                    })
                    .slice(0, 5);
                setTopCommented(commented);
            } catch (err) {
                setError('커뮤니티 목록을 불러오는 데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        loadCommunities();
    }, []);

    // 커뮤니티 목록이 업데이트되면, 각 게시글의 작성자 정보를 가져와 userMap에 저장
    useEffect(() => {
        const fetchUserNames = async () => {
            if (communities.length === 0) return;
            const userIds = new Set();
            communities.forEach((comm) => {
                userIds.add(comm.userId);
            });
            const newUserMap = {};
            const promises = Array.from(userIds).map(async (uid) => {
                try {
                    const userInfo = await getUserInfo(uid);
                    newUserMap[uid] = userInfo.nickname || userInfo.name || uid;
                } catch (err) {
                    newUserMap[uid] = uid;
                }
            });
            await Promise.all(promises);
            setUserMap(newUserMap);
        };

        fetchUserNames();
    }, [communities]);

    // 카테고리 클릭 시 필터링
    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
        if (category === '전체') {
            setFilteredCommunities(communities);
        } else {
            const filtered = communities.filter(
                (c) => c.communityCategory === category
            );
            setFilteredCommunities(filtered);
        }
    };

    // 정렬 변경
    const handleSortChange = (sortOption) => {
        setSelectedSort(sortOption);
        let sorted = [...filteredCommunities];

        if (sortOption === '최신순') {
            sorted.sort((a, b) => {
                const dateA = new Date(a.createdAt || a.communityRegDate);
                const dateB = new Date(b.createdAt || b.communityRegDate);
                return dateB.getTime() - dateA.getTime();
            });
        } else if (sortOption === '인기순') {
            sorted.sort((a, b) => b.recommended - a.recommended);
        }
        setFilteredCommunities(sorted);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                로딩중...
            </div>
        );
    }
    if (error) {
        return <div className="text-red-500 text-center mt-4">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4 flex">
            {/* 왼쪽 사이드바 - 카테고리 */}
            <aside className="w-64 mr-6">
                <h2 className="text-xl font-bold mb-4">카테고리</h2>
                <ul className="space-y-2">
                    {categories.map((cat) => (
                        <li key={cat}>
                            <button
                                onClick={() => handleCategoryClick(cat)}
                                className={`block w-full text-left px-3 py-2 rounded ${
                                    selectedCategory === cat
                                        ? 'bg-blue-500 text-white'
                                        : 'hover:bg-gray-100'
                                }`}
                            >
                                {cat}
                            </button>
                        </li>
                    ))}
                </ul>
            </aside>

            {/* 메인 영역 */}
            <main className="flex-1 mr-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">
                        커뮤니티 목록 ({selectedCategory})
                    </h1>
                    <div>
                        {sortOptions.map((option) => (
                            <button
                                key={option}
                                onClick={() => handleSortChange(option)}
                                className={`ml-2 px-3 py-2 rounded ${
                                    selectedSort === option
                                        ? 'bg-blue-500 text-white'
                                        : 'hover:bg-gray-100'
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredCommunities.length === 0 ? (
                    <p className="text-gray-600">게시글이 없습니다.</p>
                ) : (
                    <ul className="space-y-4">
                        {filteredCommunities.map((community) => (
                            <li
                                key={community._id}
                                className="border border-gray-200 p-4 rounded shadow-sm hover:shadow-md transition duration-200 flex"
                            >
                                {/* 썸네일 이미지 */}
                                {community.communityImage && (
                                    <div className="w-20 h-20 mr-4 flex-shrink-0">
                                        <img
                                            src={
                                                community.communityImage.startsWith('http') ||
                                                community.communityImage.startsWith('data:')
                                                    ? community.communityImage
                                                    : `${import.meta.env.VITE_API_HOST}${community.communityImage}`
                                            }
                                            alt="게시글 이미지"
                                            className="w-full h-full object-cover rounded"
                                        />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <button
                                        onClick={() => navigate(`/community/${community._id}`)}
                                        className="text-blue-500 font-medium hover:underline"
                                    >
                                        {community.communityTitle} ({community.communityCategory})
                                    </button>
                                    <p className="mt-2 text-sm text-gray-600">
                                        작성일:{' '}
                                        <span className="font-semibold">
                                            {formatRelativeTime(community.communityRegDate)}
                                        </span>{' '}
                                        | 조회수:{' '}
                                        <span className="font-semibold">
                                            {community.communityViews}
                                        </span>{' '}
                                        | 추천:{' '}
                                        <span className="font-semibold">
                                            {community.recommended}
                                        </span>{' '}
                                        | 댓글:{' '}
                                        <span className="font-semibold">
                                            {community.commentCount ||
                                                (community.comments ? community.comments.length : 0)}
                                        </span>
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        작성자:{' '}
                                        <span className="font-semibold">
                                            {userMap[community.userId] || community.userId}
                                        </span>
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="mt-6">
                    <button
                        onClick={() => navigate('/community/new')}
                        className="inline-block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200"
                    >
                        새 게시글 작성
                    </button>
                </div>
            </main>

            {/* 오른쪽 사이드바 - 버튼 토글로 최다 조회 / 최다 댓글 */}
            <aside className="w-64">
                <div className="flex space-x-2 mb-4">
                    <button
                        onClick={() => setSideTab('viewed')}
                        className={`px-3 py-2 rounded ${
                            sideTab === 'viewed'
                                ? 'bg-blue-500 text-white'
                                : 'hover:bg-gray-100'
                        }`}
                    >
                        최다 조회
                    </button>
                    <button
                        onClick={() => setSideTab('commented')}
                        className={`px-3 py-2 rounded ${
                            sideTab === 'commented'
                                ? 'bg-blue-500 text-white'
                                : 'hover:bg-gray-100'
                        }`}
                    >
                        최다 댓글
                    </button>
                </div>

                {sideTab === 'viewed' && (
                    <div>
                        <h2 className="text-xl font-bold mb-2">최다 조회</h2>
                        <ul className="space-y-2">
                            {topViewed.map((item) => (
                                <li key={item._id} className="text-sm">
                                    <button
                                        onClick={() => navigate(`/community/${item._id}`)}
                                        className="hover:underline text-blue-600"
                                    >
                                        {item.communityTitle}
                                    </button>{' '}
                                    ({item.communityViews})
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {sideTab === 'commented' && (
                    <div>
                        <h2 className="text-xl font-bold mb-2">최다 댓글</h2>
                        <ul className="space-y-2">
                            {topCommented.map((item) => (
                                <li key={item._id} className="text-sm">
                                    <button
                                        onClick={() => navigate(`/community/${item._id}`)}
                                        className="hover:underline text-blue-600"
                                    >
                                        {item.communityTitle}
                                    </button>{' '}
                                    ({item.comments ? item.comments.length : 0})
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </aside>
        </div>
    );
};

export default CommunityList;
