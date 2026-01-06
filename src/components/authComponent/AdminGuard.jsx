import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore.js';
import LoadingComponent from '../../common/LoadingComponent.jsx';

const AdminGuard = ({ children }) => {
    const user = useAuthStore(state => state.user);
    const isLoading = useAuthStore(state => state.isLoading);

    if (isLoading) {
        return <LoadingComponent message="권한 확인 중..." />;
    }

    // 로그인하지 않았거나 관리자(Lv 2) 미만인 경우
    if (!user || user.userLv < 3) {
        alert("접근 권한이 없습니다.");
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AdminGuard;
