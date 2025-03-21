import React from 'react';
import axios from 'axios';
import useAuthStore from "../../stores/authStore.js"; // zustand를 통해 사용자 정보 가져오기

const KakaoPayment = ({ product }) => {
    const { user } = useAuthStore();
    // 로그인한 사용자의 ID (없으면 'unknown')
    const partnerUserId = user?._id || 'unknown';

    // 결제 준비 응답을 받고 사용자의 환경에 맞는 리다이렉트 URL로 이동하는 함수
    const handlePaymentRedirect = (responseData) => {
        // 사용자의 환경에 맞게 URL 선택
        // 여기서는 PC 웹 환경 예시로 next_redirect_pc_url 사용
        const redirectUrl = responseData.next_redirect_pc_url;
        console.log("리다이렉트 URL:", redirectUrl);
        // 브라우저를 해당 URL로 이동시킵니다.
        window.location.href = redirectUrl;
    };

    // 카카오 결제 준비 요청 함수
    const handleKakaoPayment = async () => {
        try {
            const response = await axios.post('/api/kakao-pay/subscribe/ready', {
                productId: product._id,
                productName: product.productName, // 추가
                amount: product.productPrice,
                partnerUserId,
            });
            console.log("Kakao Pay 초기 정기 결제 준비 응답:", response.data);
            // 결제 준비 응답을 받은 후, handlePaymentRedirect 함수를 호출하여 리다이렉트 처리
            handlePaymentRedirect(response.data);
        } catch (error) {
            console.error('Kakao 구독 결제 오류:', error);
            alert('카카오 구독 결제 진행 중 오류가 발생했습니다.');
        }
    };

    return (
        <button
            onClick={handleKakaoPayment}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
            카카오 간편결제
        </button>
    );
};

export default KakaoPayment;
