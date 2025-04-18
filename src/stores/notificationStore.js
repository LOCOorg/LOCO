// 채팅 알림 전역상태 관리
import { create } from 'zustand';

const useNotificationStore = create((set) => ({
    notifications: [],
    addNotification: (notification) =>
        set((state) => ({
            notifications: [...state.notifications, notification],
        })),
    removeNotification: (id) =>
        set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
        })),
    clearNotifications: () => set({ notifications: [] }),
}));

export default useNotificationStore;
