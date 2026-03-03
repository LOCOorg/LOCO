// src/api/prAPI.js
import instance from "./axiosInstance";


export const getPRTopUsers = async () => {
    try {
        const { data } = await instance.get(`/api/pr/top`);
        return data;
    } catch (err) {
        console.error("[PR] getPRTopUsers error:", err);
        throw err;
    }
};

// PR페이지 전체 유저 목록 (필터/정렬/페이지네이션)
export const getPRUserList = async (params) => {
    try {
        // axiosInstance 에서는 이미 baseURL, withCredentials 등을 전역 설정해두었다고 가정
        const { data } = await instance.get(`/api/pr/list`, { params });

        return data;
    } catch (err) {
        console.error("[PR] getPRUserList error:", err);
        // 호출하는 쪽에서 catch 할 수 있도록 에러를 다시 던집니다
        throw err;
    }
};

