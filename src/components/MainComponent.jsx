// MainComponent.jsx

import { useEffect, useState } from "react";
import { getUserInfo } from "../api/userAPI";
import { createFriendRoom, fetchChatRooms, joinChatRoom } from "../api/chatAPI";
import ChatOverlay from "./chatcomponents/ChatOverlay.jsx";
import { useNavigate } from "react-router-dom";

function MainComponent() {
    const [user, setUser] = useState(null);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chatRooms, setChatRooms] = useState([]);
    const [showMore, setShowMore] = useState(false);
    const navigate = useNavigate();
    const userId = "67bc2846c9d62c1110715d89";

    const MAX_CHAT_WINDOWS = 3;

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userData = await getUserInfo(userId);
                setUser(userData);

                const friendsData = await Promise.all(
                    userData.friends.map(async (friendId) => {
                        const friendInfo = await getUserInfo(friendId);
                        return friendInfo;
                    })
                );
                setFriends(friendsData);
            } catch (error) {
                console.error("유저 정보를 불러오는 데 실패했습니다.", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleFriendSelect = async (friend) => {
        try {
            const friendId = friend._id;
            const chatRoomsData = await fetchChatRooms();
            const friendChatRooms = chatRoomsData.filter(
                (room) => room.roomType === "friend"
            );
            const existingRoom = friendChatRooms.find((room) => {
                if (!room.chatUsers) return false;
                const userIds = room.chatUsers.map((user) => user._id);
                return userIds.includes(userId) && userIds.includes(friendId);
            });

            let newRoom;
            if (existingRoom) {
                newRoom = existingRoom;
            } else {
                const roomType = "friend";
                const capacity = 2;
                let room = await createFriendRoom(roomType, capacity);
                room = { ...room, chatUsers: [userId, friendId] };

                await joinChatRoom(room._id, userId);
                await joinChatRoom(room._id, friendId);

                newRoom = room;
            }
            setChatRooms((prevRooms) => {
                if (!prevRooms.some((room) => room.roomId === newRoom._id)) {
                    return [...prevRooms, { roomId: newRoom._id, friend }];
                }
                return prevRooms;
            });
        } catch (error) {
            console.error("채팅방 처리 실패:", error);
        }
    };

    const handleNavigate = () => {
        navigate("/chat");
    };

    // "더 보기" 버튼 토글
    const toggleShowMore = () => {
        setShowMore((prev) => !prev);
    };

    const visibleChatRooms = chatRooms.slice(0, MAX_CHAT_WINDOWS);
    const hiddenChatRooms = chatRooms.slice(MAX_CHAT_WINDOWS);

    // onClose 콜백: 해당 roomId의 채팅창 제거
    const handleCloseChat = (roomId) => {
        setChatRooms((prevRooms) => prevRooms.filter(room => room.roomId !== roomId));
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-6">홈</h1>
            {loading ? (
                <p className="text-gray-500">로딩 중...</p>
            ) : (
                user && (
                    <div className="mb-6 p-4 bg-white shadow-md rounded-lg w-80">
                        <h2 className="text-2xl font-semibold text-gray-700">
                            {user.nickname} 님
                        </h2>
                        <p className="text-gray-600">친구 목록:</p>
                        <ul className="list-disc pl-5 text-gray-700">
                            {friends.length > 0 ? (
                                friends.map((friend, index) => (
                                    <li
                                        key={index}
                                        className="cursor-pointer text-blue-500 hover:text-blue-700"
                                        onClick={() => handleFriendSelect(friend)}
                                    >
                                        {friend.nickname} {friend.name}
                                    </li>
                                ))
                            ) : (
                                <p className="text-gray-500">친구가 없습니다.</p>
                            )}
                        </ul>
                    </div>
                )
            )}

            {visibleChatRooms.map((room, index) => (
                <ChatOverlay
                    key={room.roomId}
                    roomId={room.roomId}
                    customStyle={{ right: 20 + index * 360 + "px" }}
                    onClose={handleCloseChat}
                />
            ))}

            {hiddenChatRooms.length > 0 && (
                <div
                    style={{
                        position: "fixed",
                        bottom: "20px",
                        right: 20 + MAX_CHAT_WINDOWS * 360 + "px",
                        zIndex: 1100,
                    }}
                >
                    <button
                        onClick={toggleShowMore}
                        style={{
                            padding: "10px 15px",
                            backgroundColor: "#0084ff",
                            color: "white",
                            border: "none",
                            cursor: "pointer",
                            borderRadius: "8px",
                            marginBottom: "5px",
                        }}
                    >
                        {showMore
                            ? "채팅 숨기기"
                            : `+${hiddenChatRooms.length}개의 채팅 더 보기`}
                    </button>

                    {showMore &&
                        hiddenChatRooms.map((room, idx) => (
                            <ChatOverlay
                                key={room.roomId}
                                roomId={room.roomId}
                                customStyle={{
                                    bottom: 60 + idx * 520 + "px",
                                    right: 20 + MAX_CHAT_WINDOWS * 360 + "px",
                                }}
                                onClose={handleCloseChat}
                            />
                        ))}
                </div>
            )}

            <button
                onClick={handleNavigate}
                className="px-6 py-3 bg-blue-500 text-white text-lg rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                채팅하러 가기
            </button>
        </div>
    );
}

export default MainComponent;
