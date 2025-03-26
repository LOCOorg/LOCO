// qnaApi.js
import axios from 'axios';

const host = `${import.meta.env.VITE_API_HOST}/api/qna`;

/**
 * 백엔드에서 모든 QnA 목록을 가져옵니다.
 * @returns {Promise<Array>} QnA 목록
 */
export async function getQnas() {
    try {
        const response = await axios.get(host);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch QnAs');
    }
}

/**
 * 새로운 QnA를 생성합니다.
 * @param {Object} qnaData - 생성할 QnA 데이터 (qnaTitle, qnaContents 등)
 * @returns {Promise<Object>} 생성된 QnA 객체
 */
export async function createQna(qnaData) {
    try {
        const response = await axios.post(host, qnaData, {
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
        const response = await axios.get(`${host}/${id}`);
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
        const response = await axios.put(`${host}/${id}`, updateData, {
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
        const response = await axios.delete(`${host}/${id}`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to delete QnA');
    }
}
