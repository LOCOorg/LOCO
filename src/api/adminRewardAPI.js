import axiosInstance from './axiosInstance';

/**
 * 보상 지급을 위한 사용자 검색
 */
export const searchUsersForReward = async (params) => {
    try {
        const response = await axiosInstance.get('/api/admin/reward/users', { params });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * 채팅 횟수 보상 지급
 */
export const giveChatReward = async (data) => {
    try {
        const response = await axiosInstance.post('/api/admin/reward/give', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * 보상 지급 내역 조회
 */
export const getRewardLogs = async (params) => {
    try {
        const response = await axiosInstance.get('/api/admin/reward/logs', { params });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * 특정 보상의 상세 아이템 조회
 */
export const getRewardLogItems = async (logId) => {
    try {
        const response = await axiosInstance.get(`/api/admin/reward/logs/${logId}/items`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * 보상 지급 취소
 */
export const cancelReward = async (data) => {
    try {
        const response = await axiosInstance.post('/api/admin/reward/cancel', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * 그룹 보상 전체 취소
 */
export const cancelAllRewards = async (data) => {
    try {
        const response = await axiosInstance.post('/api/admin/reward/cancel-all', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
