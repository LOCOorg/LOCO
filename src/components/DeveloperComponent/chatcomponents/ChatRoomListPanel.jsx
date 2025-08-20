// src/components/DeveloperComponent/chatcomponents/ChatRoomListPanel.jsx
import React, { useState, useMemo } from 'react';

const ChatRoomListPanel = ({
                               rooms,
                               pagination,
                               loading,
                               error,
                               page,
                               setPage,
                               selectedRoom,
                               setSelectedRoom
                           }) => {

    // 1) 현재 선택된 필터 타입 상태
    const [filterType, setFilterType] = useState('all');

    // 2) 유니크한 타입 목록 뽑기
    const typeOptions = useMemo(() => {
        const types = rooms.map(r => r.roomType);
        return ['all', ...new Set(types)];
    }, [rooms]);

    // 3) 필터 적용된 방 목록
    const filteredRooms = useMemo(() => {
        if (filterType === 'all') return rooms;
        return rooms.filter(r => r.roomType === filterType);
    }, [rooms, filterType]);






    return (
    <div className="w-1/3 border-r p-4 overflow-y-auto bg-white">
        <h2 className="text-xl font-semibold mb-2">채팅방 목록</h2>

        {/* 필터 버튼 그룹 */}
        <div className="flex space-x-2 mb-4">
            {typeOptions.map(type => (
                <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`
              px-3 py-1 border rounded
              ${filterType === type ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}
            `}
                >
                    {type === 'all' ? '전체' : type}
                </button>
            ))}
        </div>


        {error && <p className="text-red-500 mb-2">에러: {error.message}</p>}
        {loading && <p className="text-gray-500 mb-2">로딩 중...</p>}


        {/* 필터 적용된 목록 렌더링 */}
        {filteredRooms.length > 0 ? (
            filteredRooms.map(room => (
                <div
                    key={room._id}
                    onClick={() => setSelectedRoom(room)}
                    className={`p-2 mb-2 rounded cursor-pointer ${
                        selectedRoom?._id === room._id
                            ? 'bg-blue-100'
                            : 'hover:bg-gray-100'
                    }`}
                >
                    <p className="text-sm text-gray-600">방 ID: {room._id}</p>
                    <p className="text-sm text-gray-600">타입: {room.roomType}</p>
                    {/* 참여자 닉네임 목록 (성별 선택 정보 포함) */}
                    {Array.isArray(room.chatUsersWithGender || room.chatUsers) && (room.chatUsersWithGender || room.chatUsers).length > 0 && (
                        <p className="text-sm text-gray-600">
                            참여자:{" "}
                            {(room.chatUsersWithGender || room.chatUsers)
                                .map(u => {
                                    // 🔧 성별 선택 정보가 없으면 방의 matchedGender 사용
                                    const userGender = u.selectedGender || room.matchedGender || 'any';
                                    
                                    const genderText = userGender === 'opposite' ? '이성' 
                                          : userGender === 'same' ? '동성'
                                          : userGender === 'any' ? '상관없음'
                                          : '알 수 없음';
                                    
                                    const displayName = u.nickname && u.name
                                        ? `${u.nickname}(${u.name})`
                                        : u.nickname || u.name || u._id;
                                    
                                    return `${displayName}(${genderText})`;
                                })
                                .join(", ")}
                        </p>
                    )}
                    {/* 생성 일자 추가 */}
                    {room.createdAt && (
                        <p className="text-xs text-gray-500">
                            생성일: {new Date(room.createdAt).toLocaleString()}
                        </p>
                    )}
                    {room.closedAt && (
                        <p className="text-xs text-gray-500">
                            종료일: {new Date(room.closedAt).toLocaleString()}
                        </p>
                    )}
                </div>
            ))
        ) : (
            <p className="text-gray-500">회원 선택 후 방 목록이 표시됩니다</p>
        )}

        {/* 페이징 UI */}
        {pagination && pagination.totalCount > pagination.size && (
            <div className="mt-4 flex justify-center space-x-2">
                {pagination.prev && (
                    <button
                        onClick={() => setPage(pagination.prevPage)}
                        className="px-2 py-1 border rounded hover:bg-gray-100"
                    >
                        이전
                    </button>
                )}
                {pagination.pageNumList.map(num => (
                    <button
                        key={num}
                        onClick={() => setPage(num)}
                        className={`px-2 py-1 border rounded hover:bg-gray-100 ${
                            pagination.current === num ? 'bg-blue-500 text-white' : ''
                        }`}
                    >
                        {num}
                    </button>
                ))}
                {pagination.next && (
                    <button
                        onClick={() => setPage(pagination.nextPage)}
                        className="px-2 py-1 border rounded hover:bg-gray-100"
                    >
                        다음
                    </button>
                )}
            </div>
        )}
    </div>
    );
};

export default ChatRoomListPanel;
