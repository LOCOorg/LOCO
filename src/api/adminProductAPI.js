import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/product';

const instance = axios.create({
    baseURL,
    withCredentials: true,
});

// 관리자 전용 상품 API: 상품 추가, 수정, 삭제 등 관리 작업을 위한 메서드
export const adminProductAPI = {
    add: (data) => instance.post('/add', data),
    update: (id, data) => instance.put(`/update/${id}`, data),
    delete: (id) => instance.delete(`/delete/${id}`),
};

// 일반 사용자용 상품 API: 상품 조회 등 공개 API 호출
export const productAPI = {
    getAll: () => instance.get('/'),
    getById: (id) => instance.get(`/${id}`),
};


