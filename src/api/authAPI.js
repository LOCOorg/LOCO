// src/api/authAPI.js
// 로그인 새로고침
import instance from './axiosInstance';

import axios from 'axios';

export const fetchCurrentUser = async () => {
    try {
        const response = await axios.get('http://localhost:3000/api/auth/me', {
            withCredentials: true, // HttpOnly 쿠키를 함께 전송
        });
        return response.data.user;
    } catch (error) {
        console.error('현재 사용자 정보를 가져오지 못했습니다:', error.response?.data || error.message);
        return null;
    }
};
