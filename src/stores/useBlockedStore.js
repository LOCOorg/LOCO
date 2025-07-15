import { create } from 'zustand';

const useBlockedStore = create((set) => ({
    blockedUsers: [],                             // 차단 목록
    setBlockedUsers: (list) => set({ blockedUsers: list }),
    addBlockedUser: (user) =>
        set((state) => ({ blockedUsers: [...state.blockedUsers, user] })),
    removeBlockedUser: (userId) =>
        set((state) => ({
            blockedUsers: state.blockedUsers.filter((u) => u._id !== userId),
        })),
}));

export default useBlockedStore;
