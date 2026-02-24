// 파일 경로: src/components/naver/NaverLoginButton.jsx
// 네이버 로그인 버튼 컴포넌트

const NaverLoginButton = ({ className, iconColor, textColor, customText }) => {
    // 실제 클라이언트 ID로 교체하세요.
    const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
    const REDIRECT_URI = import.meta.env.VITE_NAVER_REDIRECT_URI;
    // ✅ State 동적 생성 - CSRF 보호 및 재로그인 시 새로운 세션 구분
    const generateState = () => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return `${timestamp}_${random}`;
    };
    
    const state = generateState();
    const naverLoginUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}`;

    const defaultClassName = "inline-block px-6 py-3 bg-green-500 text-white text-lg rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500";
    const buttonText = customText || "네이버 로그인";

    return (
        <a
            href={naverLoginUrl}
            className={className || defaultClassName}
            style={textColor ? { color: textColor } : {}}
        >
            {buttonText}
        </a>
    );
};

export default NaverLoginButton;
