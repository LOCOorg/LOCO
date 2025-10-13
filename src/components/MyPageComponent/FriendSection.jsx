import { ChevronDownIcon, ChevronUpIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/solid';
import ProfileButton from './ProfileButton';

// eslint-disable-next-line react/prop-types
const FriendSection = ({ title, friends, total, hasMore, loadMore, loading, onFriendSelect, isExpanded, toggleExpand, status }) => {
    const isOnline = status === 'online';

    return (
        <div className="border-t border-gray-200">
            <button
                onClick={toggleExpand}
                className="w-full flex justify-between items-center px-4 py-3 text-left hover:bg-gray-100 focus:outline-none"
            >
                <div className="flex items-center space-x-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    <span className="font-semibold text-gray-800">{title}</span>
                    <span className="text-gray-500 text-sm">({total})</span>
                </div>
                {isExpanded ? <ChevronUpIcon className="w-5 h-5 text-gray-500" /> : <ChevronDownIcon className="w-5 h-5 text-gray-500" />}
            </button>
            {isExpanded && (
                <div className="pl-4 pr-2 pb-2">
                    {friends.length > 0 ? (
                        friends.map(f => (
                            <div key={f._id} className="p-2 flex items-center justify-between hover:bg-gray-50 rounded-lg transition-colors">
                                <div className="flex items-center flex-1 min-w-0">
                                    <div className="cursor-pointer relative">
                                        <ProfileButton profile={f} size="sm" area="프로필"/>
                                    </div>
                                    <div className="ml-3 flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-800 truncate">
                                                {f.nickname}
                                            </span>
                                            <button
                                                onClick={() => onFriendSelect(f)}
                                                className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-200 transition-colors"
                                                title={`${f.nickname}님과 채팅하기`}
                                            >
                                                <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        !loading && <p className="text-xs text-gray-500 p-3">친구가 없습니다.</p>
                    )}
                    {hasMore && (
                        <div className="pt-2">
                            <button
                                className="w-full py-2 bg-gray-200 text-sm rounded-lg hover:bg-gray-300 disabled:opacity-50"
                                onClick={loadMore}
                                disabled={loading}
                            >
                                {loading ? '로딩 중...' : '더보기'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FriendSection;
