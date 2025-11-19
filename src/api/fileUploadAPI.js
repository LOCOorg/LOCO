//프로필 사진 업로드
// src/api/fileUploadAPI.js
import API from './axiosInstance.js';

export const uploadFile = async (file, sourcePage) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sourcePage', sourcePage);

    try {
        const response = await API.post('/api/upload', formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data.url;
    } catch (error) {
        console.error("파일 업로드 실패:", error.response?.data || error.message);
        throw error;
    }
};


export const getUserUploads = async (userId) => {
    try {
        // 새로 추가: 유저별 업로드 조회 엔드포인트 호출
        // axiosInstance.js의 baseURL + withCredentials 설정 덕분에
        // 쿠키가 자동으로 포함되어 인증이 처리됩니다.
        const res = await API.get(`/api/upload/${userId}`);
        return res.data.uploads;
    } catch (err) {
        console.error("유저 업로드 목록 불러오기 실패:", err.response?.data || err.message);
        throw err;
    }
};