// src/components/LogoutButton.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";
import { logoutAPI } from "../../api/authAPI";

export default function LogoutButton() {
    const navigate = useNavigate();
    const clearUser = useAuthStore((state) => state.logout);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        if (isLoggingOut) return; // 중복 클릭 방지
        
        try {
            setIsLoggingOut(true);
            console.log('로그아웃 버튼 클릭');
            
            // 1) ✅ 백엔드 로그아웃 API 호출 (네이버 연동해제 포함)
            console.log('네이버 연동해제 포함 로그아웃 요청 전송...');
            const response = await logoutAPI();
            console.log('네이버 연동해제 포함 로그아웃 성공:', response);
            
            // 2) 프론트엔드 상태 초기화
            clearUser();
            localStorage.clear();
            sessionStorage.clear();
            
            console.log('로그아웃 완료 - 메인 페이지로 이동');
            navigate('/');
            
        } catch (err) {
            console.error("로그아웃 처리 중 오류:", err);
            
            // 오류가 발생해도 프론트엔드 상태는 초기화
            clearUser();
            localStorage.clear();
            sessionStorage.clear();
            navigate('/');
            
        } finally {
            setIsLoggingOut(false);
            
            // 3) ✅ 카카오 로그아웃 처리도 유지 (기존 기능)
            const apiHost  = import.meta.env.VITE_API_HOST;
            const kakaoKey = import.meta.env.VITE_KAKAO_REST_API_KEY;

            console.log('카카오 로그아웃으로 리다이렉트');
            if (apiHost && kakaoKey) {
                const url = new URL("https://kauth.kakao.com/oauth/logout");
                url.searchParams.set("client_id", kakaoKey);
                url.searchParams.set("logout_redirect_uri", `${apiHost}/api/auth/logout-redirect`);
                window.location.assign(url.toString());
            } else {
                // 환경변수 미세팅 시에도 최소한 서버의 리다이렉트 엔드포인트로 이동
                window.location.assign(`${apiHost || ""}/api/auth/logout-redirect`);
            }
        }
    };
    
    return (
        <li className={`block px-4 py-2 hover:bg-gray-100 transition cursor-pointer ${
                isLoggingOut ? 'opacity-50 pointer-events-none' : ''
            }`}
            onClick={handleLogout}
        >
            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
        </li>
    );
}
