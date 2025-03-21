// src/components/PlanButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const PlanButton = () => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate('/products'); // 상품 진열 페이지로 이동
    };

    return (
        <button
            onClick={handleClick}
            className="mt-4 px-6 py-3 bg-indigo-500 text-white text-lg rounded-lg shadow-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
            플랜 보기
        </button>
    );
};

export default PlanButton;
