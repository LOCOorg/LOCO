// userProfileLightAPI.js
// 목적: 경량화된 사용자 정보 조회 API
// 기존 getUserInfo 대신 사용처별 최적화된 API 제공

import instance from "./axiosInstance.js";

/**
 * 1) 최소 프로필 조회 (ProfileButton용)
 * 반환: _id, nickname, profilePhoto (3개만)
 * 기존 getUserInfo 대비 80% 데이터 감소
 */
export const getUserMinimal = async (userId) => {
    try {
        const response = await instance.get(`/api/user/${userId}/profile-minimal`);
        return response.data.data;
    } catch (error) {
        throw new Error("최소 프로필 조회 실패");
    }
};

/**
 * 2) 풀 프로필 조회 (SimpleProfileModal용)
 * 반환: 모달에 필요한 9개 필드
 * 기존 getUserInfo 대비 40% 데이터 감소
 */
export const getUserFullProfile = async (userId) => {
    try {
        const response = await instance.get(`/api/user/${userId}/profile-full`);
        return response.data.data;
    } catch (error) {
        throw new Error("풀 프로필 조회 실패");
    }
};

/**
 * 3) 채팅 상태 조회 (RandomChatComponent용)
 * 반환: 채팅 횟수, 충전 정보 등
 */
export const getUserChatStatus = async (userId) => {
    try {
        const response = await instance.get(`/api/user/${userId}/chat-status`);
        return response.data.data;
    } catch (error) {
        throw new Error("채팅 상태 조회 실패");
    }
};

/**
 * 4) 프로필 편집 정보 조회 (MyPageComponent용)
 * 반환: 편집에 필요한 11개 필드
 * 기존 getUserInfo 대비 50% 데이터 감소
 */
export const getUserForEdit = async (userId) => {
    try {
        const response = await instance.get(`/api/user/${userId}/profile-edit`);
        return response.data.data;
    } catch (error) {
        throw new Error("프로필 편집 정보 조회 실패");
    }
};