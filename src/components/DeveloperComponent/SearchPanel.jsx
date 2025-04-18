// File: /src/components/DeveloperComponent/SearchPanel.jsx
// 이 컴포넌트는 좌측 검색 패널로, 검색 인풋과 검색 결과 목록, 그리고 "Load More" 버튼을 포함합니다.
import React from "react";
import UserListItem from "./UserListItem.jsx";

const SearchPanel = ({ query, setQuery, page, setPage, users, total, loading, error, onUserClick }) => {
    return (
        <div className="w-2/5 p-6 bg-white border-r border-gray-200 overflow-y-auto">
            {/* 패널 제목 */}
            <h2 className="mb-4 text-2xl font-semibold border-b border-gray-300 pb-2">User Search</h2>
            {/* 검색 인풋 */}
            <input
                type="text"
                value={query}
                placeholder="Search users..."
                onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                }}
                className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {loading && <p>Searching...</p>}
            {error && <p className="text-red-500">Error: {error.message}</p>}
            <p className="mb-4">Total {total} results</p>
            {/* 검색 결과 목록 */}
            <div>
                {users.map(user => (
                    <UserListItem
                        key={user._id || user.id}
                        user={user}
                        onClick={() => onUserClick(user)}
                    />
                ))}
            </div>
            {/* 결과가 많을 경우 "Load More" 버튼 표시 */}
            {total > page * 30 && (
                <button
                    type="button"
                    onClick={() => setPage(page + 1)}
                    className="mt-4 w-full py-3 bg-indigo-500 text-white rounded-md shadow-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    Load More
                </button>
            )}
        </div>
    );
};

export default SearchPanel;
