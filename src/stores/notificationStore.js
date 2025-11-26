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
        const previous = get().friendReqEnabled;  // ⭐ 이전 값 저장
        const next = !previous;

        set({ friendReqEnabled: next });
        setEncryptedItem('friendReqEnabled', next);

        const userId = useAuthStore.getState().user?._id;
        if (userId) {
            try {
                await updateUserPrefs(userId, { friendReqEnabled: next });
                // ✅ 성공: 아무 것도 안 함
            } catch (error) {
                // ✅ 실패: 롤백
                console.error('친구 요청 설정 업데이트 실패:', error);
                set({ friendReqEnabled: previous });
                setEncryptedItem('friendReqEnabled', previous);

                // 선택사항: 사용자에게 알림
                 get().addNotification({
                     id: Date.now(),
                     message: '설정 업데이트에 실패했습니다.',
                     type: 'error'
                 });
            }
        }
    },

    toastEnabled: (() => {
        const stored = getDecryptedItem('toastEnabled');
        return stored !== null ? stored : true;
    })(),

    async toggleToast() {
        const previous = get().toastEnabled;
        const next = !previous;

        set({ toastEnabled: next });
        setEncryptedItem('toastEnabled', next);

        const userId = useAuthStore.getState().user?._id;
        if (userId) {
            try {
                await updateUserPrefs(userId, { toastEnabled: next });
            } catch (error) {
                console.error('토스트 설정 업데이트 실패:', error);
                set({ toastEnabled: previous });
                setEncryptedItem('toastEnabled', previous);
            }
        }
    },

    chatPreviewEnabled: (() => {
        const stored = getDecryptedItem('chatPreviewEnabled');
        return stored !== null ? stored : true;
    })(),

    async toggleChatPreview() {
        const previous = get().chatPreviewEnabled;  // ⭐ 이전 값 저장
        const next = !previous;

        set({ chatPreviewEnabled: next });
        setEncryptedItem('chatPreviewEnabled', next);

        const userId = useAuthStore.getState().user?._id;
        if (userId) {
            try {
                await updateUserPrefs(userId, { chatPreviewEnabled: next });
            } catch (error) {
                // 서버 업데이트 실패 시 로컬 상태 롤백
                set({ chatPreviewEnabled: previous });
                setEncryptedItem('chatPreviewEnabled', previous);
                console.error('채팅 미리보기 설정 업데이트 실패:', error);
            }
        }
    },

    // ✅ 욕설 필터 설정 (만 19세 이상만 변경 가능, 기본값: true)
    wordFilterEnabled: (() => {
        const stored = getDecryptedItem('wordFilterEnabled');
        return stored !== null ? stored : true; // ✅ 기본값: ON
    })(),

    async toggleWordFilter() {
        const userId = useAuthStore.getState().user?._id;
        const userAge = useAuthStore.getState().user?.calculatedAge;
        
        // 만 19세 이상만 변경 가능
        if (!userAge || userAge < 19) {
            console.warn('만 19세 이상만 설정할 수 있습니다.');
            return;
        }

        const previous = get().wordFilterEnabled;  // ⭐ 이전 값 저장
        const next = !previous;

        set({ wordFilterEnabled: next });
        setEncryptedItem('wordFilterEnabled', next);

        if (userId) {
            try {
                await updateUserPrefs(userId, { wordFilterEnabled: next });
            } catch (error) {
                // 서버 업데이트 실패 시 로컬 상태 롤백
                set({ wordFilterEnabled: previous });
                setEncryptedItem('wordFilterEnabled', previous );
                console.error('욕설 필터 설정 업데이트 실패:', error);
            }
        }
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
