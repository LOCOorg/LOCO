// src/api/editorAPI.js
import instance from './axiosInstance';

/**
 * 에디터 이미지 업로드 API
 * @param {File} file - 업로드할 이미지 파일
 * @returns {Promise<Object>} - 업로드 결과
 */
export const uploadEditorImage = async (file) => {
    try {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await instance.post('/api/editor/upload-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        
        // 서버 응답을 그대로 반환
        return response.data;
    } catch (error) {
        console.error('이미지 업로드 실패:', error);
        
        // 에러 상황에서도 일관된 형태로 응답
        return {
            success: false,
            message: error.response?.data?.message || error.message || '이미지 업로드에 실패했습니다.',
            error: error
        };
    }
};

/**
 * 에디터 콘텐츠 저장 API
 * @param {string} content - HTML 콘텐츠
 * @param {string} title - 제목
 * @returns {Promise<Object>} - 저장 결과
 */
export const saveEditorContent = async (content, title) => {
    try {
        const response = await instance.post('/api/editor/save-content', {
            content,
            title,
        });
        
        return response.data;
    } catch (error) {
        console.error('콘텐츠 저장 실패:', error);
        throw new Error('콘텐츠 저장에 실패했습니다.');
    }
};

/**
 * 저장된 콘텐츠 불러오기 API
 * @param {string} contentId - 콘텐츠 ID
 * @returns {Promise<Object>} - 콘텐츠 데이터
 */
export const loadEditorContent = async (contentId) => {
    try {
        const response = await instance.get(`/api/editor/content/${contentId}`);
        return response.data;
    } catch (error) {
        console.error('콘텐츠 로드 실패:', error);
        throw new Error('콘텐츠를 불러오는데 실패했습니다.');
    }
};

// 기존 코드와의 호환성을 위한 editorService 객체
export const editorService = {
    uploadImage: uploadEditorImage,
    uploadEditorImage: uploadEditorImage, // 추가
    saveContent: saveEditorContent,
    loadContent: loadEditorContent,
};