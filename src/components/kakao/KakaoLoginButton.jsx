// src/common/KakaoLoginButton.jsx

const KakaoLoginButton = ({ className, iconColor, textColor, customText }) => {
    const REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
    const REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;

    const defaultClassName = "inline-block px-6 py-3 bg-blue-500 text-white text-lg rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500";
    const buttonText = customText || "카카오 로그인";

    // H-08 보안 조치: 클릭 시 state 생성 + sessionStorage 저장 후 리다이렉트
    const handleLogin = (e) => {
        e.preventDefault();
        const state = crypto.randomUUID();
        sessionStorage.setItem('oauth_state', state);
        const kakaoLoginUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&state=${state}`;
        window.location.href = kakaoLoginUrl;
    };

    return (
        <a
            href="#"
            onClick={handleLogin}
            className={className || defaultClassName}
            style={textColor ? { color: textColor } : {}}
        >
            {buttonText}
        </a>
    );
};

export default KakaoLoginButton;
