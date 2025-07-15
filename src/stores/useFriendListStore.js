// src/stores/useFriendListStore.js
import { create } from 'zustand';

const useFriendListStore = create((set) => ({
    friends: [],

    setFriends: (list) => set({ friends: list }),

    addFriend: (friend) =>
        set((state) => {
            if (!friend || !friend._id) return state;        // ← null-guard
            const exists = state.friends.some((f) => f._id === friend._id);
            return exists ? state : { friends: [...state.friends, friend] };
        }),


    removeFriend: (id) =>
        set((state) => ({
            friends: state.friends.filter((f) => f._id !== id),
        })),
}));

export default useFriendListStore;
