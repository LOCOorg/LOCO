// src/components/authComponent/SignupGuard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore.js';
import axiosInstance from '../../api/axiosInstance.js';

/**
 * SignupGuard
 * - 회원가입 페이지 접근 제어
 * - 조건 1: 이미 로그인된 사용자 → 메인으로 리다이렉트
 * - 조건 2: 소셜 로그인 세션 데이터 없음 → 메인으로 리다이렉트
 * - 모든 조건 통과 시에만 children 렌더링
 */
const SignupGuard = ({ children }) => {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);

    const [isChecking, setIsChecking] = useState(true);
    const [isAllowed, setIsAllowed] = useState(false);

    useEffect(() => {
        const checkAccess = async () => {
            // 1. 아직 user 상태 로딩 중이면 대기
            if (user === undefined) {
                return;
            }

            // 2. 이미 로그인된 사용자 → 차단
            if (user && user._id) {
                console.log('[SignupGuard] 이미 로그인된 사용자 - 메인으로 이동');
                navigate('/', { replace: true });
                return;
            }

            // 3. 소셜 로그인 세션 데이터 확인
            try {
                const [kakaoRes, naverRes] = await Promise.all([
                    axiosInstance.get('/api/auth/kakao-data', { withCredentials: true }),
                    axiosInstance.get('/api/auth/naver-data', { withCredentials: true })
                ]);

                const kakaoData = kakaoRes.data?.socialData;
                const naverData = naverRes.data?.socialData;

                const hasKakao = !!(kakaoData?.kakaoId);
                const hasNaver = !!(naverData?.naverId);

                console.log('[SignupGuard] 세션 데이터 확인:', { hasKakao, hasNaver });

                if (!hasKakao && !hasNaver) {
                    // 소셜 로그인 안함 → 차단
                    console.log('[SignupGuard] 소셜 로그인 데이터 없음 - 메인으로 이동');
                    navigate('/', { replace: true });
                    return;
                }

                // 모든 조건 통과 → 허용
                setIsAllowed(true);
            } catch (error) {
                console.error('[SignupGuard] 세션 데이터 조회 실패:', error);
                navigate('/', { replace: true });
            } finally {
                setIsChecking(false);
            }
        };

        checkAccess();
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

export default SignupGuard;
