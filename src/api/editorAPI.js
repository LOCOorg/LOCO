import instance from './axiosInstance.js';

// 에디터 API 함수들
export const editorService = {
    // 에디터 이미지 업로드
    async uploadEditorImage(imageFile) {
        try {
            const formData = new FormData();
            formData.append('image', imageFile);

            const response = await instance.post('/api/editor/editor-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            return response.data;
        } catch (error) {
            console.error('에디터 이미지 업로드 실패:', error);
            throw error;
        }
    }
};

export default editorService;
