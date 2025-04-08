//프로필 사진 업로드
// src/api/fileUploadAPI.js
import axios from 'axios';

export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await axios.post(`${import.meta.env.VITE_API_HOST}/api/upload`, formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return response.data.url;
    } catch (error) {
        console.error("파일 업로드 실패:", error.response?.data || error.message);
        throw error;
    }
};
