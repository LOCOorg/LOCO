import instance from './axiosInstance.js';

// [관리자] 약관 생성
export const createTerm = async (termData) => {
    try {
        const response = await instance.post('/api/terms', termData);
        return response.data;
    } catch (error) {
        console.error("Error creating term:", error);
        throw error;
    }
};

// [관리자] 약관 삭제
export const deleteTerm = async (termId) => {
    try {
        const response = await instance.delete(`/api/terms/${termId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting term:", error);
        throw error;
    }
};

// [관리자] 약관 수정
export const updateTerm = async (termId, termData) => {
    try {
        const response = await instance.put(`/api/terms/${termId}`, termData);
        return response.data;
    } catch (error) {
        console.error("Error updating term:", error);
        throw error;
    }
};

// [관리자] 모든 약관 목록 조회
export const getAllTerms = async () => {
    try {
        const response = await instance.get('/api/terms');
        return response.data;
    } catch (error) {
        console.error("Error fetching all terms:", error);
        throw error;
    }
};

// [사용자] 현재 유효한 약관 조회 (로그인 전/후 공용)
export const getActiveTerms = async () => {
    try {
        const response = await instance.get('/api/terms/active');
        return response.data;
    } catch (error) {
        console.error("Error fetching active terms:", error);
        throw error;
    }
};

// [사용자] 미동의 필수 약관 조회 (로그인 후)
export const getMissingConsents = async () => {
    try {
        const response = await instance.get('/api/terms/check-consent');
        return response.data;
    } catch (error) {
        console.error("Error checking missing consents:", error);
        throw error;
    }
};

// [사용자] 약관 동의/거절 제출
export const submitConsent = async (consents) => {
    try {
        // consents: [{ termId: "...", agreed: true/false }, ...]
        const response = await instance.post('/api/terms/consent', { consents });
        return response.data;
    } catch (error) {
        console.error("Error submitting consent:", error);
        throw error;
    }
};
