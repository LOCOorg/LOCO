//src/components/authComponent/AuthInit.jsx

import {useEffect, useRef} from 'react';
import { fetchCurrentUser } from '../../api/authAPI.js';
import useAuthStore from '../../stores/authStore.js';
import { useAutoLogout } from '../../hooks/logout/useAutoLogout.js';
import { useTokenExpiry } from '../../hooks/logout/useTokenExpiry.js';
import { loadFullUser } from '../../utils/loadFullUser.js';

const AuthInit = () => {
    const triedOnce = useRef(false);
    const setUser = useAuthStore(s => s.setUser);

    // 자동 로그아웃 훅 추가 (3시간 비활동 시)
    useAutoLogout(3 * 60 * 60 * 1000);

    // 토큰 만료 감지 훅 추가
    useTokenExpiry();

    useEffect(() => {
        if (triedOnce.current) return;
        triedOnce.current = true;

        // OAuth 콜백 경로에서는 LoginHandler/NaverLoginHandler가 처리하므로
        // fetchCurrentUser 스킵하고, AuthGuard가 children을 렌더링하도록 null 설정
        const path = window.location.pathname;
        if (path.startsWith('/auth/callback') || path.startsWith('/auth/naver/callback')) {
            setUser(null);
            return;
        }

        (async () => {
            try {
                // 1) 현재 사용자 조회
                const { user } = await fetchCurrentUser();

                // 2) 친구 ID + 차단 목록 병렬 로드 후 상태 설정
                await loadFullUser(user);

            } catch (err) {
                // 401 등 인증 실패 → 비로그인 상태로 전환
                // logout() 대신 setUser(null) 사용: 비로그인 상태에서
                // logoutAPI() 호출 시 401 → refresh → 401 체인 반응 방지
                console.log('[AuthInit] 비로그인 상태 확인');
                setUser(null);
            }
        })();
    }, [setUser]);

    // register는 SocketContext에서 전역으로 처리
    return null;




    // useEffect(() => {
    //     if (triedOnce.current) return;       // ← 이미 호출했으면 무시
    //     triedOnce.current = true;
    //
    //     refresh()
    //           .then(token => {
    //               // ① refresh()가 반환하는 토큰 문자열을 바로 상태에 저장
    //               setAccessToken(token);
    //               // ② 사용자 정보 조회
    //               return fetchCurrentUser();
    //               })
    //          .then(user => {
    //              // ③ fetchCurrentUser()가 반환하는 user 객체를 상태에 저장
    //              setUser(user);
    //          })
    //           .catch(() => {
    //                // 네트워크 오류·401·파싱 오류 등 모두 비로그인 처리
    //               setUser(null);
    //           });
    // }, []);
    // return null;

    // useEffect(() => {
    //     const initAuth = async () => {
    //         const currentUser = await fetchCurrentUser(); // /api/auth/me 호출
    //         if (currentUser) {
    //             setUser(currentUser);
    //         }
    //     };
    //     initAuth();
    // }, [setUser]);
    //
    // return null;
};

export default AuthInit;

