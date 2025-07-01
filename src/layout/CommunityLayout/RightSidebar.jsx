import { useNavigate } from 'react-router-dom';

// eslint-disable-next-line react/prop-types
const RightSidebar = ({ sideTab, setSideTab, topViewed, topCommented }) => {
    const navigate = useNavigate();

    return (
        <div className="w-full lg:w-80 sticky top-20">
            <div className="bg-white shadow-lg rounded-xl p-4 mb-6">
                {/* Toggle Buttons */}
                <div className="flex justify-between bg-gray-100 rounded-lg overflow-hidden">
                    <button
                        onClick={() => setSideTab('viewed')}
                        className={`flex-1 text-center py-2 font-medium transition-colors ${
                            sideTab === 'viewed'
                                ? 'bg-white text-blue-600 shadow-inner'
                                : 'text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        최다 조회
                    </button>
                    <button
                        onClick={() => setSideTab('commented')}
                        className={`flex-1 text-center py-2 font-medium transition-colors ${
                            sideTab === 'commented'
                                ? 'bg-white text-blue-600 shadow-inner'
                                : 'text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        최다 댓글
                    </button>
                </div>

                {/* Viewed List */}
                {sideTab === 'viewed' && (
                    <div className="mt-4">
                        <h2 className="text-lg font-semibold text-gray-700 mb-3">많이 본 게시글</h2>
                        <ul className="space-y-2">
                            {topViewed.map((item) => (
                                <li
                                    key={item._id}
                                    className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md transition-colors"
                                >
                                    <button
                                        onClick={() => navigate(`/community/${item._id}`)}
                                        className="text-blue-600 hover:underline font-medium text-sm flex-1 text-left"
                                    >
                                        {item.communityTitle}
                                    </button>
                                    <span className="text-xs text-gray-500 ml-2">
                    {item.communityViews}회
                  </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Commented List */}
                {sideTab === 'commented' && (
                    <div className="mt-4">
                        <h2 className="text-lg font-semibold text-gray-700 mb-3">댓글 많은 게시글</h2>
                        <ul className="space-y-2">
                            {topCommented.map((item) => (
                                <li
                                    key={item._id}
                                    className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md transition-colors"
                                >
                                    <button
                                        onClick={() => navigate(`/community/${item._id}`)}
                                        className="text-blue-600 hover:underline font-medium text-sm flex-1 text-left"
                                    >
                                        {item.communityTitle}
                                    </button>
                                    <span className="text-xs text-gray-500 ml-2">
                                        {item.totalComments ?? 0}개
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RightSidebar;
