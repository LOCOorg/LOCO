// src/stores/authStore.js
import { create } from 'zustand';
import { logoutAPI } from '../api/authAPI';
import { removeEncryptedItem } from '../utils/storageUtils.js';

// L-06 보안 조치: 로그아웃 시 삭제할 localStorage 키 목록
const STORAGE_KEYS_TO_CLEAR = [
    'notifications',
    'friendReqEnabled',
    'toastEnabled',
    'chatPreviewEnabled',
    'wordFilterEnabled',
    'friend-chat-storage',
];

const clearAuthStorage = () => {
    STORAGE_KEYS_TO_CLEAR.forEach(key => removeEncryptedItem(key));
    sessionStorage.clear();
};

const useAuthStore = create((set) => ({
    user: undefined,
    isLoading: true,
    // 메모리에 저장할 Access Token
    accessToken: null,

    setUser: (updater) => set((state) => ({ user: typeof updater === 'function' ? updater(state.user) : updater, isLoading: false })),

    setAccessToken: (token) => set({ accessToken: token }),

    logout: async  () => {
        try {
            // 1. 백엔드 로그아웃 API 호출 (네이버 연동해제 + 쿠키 삭제)
            await logoutAPI();

            // 2. 프론트엔드 상태 초기화
            clearAuthStorage();
            set({ user: null, accessToken: null, isLoading: false });
        } catch (error) {
            console.error('로그아웃 중 오류:', error);

            // 오류 발생해도 프론트엔드 상태는 초기화
            clearAuthStorage();
            set({ user: null, accessToken: null, isLoading: false });
        }
    },
}));

export default useAuthStore;
