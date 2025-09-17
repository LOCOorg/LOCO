// src/stores/authStore.js
import { create } from 'zustand';

const useAuthStore = create((set) => ({
    user: undefined,
    isLoading: true,
    // 메모리에 저장할 Access Token
    accessToken: null,

    setUser: (updater) => set((state) => ({ user: typeof updater === 'function' ? updater(state.user) : updater, isLoading: false })),
    setAccessToken: (token) => set({ accessToken: token }),
    logout: () => set({ user: null, accessToken: null}),
}));

export default useAuthStore;
