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
    /* ★ 추가: 채팅방 단위로 모두 제거 */
    removeNotificationsByRoom: (chatRoomId) =>
        set((state) => ({
            notifications: state.notifications.filter(
                (n) => n.chatRoom !== chatRoomId
            ),
        })),
    clearNotifications: () => set({ notifications: [] }),
}));

export default useNotificationStore;
