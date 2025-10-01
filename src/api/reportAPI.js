import axios from 'axios';

const host = `${import.meta.env.VITE_API_HOST}/api/report`;

/**
 * 전체 신고 목록을 불러오는 함수
 * @returns {Promise<Array>} 신고 목록 배열
 */
export const fetchReports = async (page = 1, size = 10, filters = {}, orderByDate = 'desc') => {
    try {
        const response = await axios.get(`${host}/reports`, {
            params: {
                page,
                size,
                ...filters,
                orderByDate  // 정렬 순서 파라미터 추가
            },
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

/**
 * 🎯 관리자/개발자가 신고된 채팅방의 메시지를 받는 함수 (V2)
 * 
 * @param {string} reportId - 신고 ID
 * @param {string} mode - 'admin' (신고 메시지만) | 'developer' (전후 30개씩)
 * @returns {Promise<Object>} 채팅 로그 데이터
 * 
 * 📌 변경사항:
 * - admin 모드: 신고된 메시지만 반환
 * - developer 모드: 신고된 메시지 + 전후 30개씩 반환 (총 61개)
 */
/**
 * 🔒 신고된 메시지 평문 내용 조회 (관리자용)
 * 
 * ReportedMessageBackup에서 평문으로 저장된 내용을 가져옵니다.
 * 
 * @param {string} reportId - 신고 ID
 * @returns {Promise<Object>} 평문 메시지 데이터
 */
export const fetchReportedMessagePlaintext = async (reportId) => {
    try {
        const response = await axios.get(`${host}/reports/${reportId}/plaintext`, {
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        console.error('평문 메시지 조회 실패:', error);
        throw new Error(error.response?.data?.message || '신고 내용을 불러오지 못했습니다.');
    }
};

export const fetchReportChatLog = async (reportId, mode = 'admin') => {
    try {
        const res = await axios.get(`${host}/reports/${reportId}/chat-log`, {
            params: { mode }, // 🔐 모드 파라미터 추가
            withCredentials: true,
        });
        return res.data;
    } catch (error) {
        console.error('채팅 로그 조회 실패:', error);
        throw new Error(error.response?.data?.message || '채팅 로그를 불러오지 못했습니다.');
    }
};
