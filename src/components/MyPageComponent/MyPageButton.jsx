// src/components/MyPageComponent/MyPageButton.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { getFriendRequestList } from '../../api/userAPI';

const MyPageButton = () => {
    const navigate = useNavigate();
    const authUser = useAuthStore((state) => state.user);
    const [friendRequestCount, setFriendRequestCount] = useState(0);

    useEffect(() => {
        const fetchFriendRequests = async () => {
            if (authUser) {
                try {
                    const requests = await getFriendRequestList(authUser._id);
                    setFriendRequestCount(requests.length);
                } catch (error) {
                    console.error("친구 요청 목록을 불러오는 데 실패했습니다.", error);
                }
            }
        };

        fetchFriendRequests();

        // 친구 요청 목록이 업데이트될 여지가 있다면, 주기적으로 또는 소켓 이벤트로 업데이트할 수 있음.
    }, [authUser]);

    const goToMyPage = () => {
        navigate('/mypage');
    };

    return (
        <button
            onClick={goToMyPage}
            className="relative mt-6 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
            마이페이지로 이동
            {friendRequestCount > 0 && (
                <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                    {friendRequestCount}
                </span>
            )}
        </button>
    );
};

export default MyPageButton;
