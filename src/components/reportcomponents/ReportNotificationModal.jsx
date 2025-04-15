import { useState, useEffect } from 'react';
import CommonModal from '../../common/CommonModal.jsx';
import { fetchNotifications, markNotificationAsRead } from '../../api/reportNotificationAPI.js';
import useAuthStore from '../../stores/authStore.js';

const NotificationModal = () => {
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const loadNotifications = async () => {
            if (user) {
                try {
                    const notifs = await fetchNotifications(user._id);
                    if (notifs && notifs.length > 0) {
                        setNotifications(notifs);
                        setIsModalOpen(true);
                    }
                } catch (error) {
                    console.error(error.message);
                }
            }
        };
        loadNotifications();
    }, [user]);

    const handleClose = async () => {
        if (notifications[currentIndex]) {
            // 알림을 확인 처리
            await markNotificationAsRead(notifications[currentIndex]._id);
        }
        // 다음 알림이 있으면 인덱스 업데이트, 없으면 모달 닫기
        if (currentIndex < notifications.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setIsModalOpen(false);
        }
    };

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
            <p>{notifications[currentIndex].content}</p>
        </CommonModal>
    );
};

export default NotificationModal;
