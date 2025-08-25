// src/stores/authStore.js
import { create } from 'zustand';

const useAuthStore = create((set) => ({
    user: undefined,
    isLoading: true,
    // 메모리에 저장할 Access Token
    accessToken: null,

    setUser: (user) => set({ user, isLoading: false }),
    setAccessToken: (token) => set({ accessToken: token }),
    logout: () => set({ user: null, accessToken: null, isLoading: false }),
}));

export default useAuthStore;
