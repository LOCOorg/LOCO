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


// 유저 프로필 업데이트 API 함수 (PATCH 요청)
// 전체 저장 방식으로, 수정된 모든 필드를 한 번에 전송합니다.
export const updateUserProfile = async (userId, updatedData) => {
    try {
        const response = await axios.patch(`${host}/${userId}`, updatedData);
        return response.data.data || response.data.user;
    } catch (error) {
        throw new Error(error.response?.data.message || error.message);
    }
};


// 유저 별점 업데이트 API 함수 (fetch 사용)
export const rateUser = async (userId, rating) => {
    try {
        const response = await fetch(`${host}/${userId}/rate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ rating }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "별점 업데이트 실패");
        }

        return await response.json();
    } catch (error) {
        console.error("rateUser API 호출 중 오류:", error);
        throw error;
    }
};

