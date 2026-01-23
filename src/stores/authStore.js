// src/stores/authStore.js
import { create } from 'zustand';
import { logoutAPI } from '../api/authAPI';

const useAuthStore = create((set) => ({
    user: undefined,
    isLoading: true,
    // 메모리에 저장할 Access Token
    accessToken: null,

    setUser: (updater) => set((state) => ({ user: typeof updater === 'function' ? updater(state.user) : updater, isLoading: false })),

    setAccessToken: (token) => set({ accessToken: token }),

    logout: async  () => {
        try {
            console.log('🔴 로그아웃 시작...');

            // 1. 백엔드 로그아웃 API 호출 (네이버 연동해제 + 쿠키 삭제)
            await logoutAPI();
            console.log('✅ 백엔드 로그아웃 완료');

            // 2. 프론트엔드 상태 초기화
            localStorage.clear();
            sessionStorage.clear();
            set({ user: null, accessToken: null, isLoading: false });

            console.log('✅ 로그아웃 완료');
        } catch (error) {
            console.error('❌ 로그아웃 중 오류:', error);

            // 오류 발생해도 프론트엔드 상태는 초기화
            localStorage.clear();
            sessionStorage.clear();
            set({ user: null, accessToken: null, isLoading: false });
        }
    },
}));

export default useAuthStore;
