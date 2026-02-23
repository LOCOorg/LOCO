// src/api/authAPI.js
// 로그인 새로고침
import instance from './axiosInstance';


// 카카오 콜백으로부터 액세스 토큰·유저정보 받아오기
export const loginWithKakao = (code) =>
    instance.get(`/api/auth/kakao/callback?code=${code}`)
        .then((res) => res.data);



// 네이버 콜백으로부터 액세스 토큰·유저정보 받아오기
export const loginWithNaver = (code, state) =>
    instance.get(`/api/auth/naver/callback?code=${code}&state=${state}`)
        .then((res) => res.data);



// Silent refresh: 쿠키에 담긴 Refresh Token으로 새 Access Token 발급
// ✅ plain axios 사용 - instance 사용 시 401 인터셉터 재진입으로 데드락 발생
export const refresh = () =>
    axios.post(`${import.meta.env.VITE_API_HOST}/api/auth/refresh`, {}, {
        withCredentials: true,
    }).then(() => {});



// 인증된 Access Token 으로 현재 사용자 정보 조회
export const fetchCurrentUser = () =>
    instance.get('/api/auth/me')
        .then((res) => res.data);



// ✅ 네이버 연동해제 포함 로그아웃 함수
export const logoutAPI = async () => {
    try {
        console.log('로그아웃 API 호출 시작...');
        
        // withCredentials: true 는 axiosInstance에 이미 설정되어 있습니다.
        const response = await instance.post("/api/auth/logout");
        
        console.log('로그아웃 API 응답:', response.data);
        return response.data;
    } catch (error) {
        console.error('로그아웃 API 호출 실패:', error.response?.data || error.message);
        throw error;
    }
};

// ✅ 호환성을 위한 alias 추가
export const logout = logoutAPI;