// src/components/authComponents/NaverLoginHandler.jsx
// 네이버 로그인 콜백 처리 컴포넌트: URL 쿼리에서 code와 state를 추출하여 백엔드 API 호출 후 처리합니다.
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loginWithNaver } from '../../api/authAPI.js';
// import axios from 'axios';
import useAuthStore from "../../stores/authStore.js";
import useNotificationStore from "../../stores/notificationStore.js";

const NaverLoginHandler = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    // Zustand의 상태 업데이트 함수를 가져옴
    const setAccessToken = useAuthStore(s => s.setAccessToken);
    const setUser        = useAuthStore(s => s.setUser);

    // ✅ notificationStore 동기화 함수 추가
    const syncWithUserPrefs = useNotificationStore(s => s.syncWithUserPrefs);

    useEffect(() => {
        if (!(code && state)) return;
        (async () => {
            try {
                const data = await loginWithNaver(code, state);
                if (data.status === 'noUser') {
                    navigate('/signupPage');
                } else if (data.status === 'success') {
                    setUser(data.user);
                    // ✅ 알림 설정 동기화
                    await syncWithUserPrefs({
                        friendReqEnabled: data.user.friendReqEnabled ?? true,
                        chatPreviewEnabled: data.user.chatPreviewEnabled ?? true,
                    });
                    navigate('/');
                }
            } catch (err) {
                console.error('네이버 로그인 처리 에러:', err);
            }
        })();
    }, [code, state, navigate, setAccessToken, setUser, syncWithUserPrefs]);


    // useEffect(() => {
    //     if (code && state) {
    //         axios
    //             .get(`http://localhost:3000/api/auth/naver/callback?code=${code}&state=${state}`, {
    //                 withCredentials: true,
    //             })
    //             .then((response) => {
    //                 const data = response.data;
    //                 if (data.status === "noUser") {
    //                     // 회원가입이 필요한 경우 회원가입 페이지로 이동
    //                     navigate('/signupPage');
    //                 } else if (data.status === "success") {
    //                     // 로그인 성공 시 토큰 저장 후 메인 페이지로 이동
    //                     // setToken(data.token);
    //                     setUser(data.user);
    //                     navigate('/');
    //                 }
    //             })
    //             .catch((error) => {
    //                 console.error("네이버 로그인 처리 에러:", error.response?.data || error.message);
    //             });
    //     }
    // }, [code, state, navigate, setToken, setUser]);

    return <div>네이버 로그인 처리 중...</div>;
};

export default NaverLoginHandler;
