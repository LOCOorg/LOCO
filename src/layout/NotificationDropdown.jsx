// src/components/layout/NotificationDropdown.jsx
import {Switch} from '@headlessui/react';
import useNotificationStore from '../../src/stores/notificationStore.js';

const NotificationDropdown = () => {
    const toastEnabled = useNotificationStore(s => s.toastEnabled);
    const friendReqEnabled = useNotificationStore(s => s.friendReqEnabled);
    const toggleToast      = useNotificationStore((s) => s.toggleToast);
    const toggleFriendReq  = useNotificationStore((s) => s.toggleFriendReq);

    return (
        <div className="w-56 rounded-lg bg-white shadow-lg p-4 space-y-4 text-black">
            {/* 미리보기 알림 스위치 */}
            <div className="flex items-center justify-between">
                <span className="text-sm">채팅 미리보기 알림</span>
                <Switch
                    checked={toastEnabled}
                    onChange={toggleToast}
                    className={`${toastEnabled ? 'bg-indigo-500' : 'bg-gray-300'}
                      relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none`}
                >
                    <span className="sr-only">Enable toast preview</span>
                    <span
                        aria-hidden="true"
                        className={`${toastEnabled ? 'translate-x-5' : 'translate-x-0'}
                        inline-block h-5 w-5 transform rounded-full bg-white transition-transform`}
                    />
                </Switch>
            </div>

            {/* 친구 신청 허용 스위치 */}
            <div className="flex items-center justify-between">
                <span className="text-sm">친구 신청 허용</span>
                <Switch
                    checked={friendReqEnabled}
                    onChange={toggleFriendReq}
                    className={`${friendReqEnabled ? 'bg-indigo-500' : 'bg-gray-300'}
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
        </div>
    );
};

export default NotificationDropdown;
