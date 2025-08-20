import instance from './axiosInstance.js';

// 뉴스 API 함수들
export const newsService = {
    // 뉴스 목록 조회
    async getNewsList(params = {}) {
        try {
            const response = await instance.get('/api/news', { params });
            return response.data;
        } catch (error) {
            console.error('뉴스 목록 조회 실패:', error);
            throw error;
        }
    },

    // 뉴스 상세 조회
    async getNewsDetail(id) {
        try {
            const response = await instance.get(`/api/news/${id}`);
            return response.data;
        } catch (error) {
            console.error('뉴스 상세 조회 실패:', error);
            throw error;
        }
    },

    // 뉴스 작성 (이미지 포함)
    async createNews(newsData, images = []) {
        try {
            const formData = new FormData();
            
            // 텍스트 데이터 추가
            Object.keys(newsData).forEach(key => {
                formData.append(key, newsData[key]);
            });
            
            // 이미지 파일 추가
            images.forEach(image => {
                formData.append('images', image);
            });

            const response = await instance.post('/api/news', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            return response.data;
        } catch (error) {
            console.error('뉴스 작성 실패:', error);
            throw error;
        }
    },

    // 뉴스 수정
    async updateNews(id, newsData, images = []) {
        try {
            const formData = new FormData();
            
            Object.keys(newsData).forEach(key => {
                formData.append(key, newsData[key]);
            });
            
            images.forEach(image => {
                formData.append('images', image);
            });

            const response = await instance.put(`/api/news/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            return response.data;
        } catch (error) {
            console.error('뉴스 수정 실패:', error);
            throw error;
        }
    },

    // 뉴스 삭제
    async deleteNews(id) {
        try {
            const response = await instance.delete(`/api/news/${id}`);
            return response.data;
        } catch (error) {
            console.error('뉴스 삭제 실패:', error);
            throw error;
        }
    }
};

export default newsService;
