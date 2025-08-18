// src/stores/notificationStore.js
import { create } from 'zustand';
import { updateUserPrefs } from "../api/userAPI.js";
import useAuthStore from "./authStore.js";
import { setEncryptedItem, getDecryptedItem, removeEncryptedItem } from '../utils/storageUtils.js';

const useNotificationStore = create((set, get) => ({
    // localStorage에서 암호화된 알림 복원
    notifications: (() => {
        try {
            const stored = getDecryptedItem('notifications');
            if (!stored) return [];

            const now = Date.now();
            // 24시간 이상 된 알림 제거
            return stored.filter(n => now - n.timestamp < 24 * 60 * 60 * 1000);
        } catch {
            return [];
        }
    })(),

    addNotification: (notification) => {
        const newNotification = {
            ...notification,
            timestamp: Date.now()
        };

        set((state) => {
            const newNotifications = [...state.notifications, newNotification];
            // 암호화하여 저장
            setEncryptedItem('notifications', newNotifications);
            return { notifications: newNotifications };
        });
    },

    removeNotification: (id) =>
        set((state) => {
            const newNotifications = state.notifications.filter((n) => n.id !== id);
            setEncryptedItem('notifications', newNotifications);
            return { notifications: newNotifications };
        }),

    removeNotificationsByRoom: (chatRoomId) =>
        set((state) => {
            const newNotifications = state.notifications.filter(
                (n) => n.chatRoom !== chatRoomId
            );
            setEncryptedItem('notifications', newNotifications);
            return { notifications: newNotifications };
        }),

    clearNotifications: () => {
        set({ notifications: [] });
        removeEncryptedItem('notifications');
    },

    cleanupOldNotifications: () => {
        set((state) => {
            const now = Date.now();
            const newNotifications = state.notifications.filter(
                n => now - n.timestamp < 24 * 60 * 60 * 1000
            );
            setEncryptedItem('notifications', newNotifications);
            return { notifications: newNotifications };
        });
    },

    // 기존 설정들도 암호화 적용
    friendReqEnabled: (() => {
        const stored = getDecryptedItem('friendReqEnabled');
        return stored !== null ? stored : true;
    })(),

    async toggleFriendReq() {
        const next = !get().friendReqEnabled;
        set({ friendReqEnabled: next });
        setEncryptedItem('friendReqEnabled', next);

        const userId = useAuthStore.getState().user?._id;
        if (userId) await updateUserPrefs(userId, { friendReqEnabled: next });
    },

    toastEnabled: (() => {
        const stored = getDecryptedItem('toastEnabled');
        return stored !== null ? stored : true;
    })(),

    async toggleToast() {
        const next = !get().toastEnabled;
        set({ toastEnabled: next });
        setEncryptedItem('toastEnabled', next);

        const userId = useAuthStore.getState().user?._id;
        if (userId) await updateUserPrefs(userId, { toastEnabled: next });
    },
}));

export default useNotificationStore;
