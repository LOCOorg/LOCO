//src/components/authComponent/AuthInit.jsx

import { useEffect } from 'react';
import { refresh, fetchCurrentUser } from '../../api/authAPI.js';
import useAuthStore from '../../stores/authStore.js';


const AuthInit = () => {
    const setUser        = useAuthStore(s => s.setUser);
    const setAccessToken = useAuthStore(s => s.setAccessToken);

    useEffect(() => {
        (async () => {
            try {
                // 1) Refresh → Access Token
                const token = await refresh();
                setAccessToken(token);

                // 2) 새 토큰으로 내정보 조회
                const user = await fetchCurrentUser();
                setUser(user);
            } catch {
                // 실패 시 명시적으로 “비로그인” 상태
                setUser(null);
            }
        })();
    }, [setAccessToken, setUser]);

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

