// src/components/layout/NotificationDropdown.jsx
import {Switch} from '@headlessui/react';
import useNotificationStore from '../../stores/notificationStore.js';
import useAuthStore from '../../stores/authStore.js';
import {useUpdateUserPrefs} from "../../hooks/queries/useNotificationQueries.js";

const NotificationDropdown = () => {

    const friendReqEnabled = useNotificationStore(s => s.friendReqEnabled);
    const toggleFriendReq  = useNotificationStore((s) => s.toggleFriendReq);
    const chatPreviewEnabled = useNotificationStore(s => s.chatPreviewEnabled);
    const toggleChatPreview = useNotificationStore(s => s.toggleChatPreview);
    
    // ✅ 욕설 필터 추가
    const wordFilterEnabled = useNotificationStore(s => s.wordFilterEnabled);
    const toggleWordFilter = useNotificationStore(s => s.toggleWordFilter);

    const user = useAuthStore(s => s.user);
    const isAdult = user?.calculatedAge >= 19;

    // 🆕 React Query Mutation Hook
    const updatePrefsMutation = useUpdateUserPrefs();

    // 🆕 설정 변경 핸들러 (로컬 + 서버)
    const handleToggle = (prefName, currentValue, toggleFn) => {
        // 1. 로컬 상태 즉시 변경 (Zustand)
        toggleFn();

        // 2. 서버 업데이트 (React Query)
        if (user?._id) {
            updatePrefsMutation.mutate({
                userId: user._id,
                prefs: { [prefName]: !currentValue }
            });
        }
    };

    return (
        <div className="w-56 rounded-lg bg-white shadow-lg p-4 space-y-4 text-black">
            {/* 미리보기 알림 스위치 */}
            <div className="flex items-center justify-between">
                <span className="text-sm">채팅 미리보기 알림</span>
                <Switch
                    checked={chatPreviewEnabled}
                    onChange={() => handleToggle('chatPreviewEnabled', chatPreviewEnabled, toggleChatPreview)}
                    disabled={updatePrefsMutation.isPending}
                    className={`${chatPreviewEnabled  ? 'bg-indigo-500' : 'bg-gray-300'}
                     ${updatePrefsMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}
                      relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none`}
                >
                    <span className="sr-only">Enable toast preview</span>
                    <span
                        aria-hidden="true"
                        className={`${chatPreviewEnabled  ? 'translate-x-5' : 'translate-x-0'}
                        inline-block h-5 w-5 transform rounded-full bg-white transition-transform`}
                    />
                </Switch>
            </div>

            {/* 친구 신청 허용 스위치 */}
            <div className="flex items-center justify-between">
                <span className="text-sm">친구 신청 허용</span>
                <Switch
                    checked={friendReqEnabled}
                    onChange={() => handleToggle('friendReqEnabled', friendReqEnabled, toggleFriendReq)}
                    disabled={updatePrefsMutation.isPending}
                    className={`${friendReqEnabled ? 'bg-indigo-500' : 'bg-gray-300'}
                    ${updatePrefsMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}
                      relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none`}
                >
                    <span className="sr-only">Enable friend requests</span>
                    <span
                        aria-hidden="true"
                        className={`${friendReqEnabled ? 'translate-x-5' : 'translate-x-0'}
                        inline-block h-5 w-5 transform rounded-full bg-white transition-transform`}
                    />
                </Switch>
            </div>
            
            {/* ✅ 욕설 필터 스위치 추가 */}
            <div className="flex items-center justify-between">
                <span className="text-sm">채팅 욕설 필터</span>
                {isAdult ? (
                    <Switch
                        checked={wordFilterEnabled}
                        onChange={() => handleToggle('wordFilterEnabled', wordFilterEnabled, toggleWordFilter)}
                        disabled={updatePrefsMutation.isPending}
                        className={`${wordFilterEnabled ? 'bg-indigo-500' : 'bg-gray-300'}
                        ${updatePrefsMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}
                          relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none`}
                    >
                        <span className="sr-only">Enable word filter</span>
                        <span
                            aria-hidden="true"
                            className={`${wordFilterEnabled ? 'translate-x-5' : 'translate-x-0'}
                            inline-block h-5 w-5 transform rounded-full bg-white transition-transform`}
                        />
                    </Switch>
                ) : (
                    <span className="text-xs text-gray-400">만 19세 이상</span>
                )}
            </div>
        </div>
    );
};

export default NotificationDropdown;
