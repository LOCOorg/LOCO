// qnaApi.js

import instance from './axiosInstance';



/**
 * 백엔드에서 모든 QnA 목록을 가져옵니다.
 * @returns {Promise<Array>} QnA 목록
 */
export async function getQnas() {
    try {
        const response = await instance.get('/api/qna');
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch QnAs');
    }
}

/**
 * 페이지네이션을 적용하여 qnaStatus에 따른 QnA 목록을 가져옵니다.
 * @param {number} page - 요청할 페이지 번호
 * @param {number} size - 페이지당 데이터 수
 * @param {string} status - QnA 상태 ("답변대기" 또는 "답변완료")
 * @returns {Promise<Object>} 페이지네이션된 QnA 데이터와 페이징 정보
 */
export async function getQnaPageByStatus(page, size, status, keyword = "", searchType = 'both') {
    try {
        const response = await instance.get('/api/qna', {
            params: { page, size, qnaStatus: status, keyword, searchType }
        });
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch QnA page by status');
    }
}


/**
 * 새로운 QnA를 생성합니다.
 * @param {Object} qnaData - 생성할 QnA 데이터 (qnaTitle, qnaContents 등)
 * @returns {Promise<Object>} 생성된 QnA 객체
 */
export async function createQna(qnaData) {
    try {
        const response = await instance.post('/api/qna', qnaData, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        throw new Error('Failed to create QnA');
    }
}

/**
 * 주어진 QnA ID에 해당하는 QnA의 상세 정보를 가져옵니다.
 * @param {string} id - QnA ID
 * @returns {Promise<Object>} QnA 상세 정보
 */
export async function getQnaById(id) {
    try {
        const response = await instance.get(`/api/qna/${id}`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch QnA details');
    }
}

/**
 * 주어진 QnA ID에 해당하는 QnA를 업데이트합니다.
 * @param {string} id - QnA ID
 * @param {Object} updateData - 업데이트할 데이터
 * @returns {Promise<Object>} 업데이트된 QnA 객체
 */
export async function updateQna(id, updateData) {
    try {
        const response = await instance.put(`/api/qna/${id}`, updateData, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        throw new Error('Failed to update QnA');
    }
}

/**
 * 주어진 QnA ID에 해당하는 QnA를 삭제합니다.
 * @param {string} id - 삭제할 QnA의 ID
 * @returns {Promise<Object>} 삭제 결과
 */
export async function deleteQna(id) {
    try {
        const response = await instance.delete(`/api/qna/${id}`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to delete QnA');
    }
}
