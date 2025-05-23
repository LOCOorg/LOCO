// src/stores/authStore.js
import { create } from 'zustand';

const useAuthStore = create((set) => ({
    user: undefined,
    setUser: (user) => set({ user }),
    logout: () => set({ user: null }),
}));

export default useAuthStore;
