//src/components/authComponent/AuthInit.jsx

import {useEffect, useRef} from 'react';
import { fetchCurrentUser } from '../../api/authAPI.js';
import useAuthStore from '../../stores/authStore.js';
import { useSocket } from '../../hooks/useSocket.js';


const AuthInit = () => {
    const triedOnce = useRef(false);
    const setUser        = useAuthStore(s => s.setUser);
    // const setAccessToken = useAuthStore(s => s.setAccessToken);
    const logout = useAuthStore((s) => s.logout);
    const user = useAuthStore(s => s.user);  // 🔧 현재 사용자 정보
    const socket = useSocket();  // 🔧 소켓 인스턴스




    useEffect(() => {
        if (triedOnce.current) return; // 이미 시도했으면 무시
        triedOnce.current = true;

        (async () => {
            try {
                // 1) Silent refresh (쿠키에 담긴 리프레시 토큰으로 액세스 토큰 발급)
                // await refresh();

                // 2) /api/auth/me 호출하여 현재 사용자 정보 및 추가 토큰을 받아옴
                const { user } = await fetchCurrentUser();
                setUser(user);

                // // 3) fetchCurrentUser()가 추가 새로운 액세스 토큰을  내려줄 경우, 스토어 갱신
                // if (maybeNew) {
                //     setAccessToken(maybeNew);
                // }
            } catch (err) {
                // 리프레시나 사용자 조회 단계에서 오류(401 등) 발생 시, 완전 로그아웃 상태로 전환
                console.error('AuthInit 오류:', err);
                logout();
            }
        })();
    }, [setUser, logout]);

    // 🔧 사용자 로그인 완료 후 소켓 등록
    useEffect(() => {
        if (socket && user && user._id) {
            console.log('🟢 소켓에 사용자 등록:', user._id);
            socket.emit('register', user._id);
        }
    }, [socket, user]);

    return null; // 화면에 그릴 내용 없음. 초기화 용 컴포넌트







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

