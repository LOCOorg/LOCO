// src/store/authStore.js
import { create } from 'zustand';

const useAuthStore = create((set) => ({
    // 전역 상태: 로그인한 사용자 정보와 JWT 토큰
    user: null,
    token: null,

    // 로그인 상태 업데이트 함수
    setUser: (user) => set({ user }),
    setToken: (token) => set({ token }),

    // 로그아웃 함수: 사용자 정보와 토큰을 초기화
    logout: () => set({ user: null, token: null }),
}));

export default useAuthStore;
