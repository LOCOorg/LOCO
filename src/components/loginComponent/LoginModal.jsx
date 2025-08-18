// src/components/loginComponent/LoginModal.jsx

import React from 'react';
import { createPortal } from 'react-dom';
import KakaoLoginButton from "../kakao/KakaoLoginButton.jsx";
import NaverLoginButton from "../naver/NaverLoginButton.jsx";

const LoginModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 relative shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 닫기 버튼 */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* 로고 및 아이콘 */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                        <span className="text-white text-2xl font-bold">L</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-6 leading-relaxed">
                        로코에서 게임 메이트와 즐겁게 대화하여 둘<br />
                        만의 시간을 즐겨보세요!
                    </h2>
                </div>

                {/* 소셜 로그인 버튼들 */}
                <div className="space-y-4">
                    {/* 카카오 로그인 */}
                    <KakaoLoginButton 
                        className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-medium py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                        customText="카카오로 로그인"
                    />

                    {/* 네이버 로그인 */}
                    <NaverLoginButton 
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                        customText="네이버로 로그인"
                    />
                </div>
            </div>
        </div>,
        document.body
    );
};

export default LoginModal;
