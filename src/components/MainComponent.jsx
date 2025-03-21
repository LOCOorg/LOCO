// MainComponent.jsx

import { useEffect, useState } from "react";
import { getUserInfo } from "../api/userAPI";
import { createFriendRoom, fetchChatRooms, joinChatRoom } from "../api/chatAPI";
import ChatOverlay from "./chatcomponents/ChatOverlay.jsx";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/authStore.js";
import PlanButton from "./product/PlanButton.jsx";

function MainComponent() {
    const [user, setUser] = useState(null);
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chatRooms, setChatRooms] = useState([]);
    const [showMore, setShowMore] = useState(false);
    const navigate = useNavigate();
    // const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
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

    const handleNavigateLogin = () => {
        if (user) {
            // 로그인 상태이면 로그아웃 처리 후 로그인 페이지로 이동
            logout();
            navigate("/loginPage");
        } else {
            // 로그인 상태가 아니면 로그인 페이지로 이동
            navigate("/loginPage");
        }
    };
    const handleProductRegistration = () => {
        navigate("/adminproducts");
    };

    const handleCommunity = () => {
        navigate("/community");
    }

    // "더 보기" 버튼 토글
    const toggleShowMore = () => {
        setShowMore((prev) => !prev);
    };

    // visible: 최대 MAX_CHAT_WINDOWS개의 채팅창, hidden: 나머지 채팅
    const visibleChatRooms = chatRooms.slice(0, MAX_CHAT_WINDOWS);
    const hiddenChatRooms = chatRooms.slice(MAX_CHAT_WINDOWS);

    // onClose 콜백: 해당 roomId의 채팅창 제거
    const handleCloseChat = (roomId) => {
        setChatRooms((prevRooms) => prevRooms.filter(room => room.roomId !== roomId));
    };

    // hidden 영역의 채팅 아이콘 클릭 시, visible 영역의 가장 왼쪽 채팅을 제거하고
    // 선택한 hidden 채팅을 visible 영역의 마지막 자리에 넣어 순환 교환합니다.
    const handleSwapChat = (selectedRoomId) => {
        setChatRooms((prevRooms) => {
            // 순환 교환은 hidden 채팅이 존재할 때만 처리
            if (prevRooms.length <= MAX_CHAT_WINDOWS) return prevRooms;
            const newRooms = [...prevRooms];
            // visible 영역의 가장 왼쪽 채팅 제거
            const removedVisible = newRooms.shift();

            // 기존 배열에서 선택한 hidden 채팅의 인덱스 찾기
            const selectedIndex = newRooms.findIndex(room => room.roomId === selectedRoomId);
            if (selectedIndex === -1) return prevRooms;

            // 선택한 hidden 채팅 제거
            const [selectedRoom] = newRooms.splice(selectedIndex, 1);

            // visible 영역은 newRooms[0 ~ MAX_CHAT_WINDOWS-1] (현재 newRooms의 길이는 MAX_CHAT_WINDOWS-1)
            // 선택한 hidden 채팅을 visible의 마지막 자리에 삽입
            newRooms.splice(MAX_CHAT_WINDOWS - 1, 0, selectedRoom);

            // 제거된 visible 채팅을 hidden 영역의 마지막에 추가
            newRooms.push(removedVisible);

            return newRooms;
        });
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

            {/* 현재 보이는 채팅창 */}
            {visibleChatRooms.map((room, index) => (
                <ChatOverlay
                    key={room.roomId}
                    roomId={room.roomId}
                    customStyle={{right: 20 + index * 360 + "px"}}
                    onClose={handleCloseChat}
                    friend={room.friend} // friend 정보를 전달
                />
            ))}

            {/* 더 보기 영역: 아이콘 목록으로 표시 */}
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
                            : `+${hiddenChatRooms.length}개의 채팅`}
                    </button>

                    {showMore &&
                        hiddenChatRooms.map((room) => (
                            <button
                                key={room.roomId}
                                onClick={() => handleSwapChat(room.roomId)}
                                style={{
                                    display: "block",
                                    margin: "5px 0",
                                    padding: "5px",
                                    backgroundColor: "#eee",
                                    border: "1px solid #ccc",
                                    borderRadius: "50%",
                                    width: "40px",
                                    height: "40px",
                                    textAlign: "center",
                                    cursor: "pointer",
                                }}
                                title={room.friend ? room.friend.nickname || room.friend.name : "채팅"}
                            >
                                {room.friend && room.friend.nickname
                                    ? room.friend.nickname[0]
                                    : "채팅"}
                            </button>
                        ))}
                </div>
            )}

            <button
                onClick={handleNavigate}
                className="px-6 py-3 bg-blue-500 text-white text-lg rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                채팅하러 가기
            </button>
            <button
                onClick={handleCommunity}
                className="px-6 py-3 bg-green-500 text-white text-lg rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                커뮤니티
            </button>
            <button
                onClick={handleNavigateLogin}
                className="mt-4 px-6 py-3 bg-purple-500 text-white text-lg rounded-lg shadow-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
                {user ? "로그아웃" : "로그인"}
            </button>
            <button
                onClick={handleProductRegistration}
                className="mt-4 px-6 py-3 bg-green-500 text-white text-lg rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
                상품등록
            </button>
            <PlanButton />  {/* productShowcase 플랜 버튼 추가 */}

        </div>
    );
}

export default MainComponent;
