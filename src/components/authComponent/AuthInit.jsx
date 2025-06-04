//src/components/authComponent/AuthInit.jsx

import {useEffect, useRef} from 'react';
import { refresh, fetchCurrentUser } from '../../api/authAPI.js';
import useAuthStore from '../../stores/authStore.js';


const AuthInit = () => {
    const triedOnce = useRef(false);
    const setUser        = useAuthStore(s => s.setUser);
    const setAccessToken = useAuthStore(s => s.setAccessToken);

    useEffect(() => {
        if (triedOnce.current) return;       // ← 이미 호출했으면 무시
        triedOnce.current = true;

        refresh()
              .then(token => {
                  // ① refresh()가 반환하는 토큰 문자열을 바로 상태에 저장
                  setAccessToken(token);
                  // ② 사용자 정보 조회
                  return fetchCurrentUser();
                  })
             .then(user => {
                 // ③ fetchCurrentUser()가 반환하는 user 객체를 상태에 저장
                 setUser(user);
             })
              .catch(() => {
                   // 네트워크 오류·401·파싱 오류 등 모두 비로그인 처리
                  setUser(null);
              });
    }, []);
    return null;

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

