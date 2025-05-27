// src/api/axiosInstance.js
import axios from 'axios';
import useAuthStore from '../stores/authStore.js';
import * as authAPI      from './authAPI.js';

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_HOST, // 예: http://localhost:3000
    withCredentials: true, // 모든 요청에 쿠키 포함
});

// 요청마다 Authorization 헤더에 Access Token 추가
instance.interceptors.request.use(config => {
    const token = useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// 401 응답 시 한 번만 silent refresh → 재시도
instance.interceptors.response.use(
    res => res,
    async (error) => {
        const { response, config } = error;
        if (response?.status === 401 && !config._retry) {
            config._retry = true;
            try {
                const newToken = await authAPI.refresh();
                useAuthStore.getState().setAccessToken(newToken);
                config.headers.Authorization = `Bearer ${newToken}`;
                return instance(config);
            } catch {
                useAuthStore.getState().logout();
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);

export default instance;





// // 요청 인터셉터: 요청 헤더 출력
// instance.interceptors.request.use(
//     (config) => {
//         console.log("Axios Request Headers:", config.headers);
//         return config;
//     },
//     (error) => {
//         console.error("Axios Request Error:", error);
//         return Promise.reject(error);
//     }
// );
//
// // 응답 인터셉터: 응답 헤더 출력
// instance.interceptors.response.use(
//     (response) => {
//         console.log("Axios Response Headers:", response.headers);
//         return response;
//     },
//     (error) => {
//         console.error("Axios Response Error:", error.response ? error.response.headers : error);
//         return Promise.reject(error);
//     }
// );
//
// export default instance;
