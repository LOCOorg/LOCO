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

// 기존 코드와의 호환성을 위한 editorService 객체
export const editorService = {
    uploadEditorImage: uploadEditorImage,
};