// src/hooks/useLv.js
// 인증 상태를 반환하는 훅 (초기 fetch는 AuthInit에서 전담)
import authStore from '../stores/authStore';

export const useLv = () => {
    const { user, setUser, logout } = authStore();

    return {
        currentUser: user,
        setUser,
        logout,
    };
};

