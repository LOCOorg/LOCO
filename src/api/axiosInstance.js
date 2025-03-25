// src/api/axiosInstance.js
import axios from 'axios';

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_HOST, // 예: http://localhost:3000
    withCredentials: true, // 모든 요청에 쿠키 포함
});

// 요청 인터셉터: 요청 헤더 출력
instance.interceptors.request.use(
    (config) => {
        console.log("Axios Request Headers:", config.headers);
        return config;
    },
    (error) => {
        console.error("Axios Request Error:", error);
        return Promise.reject(error);
    }
);

// 응답 인터셉터: 응답 헤더 출력
instance.interceptors.response.use(
    (response) => {
        console.log("Axios Response Headers:", response.headers);
        return response;
    },
    (error) => {
        console.error("Axios Response Error:", error.response ? error.response.headers : error);
        return Promise.reject(error);
    }
);

export default instance;
