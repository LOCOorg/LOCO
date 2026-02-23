// src/common/KakaoLoginButton.jsx

const KakaoLoginButton = ({ className, iconColor, textColor, customText }) => {
    // 테스트용 REST API 키와 리다이렉트 URI (실제 배포시 환경변수로 관리)
    const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
    // 리다이렉트 URI는 OAuth 콜백 컴포넌트에서 처리할 경로입니다.
    const REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI;

    // 카카오 로그인 인증 URL 구성
    const kakaoLoginUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}`;
    const defaultClassName = "inline-block px-6 py-3 bg-blue-500 text-white text-lg rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500";
    const buttonText = customText || "카카오 로그인";

    return (
        // <a> 태그를 사용해 클릭 시 카카오 로그인 페이지로 이동 (버튼 스타일 적용)
        <a
            href={kakaoLoginUrl}
            className={className || defaultClassName}
            style={textColor ? { color: textColor } : {}}
        >
            {buttonText}
        </a>
    );
};

export default KakaoLoginButton;
