// src/api/prAPI.js
import instance from "./axiosInstance";

const baseURL = `${import.meta.env.VITE_API_HOST}/api/pr`;

export const getPRTopUsers = async () => {
    try {
        const { data } = await instance.get(`${baseURL}/top`);
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
        const { data } = await instance.get(`${baseURL}/list`, { params });

        // 만약 백엔드가 { success, users, total } 형태로 내려온다면,
        // 호출부에서 매번 data.users 를 구조분해하기 번거로울 수 있으니
        // 필요한 형태로 가공해서 리턴해도 좋습니다:
        //
        // return {
        //   users:   data.users,
        //   total:   data.total,
        //   success: data.success,
        // };

        return data;
    } catch (err) {
        console.error("[PR] getPRUserList error:", err);
        // 호출하는 쪽에서 catch 할 수 있도록 에러를 다시 던집니다
        throw err;
    }
};

