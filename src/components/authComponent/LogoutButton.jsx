// src/components/LogoutButton.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/authStore";
import { logoutAPI } from "../../api/authAPI";
import { getSocialLoginType, getSocialLogoutUrl } from "../../utils/jwtUtils";
import { authInitRef } from "./AuthInit.jsx"; // AuthInit 리셋용

export default function LogoutButton() {
    const navigate = useNavigate();
    const { user, logout: clearUser } = useAuthStore();

    const handleLogout = async () => {
        console.log('로그아웃 버튼 클릭');
        
        // 현재 로그인된 소셜 서비스 확인
        const socialType = getSocialLoginType(user);
        console.log('감지된 소셜 로그인 타입:', socialType);
        
        try {
            // 1) 클라이언트 상태 먼저 정리
            clearUser();
            localStorage.clear();
            
            // 2) AuthInit 리셋 (중요!)
            authInitRef.triedOnce = false;
            console.log('✅ AuthInit 리셋 완료');
            
            // 3) 서버에 로그아웃 요청 (서버에서 쿠키 삭제)
            console.log('서버에 로그아웃 요청 전송');
            await logoutAPI();
            console.log('서버 로그아웃 요청 성공');
            
        } catch (err) {
            console.warn("POST /api/auth/logout 실패", err);
            // 서버 요청 실패해도 클라이언트 상태는 이미 정리됨
        } finally {
            if (socialType === 'kakao') {
                // 카카오는 소셜 로그아웃 URL로 리다이렉트
                const logoutUrl = getSocialLogoutUrl(socialType);
                
                console.log(`${socialType} 로그아웃으로 리다이렉트`);
                if (logoutUrl) {
                    window.location.assign(logoutUrl);
                } else {
                    // 로그아웃 URL 생성 실패 시 기본 리다이렉트
                    const apiHost = import.meta.env.VITE_API_HOST;
                    window.location.assign(`${apiHost || ""}/api/auth/logout-redirect`);
                }
            } else if (socialType === 'naver') {
                // 네이버는 백엔드에서 토큰 삭제 처리가 완료되었으므로 바로 메인 페이지로 이동
                console.log('✅ 네이버 로그아웃 완료 - 서버에서 토큰 삭제 처리 완료');
                console.log('✅ 다음 네이버 로그인 시 아이디/비밀번호 입력 필요');
                navigate('/');
            } else {
                // 소셜 로그인이 아닌 경우 메인 페이지로 이동
                console.log('일반 로그아웃 완료, 메인 페이지로 이동');
                navigate('/');
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
