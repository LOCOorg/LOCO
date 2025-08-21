import instance from './axiosInstance.js';

// 배너 API 함수들
export const bannerService = {
    // 활성 배너 목록 조회 (메인페이지용)
    async getActiveBanners() {
        try {
            const response = await instance.get('/api/banners/active');
            return response.data;
        } catch (error) {
            console.error('활성 배너 목록 조회 실패:', error);
            throw error;
        }
    },

    // 모든 배너 목록 조회 (관리자용)
    async getAllBanners(params = {}) {
        try {
            const response = await instance.get('/api/banners', { params });
            return response.data;
        } catch (error) {
            console.error('배너 목록 조회 실패:', error);
            throw error;
        }
    },

    // 배너 상세 조회
    async getBannerDetail(id) {
        try {
            const response = await instance.get(`/api/banners/${id}`);
            return response.data;
        } catch (error) {
            console.error('배너 상세 조회 실패:', error);
            throw error;
        }
    },

    // 배너 생성
    async createBanner(bannerData, imageFile) {
        try {
            const formData = new FormData();
            
            // 텍스트 데이터 추가
            Object.keys(bannerData).forEach(key => {
                if (bannerData[key] !== undefined && bannerData[key] !== null) {
                    formData.append(key, bannerData[key]);
                }
            });
            
            // 이미지 파일 추가
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const response = await instance.post('/api/banners', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            return response.data;
        } catch (error) {
            console.error('배너 생성 실패:', error);
            throw error;
        }
    },

    // 배너 수정
    async updateBanner(id, bannerData, imageFile = null) {
        try {
            const formData = new FormData();
            
            Object.keys(bannerData).forEach(key => {
                if (bannerData[key] !== undefined && bannerData[key] !== null) {
                    formData.append(key, bannerData[key]);
                }
            });
            
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const response = await instance.put(`/api/banners/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            return response.data;
        } catch (error) {
            console.error('배너 수정 실패:', error);
            throw error;
        }
    },

    // 배너 삭제
    async deleteBanner(id) {
        try {
            const response = await instance.delete(`/api/banners/${id}`);
            return response.data;
        } catch (error) {
            console.error('배너 삭제 실패:', error);
            throw error;
        }
    },

    // 배너 클릭 수 증가
    async incrementViews(id) {
        try {
            const response = await instance.post(`/api/banners/${id}/view`);
            return response.data;
        } catch (error) {
            console.error('배너 조회수 증가 실패:', error);
            throw error;
        }
    }
};

export default bannerService;
