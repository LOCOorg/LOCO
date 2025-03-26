import { useNavigate } from 'react-router-dom';

// eslint-disable-next-line react/prop-types
const RightSidebar = ({ sideTab, setSideTab, topViewed, topCommented }) => {
    const navigate = useNavigate();

    return (
        <div>
            <div className="flex space-x-2 mb-4">
                <button
                    onClick={() => setSideTab('viewed')}
                    className={`px-3 py-2 rounded ${
                        sideTab === 'viewed' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                    }`}
                >
                    최다 조회
                </button>
                <button
                    onClick={() => setSideTab('commented')}
                    className={`px-3 py-2 rounded ${
                        sideTab === 'commented' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
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
                                <button onClick={() => navigate(`/community/${item._id}`)} className="hover:underline text-blue-600">
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
                                <button onClick={() => navigate(`/community/${item._id}`)} className="hover:underline text-blue-600">
                                    {item.communityTitle}
                                </button>{' '}
                                ({item.comments ? item.comments.length : 0})
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default RightSidebar;
