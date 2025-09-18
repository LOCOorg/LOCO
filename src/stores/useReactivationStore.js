import { create } from 'zustand';

const useReactivationStore = create((set) => ({
    isReactivationNeeded: false,
    reactivationUser: null,
    socialLoginData: null,
    triggerReactivation: (user, socialData) => set({ isReactivationNeeded: true, reactivationUser: user, socialLoginData: socialData }),
    clearReactivation: () => set({ isReactivationNeeded: false, reactivationUser: null, socialLoginData: null }),
}));

export default useReactivationStore;
