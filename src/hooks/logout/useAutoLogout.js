// src/hooks/useAutoLogout.js
import { useEffect, useRef } from 'react';
import useAuthStore from '../../stores/authStore.js';

/**
 * 자동 로그아웃 훅
 * @param {number} inactivityTime - 비활동 시간 (밀리초, 기본: 30분)
 */
export const useAutoLogout = (inactivityTime = 3 * 60 * 60 * 1000) => {
    const { user, logout } = useAuthStore();
    const timerRef = useRef(null);

    // 타이머 초기화 함수
    const resetTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
            console.warn('⏰ 비활동으로 인한 자동 로그아웃 (3시간 경과)');
            logout();
        }, inactivityTime);
    };

    useEffect(() => {
        // 로그인 상태가 아니면 타이머 설정 안함
        if (!user) {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            return;
        }

        console.log(`⏱️ 자동 로그아웃 타이머 시작 (${inactivityTime / 3600000}시간)`);

        // 사용자 활동 감지 이벤트들
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click',
        ];

        // 초기 타이머 설정
        resetTimer();

        // 이벤트 리스너 등록
        events.forEach((event) => {
            document.addEventListener(event, resetTimer);
        });

        // 클린업
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            events.forEach((event) => {
                document.removeEventListener(event, resetTimer);
            });
        };
    }, [user, inactivityTime, logout]);
};