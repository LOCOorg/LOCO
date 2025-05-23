// src/components/LogoutButton.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";
import { logoutAPI } from "../../api/authAPI";

export default function LogoutButton() {
    const navigate = useNavigate();
    const clearUser = useAuthStore((state) => state.logout);

    const handleLogout = async () => {
        try {
            // 1) 카카오 계정 로그아웃 (kauth.kakao.com 세션 쿠키 삭제)
            const kakaoLogoutUrl = new URL("https://kauth.kakao.com/oauth/logout");
            kakaoLogoutUrl.searchParams.set(
                "client_id",
                import.meta.env.VITE_KAKAO_REST_API_KEY
            );
            // 백엔드 로그아웃 중계 엔드포인트만 지정 (쿼리 없이)
            kakaoLogoutUrl.searchParams.set(
                "logout_redirect_uri",
                `${import.meta.env.VITE_API_HOST}/api/auth/logout-redirect`
            );

            // 브라우저 네비게이션으로 카카오 로그아웃 호출
            window.location.href = kakaoLogoutUrl.toString();
        } catch (error) {
            console.error("카카오 로그아웃 네비게이션 실패:", error);

            // 2) fallback: 우리 서버 세션 로그아웃(쿠키 삭제)
            try {
                await logoutAPI();
            } catch (err) {
                console.error("로그아웃 API 호출 실패:", err);
            }

            // 3) 클라이언트 상태 초기화 및 리다이렉트
            clearUser();
            navigate("/");
        }
    };

    return (
        <button
            onClick={handleLogout}
        >
            로그아웃
        </button>
    );
}
