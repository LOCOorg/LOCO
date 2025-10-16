import { useNavigate } from 'react-router-dom';
import { FaThumbsUp } from 'react-icons/fa';
import clsx from 'clsx';

const PostActions = ({
    community,
    isRecommended,
    onToggleRecommend,
    onReport,
    onDelete,
    currentUserId,
    isAdmin
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
                    aria-label="추천하기"
                    className={clsx(
                        'w-10 h-10 rounded-full border flex items-center justify-center transition-colors',
                        {
                            'bg-blue-500 border-blue-500 text-white': isRecommended,
                            'bg-transparent border-gray-300 text-gray-500 hover:bg-gray-100': !isRecommended,
                        }
                    )}
                >
                    <FaThumbsUp size={20} />
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
                        className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition duration-200"
                    >
                        삭제
                    </button>
                </div>
            )}
        </div>
    );
};

export default PostActions;
