// src/hooks/useTokenExpiry.js
import { useEffect } from 'react';
import useAuthStore from '../../stores/authStore.js';
import { refresh } from '../../api/authAPI';

/**
 * JWT 토큰 만료 감지 및 자동 갱신/로그아웃
 */
export const useTokenExpiry = () => {
    // user?._id만 구독하여 프로필 수정 시 타이머가 리셋되지 않도록 함
    const userId = useAuthStore((state) => state.user?._id);
    const logout = useAuthStore((state) => state.logout);

    useEffect(() => {
        if (!userId) return;

        // 14분마다 토큰 갱신 시도 (access token 만료 15분)
        const intervalId = setInterval(async () => {
            try {
                console.log('🔄 토큰 갱신 시도...');
                await refresh();
                console.log('✅ 토큰 갱신 성공');
            } catch (error) {
                console.error('❌ 토큰 갱신 실패 - 자동 로그아웃:', error);
                logout();
            }
        }, 14 * 60 * 1000); // 14분

        return () => clearInterval(intervalId);
    }, [userId, logout]);
};