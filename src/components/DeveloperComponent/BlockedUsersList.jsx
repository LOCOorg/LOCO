// src/components/DeveloperComponent/BlockedUsersList.jsx
import React, { useState, useEffect } from 'react';
import instance from '../../api/axiosInstance';

const BlockedUsersList = ({ userId, className = "" }) => {
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [directBlockId, setDirectBlockId] = useState("");
    const [isDirectBlocking, setIsDirectBlocking] = useState(false);

    // 차단된 사용자 목록 조회
    const fetchBlockedUsers = async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);
        try {
            const response = await instance.get(`/api/developer/user/${userId}/blocked`);
            setBlockedUsers(response.data.blockedUsers || []);

            if (response.data.metadata) {
                console.log('📊 차단 목록 조회 메타데이터:', response.data.metadata);
            }
        } catch (err) {
            console.error('차단목록 조회 실패:', err);
            setError('차단목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 사용자 검색
    const searchUsers = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await instance.get(`/api/search/users`, {
                params: {
                    q: query,
                    searchType: 'both',
                    page: 1,
                    limit: 10
                }
            });
            
            // 현재 사용자와 이미 차단된 사용자 제외
            const filteredResults = (response.data.users || []).filter(user => 
                user._id !== userId && 
                !blockedUsers.some(blocked => blocked._id === user._id)
            );
            
            setSearchResults(filteredResults);
        } catch (err) {
            console.error('사용자 검색 실패:', err);
        } finally {
            setIsSearching(false);
        }
    };

    // 사용자 차단
    const blockUser = async (targetUserId) => {
        try {
            await instance.post(`/api/developer/user/${userId}/block/${targetUserId}/minimal`);



            // 차단 성공 시 목록 새로고침
            await fetchBlockedUsers();
            
            // 검색 결과에서 해당 사용자 제거
            setSearchResults(prev => prev.filter(user => user._id !== targetUserId));
            
            alert('사용자가 차단되었습니다.');
        } catch (err) {
            console.error('사용자 차단 실패:', err);
            alert('사용자 차단에 실패했습니다.');
        }
    };

    // 직접 ID로 사용자 차단
    const blockUserById = async () => {
        if (!directBlockId.trim()) {
            alert('사용자 ID를 입력해주세요.');
            return;
        }

        // ObjectId 형식 간단 검증 (24자리 hex)
        if (!/^[0-9a-fA-F]{24}$/.test(directBlockId.trim())) {
            alert('올바른 사용자 ID 형식이 아닙니다. (24자리 영문/숫자)');
            return;
        }

        // 자기 자신 차단 방지
        if (directBlockId.trim() === userId) {
            alert('자기 자신은 차단할 수 없습니다.');
            return;
        }

        // 이미 차단된 사용자인지 확인
        if (blockedUsers.some(user => user._id === directBlockId.trim())) {
            alert('이미 차단된 사용자입니다.');
            return;
        }

        setIsDirectBlocking(true);
        try {
            await instance.post(`/api/developer/user/${userId}/block/${directBlockId.trim()}/minimal`);



            // 차단 성공 시 목록 새로고침
            await fetchBlockedUsers();
            
            // 입력 필드 초기화
            setDirectBlockId('');
            
            alert('사용자가 차단되었습니다.');
        } catch (err) {
            console.error('직접 차단 실패:', err);
            if (err.response?.status === 404) {
                alert('존재하지 않는 사용자 ID입니다.');
            } else {
                alert('사용자 차단에 실패했습니다: ' + (err.response?.data?.message || err.message));
            }
        } finally {
            setIsDirectBlocking(false);
        }
    };

    // 사용자 차단 해제
    const unblockUser = async (targetUserId) => {
        try {
            await instance.delete(`/api/developer/user/${userId}/block/${targetUserId}/minimal`);

            
            // 차단 해제 성공 시 목록에서 제거
            setBlockedUsers(prev => prev.filter(user => user._id !== targetUserId));
            
            alert('사용자 차단이 해제되었습니다.');
        } catch (err) {
            console.error('사용자 차단 해제 실패:', err);
            alert('사용자 차단 해제에 실패했습니다.');
        }
    };

    useEffect(() => {
        fetchBlockedUsers();
    }, [userId]);

    // 검색어 변경 시 디바운싱
    useEffect(() => {
        const timer = setTimeout(() => {
            searchUsers(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    if (loading) {
        return (
            <div className={`${className} flex items-center justify-center p-8`}>
                <div className="text-gray-500">차단목록을 불러오는 중...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${className} flex items-center justify-center p-8`}>
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className={className}>
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">차단 사용자 관리</h3>
                
                {/* 사용자 검색 및 차단 추가 */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">새 사용자 차단</h4>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            placeholder="닉네임 또는 이름으로 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    
                    {/* 검색 결과 */}
                    {isSearching && (
                        <div className="mt-2 text-sm text-gray-500">검색 중...</div>
                    )}
                    
                    {searchResults.length > 0 && (
                        <div className="mt-3 space-y-2">
                            <div className="text-sm text-gray-600">검색 결과:</div>
                            {searchResults.map(user => (
                                <div key={user._id} className="flex items-center justify-between bg-white p-2 rounded border">
                                    <div className="flex items-center space-x-2">
                                        {user.profilePhoto && (
                                            <img 
                                                src={user.profilePhoto} 
                                                alt="Profile" 
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        )}
                                        <div>
                                            <div className="font-medium text-sm">{user.nickname}</div>
                                            <div className="text-xs text-gray-500">{user.name}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => blockUser(user._id)}
                                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                                    >
                                        차단
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 직접 ID로 차단 */}
                <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">직접 사용자 ID로 차단</h4>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            placeholder="사용자 ID (24자리 영문/숫자)"
                            value={directBlockId}
                            onChange={(e) => setDirectBlockId(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                        <button
                            onClick={blockUserById}
                            disabled={isDirectBlocking}
                            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-400"
                        >
                            {isDirectBlocking ? '차단 중...' : 'ID로 차단'}
                        </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        예: 67b123456789012345678901
                    </div>
                </div>
            </div>

            {/* 현재 차단된 사용자 목록 */}
            <div>
                <h4 className="font-medium text-gray-700 mb-3">
                    차단된 사용자 목록 ({blockedUsers.length}명)
                </h4>
                
                {blockedUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        차단된 사용자가 없습니다.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {blockedUsers.map(user => (
                            <div key={user._id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {user.profilePhoto ? (
                                            <img 
                                                src={user.profilePhoto} 
                                                alt="Profile" 
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                                                <span className="text-gray-500 text-sm">👤</span>
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-medium text-gray-800">{user.nickname}</div>

                                            <div className="text-xs text-gray-500">
                                                ID: {user._id}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => unblockUser(user._id)}
                                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                        >
                                            차단 해제
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlockedUsersList;
