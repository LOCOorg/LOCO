// src/components/LogoutButton.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";
import { logoutAPI } from "../../api/authAPI";

export default function LogoutButton() {
    const navigate = useNavigate();
    const clearUser = useAuthStore((state) => state.logout);

    const handleLogout = async () => {
        console.log('로그아웃 버튼 클릭');
        
        try {
            // 1) 클라이언트 상태 먼저 정리
            clearUser();
            
            // 2) 서버에 로그아웃 요청 (서버에서 쿠키 삭제)
            console.log('서버에 로그아웃 요청 전송');
            await logoutAPI();
            console.log('서버 로그아웃 요청 성공');
            
        } catch (err) {
            console.warn("POST /api/auth/logout 실패", err);
        } finally {
            // 3) 카카오 로그아웃으로 이동 → 우리 서버의 /logout-redirect에서 쿠키 재삭제(세이프가드)
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
        <li className="block px-4 py-2 hover:bg-gray-100 transition cursor-pointer"
            onClick={handleLogout}
        >
            로그아웃
        </li>
    );
}
