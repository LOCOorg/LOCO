// src/stores/notificationStore.js
import { create } from 'zustand';
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



    // ⭐ 이 함수는 React Query Mutation으로 대체되므로 간소화
    toggleFriendReq() {
        const next = !get().friendReqEnabled;
        set({ friendReqEnabled: next });
        setEncryptedItem('friendReqEnabled', next);

        // ⚠️ 실제 서버 업데이트는 컴포넌트에서 useUpdateUserPrefs Hook 사용
        console.log('⚠️ toggleFriendReq: 로컬 상태만 변경. 서버 업데이트는 Hook 사용 필요');
    },



    toastEnabled: (() => {
        const stored = getDecryptedItem('toastEnabled');
        return stored !== null ? stored : true;
    })(),

    toggleToast() {
        const next = !get().toastEnabled;
        set({ toastEnabled: next });
        setEncryptedItem('toastEnabled', next);
    },

    chatPreviewEnabled: (() => {
        const stored = getDecryptedItem('chatPreviewEnabled');
        return stored !== null ? stored : true;
    })(),

    toggleChatPreview() {
        const next = !get().chatPreviewEnabled;
        set({ chatPreviewEnabled: next });
        setEncryptedItem('chatPreviewEnabled', next);
    },

    // ✅ 욕설 필터 설정 (만 19세 이상만 변경 가능, 기본값: true)
    wordFilterEnabled: (() => {
        const stored = getDecryptedItem('wordFilterEnabled');
        return stored !== null ? stored : true; // ✅ 기본값: ON
    })(),

    toggleWordFilter() {
        const userId = useAuthStore.getState().user?._id;
        const userAge = useAuthStore.getState().user?.calculatedAge;

        if (!userAge || userAge < 19) {
            console.warn('만 19세 이상만 설정할 수 있습니다.');
            return;
        }

        const next = !get().wordFilterEnabled;
        set({ wordFilterEnabled: next });
        setEncryptedItem('wordFilterEnabled', next);
    },

// syncWithUserPrefs 함수에도 추가
    syncWithUserPrefs: async (userPrefs) => {
        if (userPrefs && typeof userPrefs.friendReqEnabled === 'boolean') {
            set({ friendReqEnabled: userPrefs.friendReqEnabled });
            setEncryptedItem('friendReqEnabled', userPrefs.friendReqEnabled);
        }

        if (userPrefs && typeof userPrefs.toastEnabled === 'boolean') {
            set({ toastEnabled: userPrefs.toastEnabled });
            setEncryptedItem('toastEnabled', userPrefs.toastEnabled);
        }

        // ✅ 채팅 미리보기 설정 동기화 추가
        if (userPrefs && typeof userPrefs.chatPreviewEnabled === 'boolean') {
            set({ chatPreviewEnabled: userPrefs.chatPreviewEnabled });
            setEncryptedItem('chatPreviewEnabled', userPrefs.chatPreviewEnabled);
        }
        // ✅ 욕설 필터 설정 동기화 추가
        if (userPrefs && typeof userPrefs.wordFilterEnabled === 'boolean') {
            set({ wordFilterEnabled: userPrefs.wordFilterEnabled });
            setEncryptedItem('wordFilterEnabled', userPrefs.wordFilterEnabled);
        }
    },

}));

export default useNotificationStore;
