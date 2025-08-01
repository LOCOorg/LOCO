// src/api/authAPI.js
// 로그인 새로고침
import instance from './axiosInstance';

// import axios from 'axios';

// export const fetchCurrentUser = async () => {
//     try {
//         const response = await axios.get('http://localhost:3000/api/auth/me', {
//             withCredentials: true, // HttpOnly 쿠키를 함께 전송
//         });
//         return response.data.user;
//     } catch (error) {
//         console.error('현재 사용자 정보를 가져오지 못했습니다:', error.response?.data || error.message);
//         return null;
//     }
// };


// 카카오 콜백으로부터 액세스 토큰·유저정보 받아오기
export const loginWithKakao = (code) =>
    instance.get(`/api/auth/kakao/callback?code=${code}`)
        .then((res) => res.data);



// 네이버 콜백으로부터 액세스 토큰·유저정보 받아오기
export const loginWithNaver = (code, state) =>
    instance.get(`/api/auth/naver/callback?code=${code}&state=${state}`)
        .then((res) => res.data);



// Silent refresh: 쿠키에 담긴 Refresh Token으로 새 Access Token 발급
export const refresh = () =>
    instance.post('/api/auth/refresh')
        .then(() => {});



// 인증된 Access Token 으로 현재 사용자 정보 조회
export const fetchCurrentUser = () =>
    instance.get('/api/auth/me')
        .then((res) => res.data);



export const logoutAPI = async () => {
    // withCredentials: true 는 axiosInstance에 이미 설정되어 있습니다.
    await instance.post("/api/auth/logout");
};