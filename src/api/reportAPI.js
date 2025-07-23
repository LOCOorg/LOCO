import axios from 'axios';

const host = `${import.meta.env.VITE_API_HOST}/api/report`;

/**
 * 전체 신고 목록을 불러오는 함수
 * @returns {Promise<Array>} 신고 목록 배열
 */
export const fetchReports = async (page = 1, size = 10, filters = {}) => {
    try {
        const response = await axios.get(`${host}/reports`, {
            params: { page, size, ...filters },
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        throw new Error('신고 목록을 불러오지 못했습니다.');
    }
};

/**
 * 새로운 신고를 생성하는 함수
 * @param {Object} reportData - 신고 생성에 필요한 데이터
 * @returns {Promise<Object>} 생성된 신고 객체
 */
export const createReport = async (reportData) => {
    try {
        const response = await axios.post(`${host}/reports`, reportData, {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        throw new Error('신고 생성에 실패했습니다.');
    }
};

/**
 * 특정 신고를 삭제하는 함수
 * @param {String} reportId - 삭제할 신고의 고유 ID
 * @returns {Promise<Object>} 삭제 결과 메시지 객체
 */
export const deleteReport = async (reportId) => {
    try {
        const response = await axios.delete(`${host}/reports/${reportId}`, {
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        throw new Error('신고 삭제에 실패했습니다.');
    }
};

/**
 * 신고에 대한 답변을 저장하는 함수
 * @param {String} reportId - 답변할 신고의 ID
 * @param {Object} replyData - 답변 데이터({ replyTitle, replyContent })
 * @returns {Promise<Object>} 답변 저장 결과
 */
export const replyToReport = async (reportId, replyData) => {
    try {
        const response = await axios.post(`${host}/reports/${reportId}/reply`, replyData, {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        throw new Error('답변 저장에 실패했습니다.');
    }
};

/* 관리자가 신고된 채팅방의 메시지를 받는 함수 */
export const fetchReportChatLog = async (reportId) => {
    try {
        const res = await axios.get(`${host}/reports/${reportId}/chat-log`, {
            withCredentials: true,
        });
        return res.data;          // 메시지 배열
    } catch {
        throw new Error('채팅 로그를 불러오지 못했습니다.');
    }
};
