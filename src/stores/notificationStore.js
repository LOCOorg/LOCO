// 채팅 알림 전역상태 관리
import { create } from 'zustand';
import {updateUserPrefs} from "../api/userAPI.js";
import useAuthStore from "./authStore.js";

const useNotificationStore = create((set, get) => ({
// localStorage에서 알림 복원 (만료된 알림 제거)
    notifications: (() => {
        try {
            const stored = localStorage.getItem('notifications');
            if (!stored) return [];

            const notifications = JSON.parse(stored);
            const now = Date.now();
            // 24시간 이상 된 알림 제거
            return notifications.filter(n => now - n.timestamp < 24 * 60 * 60 * 1000);
        } catch {
            return [];
        }
    })(),
    addNotification: (notification) => {
        const newNotification = {
            ...notification,
            timestamp: Date.now() // 타임스탬프 추가
        };

        set((state) => {
            const newNotifications = [...state.notifications, newNotification];
            // localStorage에 저장
            localStorage.setItem('notifications', JSON.stringify(newNotifications));
            return { notifications: newNotifications };
        });
    },
    removeNotification: (id) =>
        set((state) => {
            const newNotifications = state.notifications.filter((n) => n.id !== id);
            localStorage.setItem('notifications', JSON.stringify(newNotifications));
            return { notifications: newNotifications };
        }),

    removeNotificationsByRoom: (chatRoomId) =>
        set((state) => {
            const newNotifications = state.notifications.filter(
                (n) => n.chatRoom !== chatRoomId
            );
            localStorage.setItem('notifications', JSON.stringify(newNotifications));
            return { notifications: newNotifications };
        }),

    clearNotifications: () => {
        set({ notifications: [] });
        localStorage.removeItem('notifications');
    },
    // 스토어에 추가
    cleanupOldNotifications: () => {
        set((state) => {
            const now = Date.now();
            const newNotifications = state.notifications.filter(
                n => now - n.timestamp < 24 * 60 * 60 * 1000 // 24시간
            );
            localStorage.setItem('notifications', JSON.stringify(newNotifications));
            return { notifications: newNotifications };
        });
    },
    /* 🎛️ 친구 요청 허용 */
    friendReqEnabled: JSON.parse(localStorage.getItem('friendReqEnabled') ?? 'true'),
    async toggleFriendReq() {
        const next = !get().friendReqEnabled;
        set({ friendReqEnabled: next });
        localStorage.setItem('friendReqEnabled', JSON.stringify(next));

        /* 서버-동기화 */
        const userId = useAuthStore.getState().user?._id;
        if (userId) await updateUserPrefs(userId, { friendReqEnabled: next });
    },

    /* ✅ 토스트 사용 여부 */
    toastEnabled: JSON.parse(localStorage.getItem('toastEnabled') ?? 'true'),

    async toggleToast() {
        const next = !get().toastEnabled;
        set({ toastEnabled: next });
        localStorage.setItem('toastEnabled', JSON.stringify(next));

        const userId = useAuthStore.getState().user?._id;
        if (userId) await updateUserPrefs(userId, { toastEnabled: next });
    },
}));

export default useNotificationStore;
