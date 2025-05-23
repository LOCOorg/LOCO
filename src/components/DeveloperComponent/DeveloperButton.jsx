// src/components/ProfileAccessButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const PRButton = () => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate('/developer'); // 라우터 등록한 경로
    };

    return (
        <button
            onClick={handleClick}
            className="mt-4 px-6 py-3 bg-indigo-500 text-white text-lg rounded-lg shadow-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
            개발자 페이지
        </button>
    );
};

export default PRButton;
