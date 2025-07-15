// src/components/FriendChatDropdown.jsx
import {useState, useEffect, useContext, useRef} from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import useFriendChatStore from '../../stores/useFriendChatStore';
import { NotificationContext } from '../../hooks/NotificationContext';
import { fetchChatRooms } from '../../api/chatAPI';
import DropdownTransition from '../../layout/css/DropdownTransition.jsx';


const FriendChatDropdown = () => {
    const { user } = useAuthStore();
    const { openFriendChat } = useFriendChatStore();
    const { notifications, removeNotification } = useContext(NotificationContext);
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [friendRooms, setFriendRooms] = useState([]);


    const dropdownRef = useRef(null);
    // ② 알림 외부 클릭 감지용 useEffect -> 내부 눌러도
    useEffect(() => {
        if (!showDropdown) return;

        const handleClickOutside = (e) => {
            // ref.current가 정의되어 있고, 클릭한 타겟이 그 영역 안에 없으면
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        // 드롭다운이 열렸을 때만 리스너 등록
        if (showDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showDropdown]);



    useEffect(() => {
        if (!user?._id) return;
        (async () => {
            try {
                const rooms = await fetchChatRooms({ roomType: 'friend' });
                const mapped = rooms.map(room => {
                    const other = room.chatUsers.find(u => u._id !== user._id);
                    return { roomId: room._id, friend: other };
                });
                setFriendRooms(mapped);
            } catch (e) {
                console.error('친구 채팅방 조회 실패', e);
            }
        })();
    }, [user]);

    const handleRequestClick = (idx) => {
        removeNotification(idx);
        navigate('/mypage');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {(notifications.length > 0 || friendRooms.length > 0) && (
                <button
                    onClick={() => setShowDropdown(prev => !prev)}
                    className="py-1 px-3 bg-green-500 hover:bg-green-600 rounded text-sm"
                >
                    친구
                </button>
            )}
            <DropdownTransition
                show={showDropdown}
                as="div"
                className="absolute top-full right-0 mt-2 w-60 max-h-72 overflow-y-auto bg-white text-black rounded shadow-lg z-50"
            >
                    {/* 친구 요청 섹션 */}
                    <div className="px-4 py-2 border-b font-medium">친구 요청</div>
                    {notifications.length > 0 ? (
                        notifications.map((n, idx) => (
                            <div
                                key={idx}
                                onClick={() => handleRequestClick(idx)}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                                {n.message}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-2 text-gray-500">새로운 요청이 없습니다.</div>
                    )}
                    {/* 채팅방 섹션 */}
                    <div className="px-4 py-2 border-t border-b font-medium">친구 채팅</div>
                    {friendRooms.length > 0 ? (
                        friendRooms.map(({ roomId, friend }) => (
                            <div
                                key={roomId}
                                onClick={() => openFriendChat({ roomId, friend })}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                                {friend.nickname || friend.name}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-2 text-gray-500">채팅방이 없습니다.</div>
                    )}
            </DropdownTransition>
        </div>
    );
};

export default FriendChatDropdown;