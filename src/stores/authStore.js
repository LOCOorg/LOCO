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
    logout: async () => {
        try {
            await logoutAPI(); // 서버 로그아웃 (쿠키 삭제)
        } catch (error) {
            console.error('Logout API failed:', error);
        } finally {
            localStorage.clear();
            sessionStorage.clear();
            set({ user: null, accessToken: null, isLoading: false });
            window.location.reload(); // 필요하다면 추가
        }
    },
}));

export default useAuthStore;
