// src/components/DeveloperComponent/chatcomponents/ChatRoomListPanel.jsx
import React from 'react';

const ChatRoomListPanel = ({
                               rooms,
                               pagination,
                               loading,
                               error,
                               page,
                               setPage,
                               selectedRoom,
                               setSelectedRoom
                           }) => (
    <div className="w-1/3 border-r p-4 overflow-y-auto bg-white">
        <h2 className="text-xl font-semibold mb-2">채팅방 목록</h2>
        {error && <p className="text-red-500 mb-2">에러: {error.message}</p>}
        {loading && <p className="text-gray-500 mb-2">로딩 중...</p>}
        {rooms.length > 0 ? (
            rooms.map(room => (
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
                    {/* 참여자 닉네임 목록 */}
                    {Array.isArray(room.chatUsers) && room.chatUsers.length > 0 && (
                    <p className="text-sm text-gray-600">
                        참여자:{" "}
                        {room.chatUsers
                        .map(u =>
                            u.nickname && u.name
                                ? `${u.nickname}(${u.name})`
                                : u.nickname
                                    ? u.nickname
                                    : u.name
                                        ? u.name
                                        : u._id
                        )         /* u가 객체면 u.nickname, 아니면 그냥 ID */
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

export default ChatRoomListPanel;
