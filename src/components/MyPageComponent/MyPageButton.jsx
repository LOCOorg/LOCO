// src/components/MyPageComponent/MyPageButton.jsx
import { useNavigate } from 'react-router-dom';

const MyPageButton = () => {
    const navigate = useNavigate();

    const goToMyPage = () => {
        navigate('/mypage');
    };

    return (
        <button
            onClick={goToMyPage}
            className="mt-6 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
            마이페이지로 이동
        </button>
    );
};

export default MyPageButton;
