import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo } from "../api/userAPI";
import { createFriendRoom, fetchChatRooms, joinChatRoom } from "../api/chatAPI";

function MainComponent() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [friends, setFriends] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [loading, setLoading] = useState(true); // 로딩 상태

    // 사용자 ID 상수로 정의
    const userId = "67bc2846c9d62c1110715d89"; // 실제 사용자 ID를 설정하세요.

    // 유저와 친구 목록 가져오기
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userData = await getUserInfo(userId);
                setUser(userData);

                // 친구 ID를 기반으로 친구 정보 가져오기
                const friendsData = await Promise.all(
                    userData.friends.map(async (friendId) => {
                        const friendInfo = await getUserInfo(friendId);
                        return friendInfo;
                    })
                );
                console.log("친구 데이터:", friendsData); // 친구 데이터 콘솔 출력
                setFriends(friendsData);
            } catch (error) {
                console.error("유저 정보를 불러오는 데 실패했습니다.", error);
            } finally {
                setLoading(false); // 로딩 상태 종료
            }
        };

        fetchUserData();
    }, []);

    // 친구 선택 시 friend 객체 콘솔 출력
    const handleFriendSelect = async (friend) => {
        console.log("선택된 친구:", friend); // 선택된 친구 객체 콘솔 출력
        setSelectedFriend(friend);
        try {
            const friendId = friend._id; // 친구의 사용자 ID

            // 이미 친구와 참여 중인 채팅방이 있는지 확인
            const chatRooms = await fetchChatRooms();
            console.log("채팅방 목록:", chatRooms);

            // roomType이 'friend'인 채팅방만 필터링
            const friendChatRooms = chatRooms.filter((room) => room.roomType === "friend");

            // 친구와 내가 이미 포함된 'friend' 타입 채팅방을 찾음
            const existingRoom = friendChatRooms.find((room) => {
                if (!room.chatUsers) return false; // chatUsers가 없으면 제외

                const userIds = room.chatUsers.map(user => user._id);
                return userIds.includes(userId) && userIds.includes(friendId);
            });

            if (existingRoom) {
                console.log("기존 채팅방으로 이동:", existingRoom);
                navigate(`/chat/${existingRoom._id}`);
            } else {
                const roomType = "friend";
                const capacity = 2;
                let room = await createFriendRoom(roomType, capacity);
                room = { ...room, chatUsers: [userId, friendId] };

                await joinChatRoom(room._id, userId);
                await joinChatRoom(room._id, friendId);

                console.log("새로 생성된 채팅방 정보:", room);
                navigate(`/chat/${room._id}`);
            }
        } catch (error) {
            console.error("채팅방 처리 실패:", error);
        }
    };

    const handleNavigate = () => {
        navigate("/chat");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-6">홈</h1>
            {loading ? (
                <p className="text-gray-500">로딩 중...</p>
            ) : (
                user && (
                    <div className="mb-6 p-4 bg-white shadow-md rounded-lg w-80">
                        <h2 className="text-2xl font-semibold text-gray-700">{user.nickname} 님</h2>
                        <p className="text-gray-600">친구 목록:</p>
                        <ul className="list-disc pl-5 text-gray-700">
                            {friends.length > 0 ? (
                                friends.map((friend, index) => (
                                    <li
                                        key={index}
                                        className="cursor-pointer text-blue-500 hover:text-blue-700"
                                        onClick={() => handleFriendSelect(friend)}
                                    >
                                        {friend.nickname} {friend.name} {/* 객체의 속성으로 접근 */}
                                    </li>
                                ))
                            ) : (
                                <p className="text-gray-500">친구가 없습니다.</p>
                            )}
                        </ul>
                    </div>
                )
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
