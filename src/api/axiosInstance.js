// src/api/axiosInstance.js
import axios from 'axios';
import useAuthStore from '../stores/authStore.js';
import { refresh } from './authAPI';

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

// 리프레시 동시 호출 방지용 플래그와 큐
let isRefreshing = false;
let subscribers  = [];

// 토큰 갱신 후 대기 중인 요청에 헤더 심어주기
function onRefreshed(token) {
    subscribers.forEach(cb => cb(token));
    subscribers = [];
}

// 큐에 추가
function addSubscriber(cb) {
    subscribers.push(cb);
}
// 401 응답 시 한 번만 silent refresh → 재시도
instance.interceptors.response.use(
    res => res,
    async err => {
        const { config, response } = err;
        if (response?.status === 401 && !config._retry) {
            config._retry = true;

            if (!isRefreshing) {
                isRefreshing = true;
                try {
                    const newToken = await refresh();
                    // const newToken = res.data.accessToken;
                    useAuthStore.getState().setAccessToken(newToken);
                    onRefreshed(newToken);
                } catch (e) {
                    useAuthStore.getState().logout();
                    // window.location.href = '/';
                    return Promise.reject(e);
                } finally {
                    isRefreshing = false;
                }
            }

            // 기존 요청은 Promise에 묶어 두었다가 토큰 갱신 후 재시도
            return new Promise(resolve => {
                addSubscriber(token => {
                    config.headers.Authorization = `Bearer ${token}`;
                    resolve(instance(config));
                });
            });
        }
        return Promise.reject(err);
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
