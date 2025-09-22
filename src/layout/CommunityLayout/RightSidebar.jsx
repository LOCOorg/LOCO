import { useLocation, useNavigate } from 'react-router-dom';

// eslint-disable-next-line react/prop-types
const RightSidebar = ({ sideTab, setSideTab, topViewed, topCommented }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isCommunityPage = location.pathname.startsWith('/community');

    const listContainerClasses = isCommunityPage
        ? "space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar"
        : "grid grid-cols-2 gap-x-2 gap-y-2 max-h-[350px] overflow-y-auto custom-scrollbar";

    const listItemClasses = `flex items-start justify-between w-full hover:bg-gray-50 rounded-lg cursor-pointer border border-gray-100 transition-colors ${isCommunityPage ? 'p-3' : 'p-2'}`;


    // ✅ 카테고리별 색상 지정
    const getCategoryColor = (category) => {
        const colors = {
            '자유': 'bg-blue-100 text-blue-800',
            '유머': 'bg-yellow-100 text-yellow-800',
            '질문': 'bg-green-100 text-green-800',
            '사건사고': 'bg-red-100 text-red-800',
            '전적인증': 'bg-purple-100 text-purple-800',
            '개발요청': 'bg-gray-100 text-gray-800'
        };
        return colors[category] || 'bg-gray-100 text-gray-800';
    };


    return (
        <div className="w-auto bg-white shadow-lg rounded-lg p-4">
            {/* 헤더 */}
            <div className="mb-4">
                <div className="flex items-baseline gap-3 justify-between">
                    <p className="text-xl text-black font-semibold">커뮤니티</p>
                    <p className="text-xs text-gray-400 ">최근 7일 기준</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-end">24시간마다 업데이트</p>
            </div>
            {/* 탭 버튼 */}
            <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
                <button
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        sideTab === 'viewed'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setSideTab('viewed')}
                >
                    최다 조회
                </button>
                <button
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        sideTab === 'commented'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setSideTab('commented')}
                >
                    최다 댓글
                </button>
            </div>

            {/* 최다 조회 탭 */}
            {sideTab === 'viewed' && (
                <div className={listContainerClasses}>
                    {topViewed && topViewed.length > 0 ? (
                        topViewed.map((item, index) => (
                            <div
                                key={item._id || index}
                                className={listItemClasses}
                                onClick={() => navigate(`/community/${item._id}`)}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.communityCategory)} flex-shrink-0`}>
                                            {item.communityCategory}
                                        </span>
                                        <p className="text-sm text-gray-900 hover:text-blue-600 font-medium leading-tight truncate">
                                            {item.communityTitle}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500 flex items-center flex-shrink-0 ml-2">
                                        👁️ {item.communityViews?.toLocaleString() || 0}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">최근 일주일 동안</p>
                            <p className="text-sm">게시글이 없습니다</p>
                        </div>
                    )}
                </div>
            )}

            {/* 최다 댓글 탭 */}
            {sideTab === 'commented' && (
                <div className={listContainerClasses}>
                    {topCommented && topCommented.length > 0 ? (
                        topCommented.map((item, index) => (
                            <div
                                key={item._id || index}
                                className={listItemClasses}
                                onClick={() => navigate(`/community/${item._id}`)}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.communityCategory)} flex-shrink-0`}>
                                            {item.communityCategory}
                                        </span>
                                        <p className="text-sm text-gray-900 hover:text-blue-600 font-medium leading-tight truncate">
                                            {item.communityTitle}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-500 flex items-center flex-shrink-0 ml-2">
                                        💬 {item.totalComments?.toLocaleString() || 0}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">최근 일주일 동안</p>
                            <p className="text-sm">댓글이 있는 게시글이 없습니다</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RightSidebar;
