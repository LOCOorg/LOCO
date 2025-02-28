// src/api/userAPI.js
import axios from "axios"; // axios 모듈 import

const host = `${import.meta.env.VITE_API_HOST}/api/user`;

// 유저 정보 조회 API 함수
export const getUserInfo = async (userId) => {
    try {
        const response = await axios.get(`${host}/${userId}`); // API 호출
        return response.data.data; // 성공적으로 데이터 받으면 반환
    } catch (error) {
        throw new Error("유저 정보를 불러오는 데 실패했습니다."); // 에러 발생 시 에러 메시지
    }
};
