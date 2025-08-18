// 파일 경로: src/components/naver/NaverLoginButton.jsx
// 네이버 로그인 버튼 컴포넌트

const NaverLoginButton = ({ className, iconColor, textColor, customText }) => {
    // 실제 클라이언트 ID로 교체하세요.
    const CLIENT_ID = '43hZkVrMUbaFIEUbgRCI';
    const REDIRECT_URI = 'http://localhost:5173/auth/naver/callback';
    // state는 CSRF 보호용으로, 실제 서비스에서는 보안에 맞게 랜덤 값을 생성하여 사용합니다.
    const state = 'randomState123'; //?
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
