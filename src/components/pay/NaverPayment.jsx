// src/components/pay/NaverPayment.jsx
import React from 'react';
import axios from 'axios';

const NaverPayment = ({ product }) => {
    const handleNaverPayment = async () => {
        try {
            // 백엔드의 네이버 결제 준비 엔드포인트 호출
            // 실제 엔드포인트와 파라미터는 네이버 간편결제 공식문서를 참고하여 수정하세요.
            const response = await axios.post('/api/naver-pay/ready', {
                productId: product._id,
                amount: product.productPrice,
            });
            // 응답으로 받은 결제 리다이렉트 URL로 이동
            const { paymentUrl } = response.data;
            window.location.href = paymentUrl;
        } catch (error) {
            console.error('Naver 결제 오류:', error);
            alert('네이버 결제 진행 중 오류가 발생했습니다.');
        }
    };

    return (
        <button
            onClick={handleNaverPayment}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
            네이버 간편결제
        </button>
    );
};

export default NaverPayment;
