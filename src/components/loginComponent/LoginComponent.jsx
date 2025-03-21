// src/components/loginComponent/LoginComponent.jsx

import KakaoLoginButton from "../kakao/KakaoLoginButton.jsx";
import NaverLoginButton from "../naver/NaverLoginButton.jsx";

const LoginComponent = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-6">로그인</h1>
            <div className="flex flex-col gap-4">
                <KakaoLoginButton />
                <NaverLoginButton />
            </div>
        </div>
    );
};

export default LoginComponent;
