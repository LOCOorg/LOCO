import { useNavigate } from 'react-router-dom';
import { HandThumbUpIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

const PostActions = ({
    community,
    isRecommended,
    onToggleRecommend,
    onReport,
    onDelete,
    currentUserId,
    isAdmin,
    isDeleting = false,
    isRecommending = false,

}) => {
    const navigate = useNavigate();

    if (!community) return null;

    const isAuthor = community.userId === currentUserId;

    return (
        <div>
            {/* 추천 및 신고 버튼 */}
            <div className="mt-4 flex items-center gap-2">
                <button
                    onClick={onToggleRecommend}
                    disabled={isRecommending}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        isRecommended
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    <HandThumbUpIcon className="w-5 h-5" />
                    <span>추천 {community.recommendedUsers?.length || 0}</span>
                    {isRecommending && <span>...</span>}
                </button>
                {!isAuthor && (
                    <button
                        onClick={onReport}
                        className="text-sm font-medium text-gray-500 hover:text-rose-600 hover:underline"
                    >
                        신고
                    </button>
                )}
            </div>

            {/* 게시글 관리 버튼 */}
            {(isAuthor || isAdmin) && (
                <div className="mt-6 flex space-x-4">
                    {isAuthor && (
                        <button
                            onClick={() => navigate(`/community/edit/${community._id}`)}
                            className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 transition duration-200"
                        >
                            수정
                        </button>
                    )}
                    <button
                        onClick={onDelete}
                        disabled={isDeleting}
                        className={`bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition duration-200 flex items-center ${
                            isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {isDeleting ? (
                            <>
                                <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                삭제 중...
                            </>
                        ) : (
                            '삭제'
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};


PostActions.propTypes = {
    community: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        userId: PropTypes.string.isRequired,
        recommendedUsers: PropTypes.arrayOf(PropTypes.string),
    }).isRequired,
    isRecommended: PropTypes.bool.isRequired,
    onToggleRecommend: PropTypes.func.isRequired,
    onReport: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    currentUserId: PropTypes.string,
    isAdmin: PropTypes.bool,
    isDeleting: PropTypes.bool,
    isRecommending: PropTypes.bool,
};

export default PostActions;
