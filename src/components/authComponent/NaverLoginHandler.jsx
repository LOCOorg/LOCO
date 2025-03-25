// src/components/authComponents/NaverLoginHandler.jsx
// 네이버 로그인 콜백 처리 컴포넌트: URL 쿼리에서 code와 state를 추출하여 백엔드 API 호출 후 처리합니다.
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from "../../stores/authStore.js";

const NaverLoginHandler = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    // Zustand의 상태 업데이트 함수를 가져옴
    const setToken = useAuthStore((state) => state.setToken);
    const setUser = useAuthStore((state) => state.setUser);

    useEffect(() => {
        if (code && state) {
            axios
                .get(`http://localhost:3000/api/auth/naver/callback?code=${code}&state=${state}`, {
                    withCredentials: true,
                })
                .then((response) => {
                    const data = response.data;
                    if (data.status === "noUser") {
                        // 회원가입이 필요한 경우 회원가입 페이지로 이동
                        navigate('/signupPage');
                    } else if (data.status === "success") {
                        // 로그인 성공 시 토큰 저장 후 메인 페이지로 이동
                        // setToken(data.token);
                        setUser(data.user);
                        navigate('/');
                    }
                })
                .catch((error) => {
                    console.error("네이버 로그인 처리 에러:", error.response?.data || error.message);
                });
        }
    }, [code, state, navigate, setToken, setUser]);

    return <div>네이버 로그인 처리 중...</div>;
};

export default NaverLoginHandler;
