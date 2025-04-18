// src/api/prAPI.js
import axios from "axios";

const baseURL = `${import.meta.env.VITE_API_HOST}/api/pr`;

// PR페이지 상단의 Top 10 사용자 가져오기
export const getPRTopUsers = async () => {
    const response = await axios.get(`${baseURL}/top`, { withCredentials: true });
    return response.data;
};

// PR페이지 전체 유저 목록 (필터/정렬/페이지네이션)
export const getPRUserList = async (params) => {
    const response = await axios.get(`${baseURL}/list`, {
        params,
        withCredentials: true,
    });
    return response.data;
};
