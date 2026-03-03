// 파일 경로: src/components/naver/NaverLoginButton.jsx
// 네이버 로그인 버튼 컴포넌트

const NaverLoginButton = ({ className, iconColor, textColor, customText }) => {
    const CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID;
    const REDIRECT_URI = import.meta.env.VITE_NAVER_REDIRECT_URI;

    const defaultClassName = "inline-block px-6 py-3 bg-green-500 text-white text-lg rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500";
    const buttonText = customText || "네이버 로그인";

    // H-08 보안 조치: crypto.randomUUID()로 CSRF-safe state 생성 + sessionStorage 저장
    const handleLogin = (e) => {
        e.preventDefault();
        const state = crypto.randomUUID();
        sessionStorage.setItem('oauth_state', state);
        const naverLoginUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}`;
        window.location.href = naverLoginUrl;
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

export default NaverLoginButton;
