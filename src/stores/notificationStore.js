// 채팅 알림 전역상태 관리
import { create } from 'zustand';

const useNotificationStore = create((set) => ({
    notifications: [],
    friendReqEnabled: JSON.parse(localStorage.getItem('friendReqEnabled') ?? 'true'),

    setFriendReqEnabled: (val) =>
        set(() => {
            localStorage.setItem('friendReqEnabled', JSON.stringify(val));
            return { friendReqEnabled: val };
        }),
    /* ✅ 토스트 사용 여부 */
    toastEnabled: JSON.parse(localStorage.getItem('toastEnabled') ?? 'true'),
    setToastEnabled: (val) =>
        set(() => {
            localStorage.setItem('toastEnabled', JSON.stringify(val));
            return { toastEnabled: val };
        }),
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
