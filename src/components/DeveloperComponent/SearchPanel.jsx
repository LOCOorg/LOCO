// File: /src/components/DeveloperComponent/SearchPanel.jsx
// 이 컴포넌트는 좌측 검색 패널로, 검색 인풋과 검색 결과 목록, 그리고 "Load More" 버튼을 포함합니다.
import UserListItem from "./UserListItem.jsx";

const SearchPanel = ({ keyword, setKeyword, pagination, users, loading, error, onUserClick, loadMore }) => {
    const { page, total, hasMore } = pagination || { page: 1, total: 0, hasMore: false };
    
    return (
        <div className="w-1/3 p-6 bg-white border-r border-gray-200 overflow-y-auto">

            {/* 패널 제목 */}
            <h2 className="mb-4 text-2xl font-semibold border-b border-gray-300 pb-2">
                User Search 🔐 
                <span className="text-sm text-green-600 font-normal">(복호화 지원)</span>
            </h2>
            {/* 검색 인풋 */}
            <input
                type="text"
                value={keyword || ''}
                placeholder="사용자 검색... (이름, 닉네임, 전화번호)"
                onChange={(e) => {
                    setKeyword(e.target.value);
                }}
                className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            
            {/* 로딩 및 에러 상태 */}
            {loading && (
                <div className="flex items-center mb-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mr-2"></div>
                    <p className="text-indigo-600">검색 중...</p>
                </div>
            )}
            {error && (
                <p className="text-red-500 mb-4">
                    에러: {error.response?.data?.message || error.message}
                </p>
            )}
            
            {/* 결과 수 표시 */}
            <div className="mb-4 flex justify-between items-center">
                <p className="text-gray-600">총 {total}명 결과</p>
                {users.length > 0 && (
                    <p className="text-sm text-gray-500">
                        {users.length}/{total} 표시
                    </p>
                )}
            </div>
            
            {/* 검색 결과 목록 */}
            <div className="space-y-2">
                {users.length === 0 && !loading && (
                    <p className="text-gray-500 text-center py-8">
                        {keyword ? '검색 결과가 없습니다.' : '검색어를 입력해주세요.'}
                    </p>
                )}
                {users.map(user => (
                    <UserListItem
                        key={user._id || user.id}
                        user={user}
                        onClick={() => onUserClick(user)}
                    />
                ))}
            </div>
            
            {/* 결과가 많을 경우 "Load More" 버튼 표시 */}
            {hasMore && !loading && (
                <button
                    type="button"
                    onClick={loadMore}
                    className="mt-4 w-full py-3 bg-indigo-500 text-white rounded-md shadow-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                    더 보기 ({users.length}/{total})
                </button>
            )}
        </div>
    );
};

export default SearchPanel;
