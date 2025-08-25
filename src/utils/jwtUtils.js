// src/utils/jwtUtils.js
/**
 * JWT 토큰을 디코딩하여 페이로드를 반환합니다.
 * @param {string} token - JWT 토큰
 * @returns {object|null} - 디코딩된 페이로드 또는 null
 */
export const decodeJWT = (token) => {
    try {
        if (!token) return null;
        
        // JWT는 header.payload.signature로 구성되어 있음
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        // payload 부분 (인덱스 1)을 base64 디코딩
        const payload = JSON.parse(atob(parts[1]));
        return payload;
    } catch (error) {
        console.error('JWT 디코딩 오류:', error);
        return null;
    }
};

/**
 * 사용자가 로그인한 소셜 서비스를 확인합니다.
 * @param {object} user - 사용자 객체
 * @returns {string} - 'kakao', 'naver', 또는 'unknown'
 */
export const getSocialLoginType = (user) => {
    if (!user) return 'unknown';
    
    // 사용자 객체에서 소셜 정보 확인
    if (user.social?.kakao?.providerId) {
        return 'kakao';
    }
    if (user.social?.naver?.providerId) {
        return 'naver';
    }
    
    return 'unknown';
};

/**
 * 소셜 서비스별 로그아웃 URL을 생성합니다.
 * @param {string} socialType - 'kakao' 또는 'naver'
 * @returns {string|null} - 로그아웃 URL 또는 null
 */
export const getSocialLogoutUrl = (socialType) => {
    const apiHost = import.meta.env.VITE_API_HOST;
    
    switch (socialType) {
        case 'kakao': {
            const kakaoKey = import.meta.env.VITE_KAKAO_REST_API_KEY;
            if (!kakaoKey) return null;
            
            const url = new URL("https://kauth.kakao.com/oauth/logout");
            url.searchParams.set("client_id", kakaoKey);
            url.searchParams.set("logout_redirect_uri", `${apiHost}/api/auth/logout-redirect`);
            return url.toString();
        }
        case 'naver': {
            // 네이버는 카카오와 달리 직접적인 로그아웃 URL이 없음
            // 대신 세션을 무효화하고 우리 서버로 리다이렉트
            return `${apiHost}/api/auth/logout-redirect`;
        }
        default:
            return null;
    }
};
