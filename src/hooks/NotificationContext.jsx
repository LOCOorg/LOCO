import { createContext, useState } from 'react';

// 친구 요청 알림 전역상태 관리

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const addNotification = (notification) => {
        setNotifications(prev => [...prev, notification]);
    };

    const removeNotification = (index) => {
        setNotifications(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};
