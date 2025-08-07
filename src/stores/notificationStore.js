// 채팅 알림 전역상태 관리
import { create } from 'zustand';
import {updateUserPrefs} from "../api/userAPI.js";
import useAuthStore from "./authStore.js";

const useNotificationStore = create((set, get) => ({
    notifications: [],
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
