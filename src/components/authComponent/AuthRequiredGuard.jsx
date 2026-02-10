// src/components/authComponent/AuthRequiredGuard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore.js';

/**
 * AuthRequiredGuard
 * - 로그인 필수 페이지 접근 제어
 * - 비로그인 사용자 → 메인 페이지로 리다이렉트
 * - 로그인 사용자만 children 렌더링
 */
const AuthRequiredGuard = ({ children }) => {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);

    const [isChecking, setIsChecking] = useState(true);
    const [isAllowed, setIsAllowed] = useState(false);

    useEffect(() => {
        // user가 undefined면 아직 로딩 중
        if (user === undefined) {
            return;
        }

        // user가 null이면 비로그인 상태 → 차단
        if (user === null) {
            console.log('[AuthRequiredGuard] 비로그인 사용자 - 메인으로 이동');
            navigate('/', { replace: true });
            setIsChecking(false);
            return;
        }

        // user 객체가 있으면 로그인 상태 → 허용
        if (user && user._id) {
            setIsAllowed(true);
            setIsChecking(false);
        }
    }, [user, navigate]);

    // 로딩 중
    if (isChecking || user === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">잠시만 기다려주세요...</p>
                </div>
            </div>
        );
    }

    // 접근 불허
    if (!isAllowed) {
        return null;
    }

    // 접근 허용
    return children;
};

export default AuthRequiredGuard;
