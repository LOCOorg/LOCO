import axiosInstance from './axiosInstance';

/**
 * 시스템 전체 상태 조회 (캐시, 보안, DB 등)
 */
export const getSystemStatus = async () => {
    try {
        const response = await axiosInstance.get('/api/admin/monitoring/status');
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * 유저 전체 통계 및 상태 조회
 */
export const getUserStatistics = async () => {
    try {
        const response = await axiosInstance.get('/api/admin/monitoring/users');
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * 캐시 강제 비우기
 * @param {string} pattern - 삭제할 패턴 (기본 '*')
 */
export const flushCache = async (pattern = '*') => {
    try {
        const response = await axiosInstance.post('/api/admin/monitoring/cache/flush', { pattern });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Redis 강제 재연결 시도
 */
export const reconnectRedis = async () => {
    try {
        const response = await axiosInstance.post('/api/admin/monitoring/cache/reconnect');
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
