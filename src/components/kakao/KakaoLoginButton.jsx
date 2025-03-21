// src/common/KakaoLoginButton.jsx

const KakaoLoginButton = () => {
    // 테스트용 REST API 키와 리다이렉트 URI (실제 배포시 환경변수로 관리)
    const REST_API_KEY = '28995da84a2251bc62a0fbdde16a5f5e';
    // 리다이렉트 URI는 OAuth 콜백 컴포넌트에서 처리할 경로입니다.
    const REDIRECT_URI = 'http://localhost:5173/auth/callback';

    // 카카오 로그인 인증 URL 구성
    const kakaoLoginUrl = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}`;

    return (
        // <a> 태그를 사용해 클릭 시 카카오 로그인 페이지로 이동 (버튼 스타일 적용)
        <a
            href={kakaoLoginUrl}
            className="inline-block px-6 py-3 bg-blue-500 text-white text-lg rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
            카카오 로그인
        </a>
    );
};

export default KakaoLoginButton;
