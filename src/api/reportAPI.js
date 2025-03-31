
const host = `${import.meta.env.VITE_API_HOST}/api/report`;

/**
 * 전체 신고 목록을 불러오는 함수
 * @returns {Promise<Array>} 신고 목록 배열
 */
export const fetchReports = async (page = 1, size = 10) => {
    const response = await fetch(`${host}/reports?page=${page}&size=${size}`, {
        credentials: 'include'
    });
    if (!response.ok) {
        throw new Error('신고 목록을 불러오지 못했습니다.');
    }
    return response.json();
};

/**
 * 새로운 신고를 생성하는 함수
 * @param {Object} reportData - 신고 생성에 필요한 데이터
 * @returns {Promise<Object>} 생성된 신고 객체
 */
export const createReport = async (reportData) => {
    const response = await fetch(`${host}/reports`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(reportData)
    });
    if (!response.ok) {
        throw new Error('신고 생성에 실패했습니다.');
    }
    return response.json();
};

/**
 * 특정 신고를 삭제하는 함수
 * @param {String} reportId - 삭제할 신고의 고유 ID
 * @returns {Promise<Object>} 삭제 결과 메시지 객체
 */
export const deleteReport = async (reportId) => {
    const response = await fetch(`${host}/reports/${reportId}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    if (!response.ok) {
        throw new Error('신고 삭제에 실패했습니다.');
    }
    return response.json();
};

/**
 * 신고에 대한 답변을 저장하는 함수
 * @param {String} reportId - 답변할 신고의 ID
 * @param {Object} replyData - 답변 데이터({ replyTitle, replyContent })
 * @returns {Promise<Object>} 답변 저장 결과
 */
export const replyToReport = async (reportId, replyData) => {
    const response = await fetch(`${host}/reports/${reportId}/reply`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(replyData)
    });
    if (!response.ok) {
        throw new Error('답변 저장에 실패했습니다.');
    }
    return response.json();
};

