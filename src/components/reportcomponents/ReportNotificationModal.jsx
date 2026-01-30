import {useEffect, useState} from 'react';
import CommonModal from '../../common/CommonModal.jsx';
import { useNotifications, useMarkAsReadAndDelete } from '../../hooks/queries/useNotificationQueries';
import useAuthStore from '../../stores/authStore.js';

const NotificationModal = () => {
    const { user } = useAuthStore();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 🆕 React Query Hook 사용
    const {
        data: notifications = [],
        isLoading,
        error
    } = useNotifications(user?._id, {
        enabled: !!user?._id,
    });

    // 🆕 React Query v5에서는 onSuccess가 지원되지 않으므로 useEffect 사용
    useEffect(() => {
        if (notifications && notifications.length > 0 && !isModalOpen) {
            setIsModalOpen(true);
        }
    }, [notifications, isModalOpen]);

    // 🆕 삭제 Mutation Hook
    const markAsReadAndDeleteMutation = useMarkAsReadAndDelete();

    const handleClose = () => {
        const currentNotification = notifications[currentIndex];

        if (currentNotification) {
            // 🆕 Mutation 실행 (낙관적 업데이트)
            markAsReadAndDeleteMutation.mutate({
                userId: user._id,
                notificationId: currentNotification._id
            });
        }

        // 다음 알림이 있으면 인덱스 업데이트, 없으면 모달 닫기
        if (currentIndex < notifications.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setIsModalOpen(false);
            setCurrentIndex(0);  // 인덱스 초기화
        }
    };

    // 로딩 중
    if (isLoading) return null;

    // 에러 발생
    if (error) {
        console.error('알림 로딩 에러:', error);
        return null;
    }

    // 알림이 없거나 모달이 닫혀있음
    if (!isModalOpen || notifications.length === 0) {
        return null;
    }

    return (
        <CommonModal
            isOpen={isModalOpen}
            title="알림"
            onClose={handleClose}
            onConfirm={handleClose}
            showCancel={false}
        >
            <p>{notifications[currentIndex]?.content}</p>
        </CommonModal>
    );
};

export default NotificationModal;
