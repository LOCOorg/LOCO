// src/components/PaymentStatusModal/PaymentStatusModal.jsx
import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

const PaymentStatusModal = () => {
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const paymentSuccess = Cookies.get('paymentSuccess');
        if (paymentSuccess === 'true') {
            setShowModal(true);
            // 쿠키 제거 (플래시 메시지는 한 번만 보여줌)
            Cookies.remove('paymentSuccess');
            // 3초 후 자동 닫기 (사용자가 직접 닫을 수 있으므로 필요에 따라 조정)
            const timer = setTimeout(() => setShowModal(false), 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    if (!showModal) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg relative">
                <h2 className="text-xl font-bold mb-4">결제 성공</h2>
                <p>구독 결제가 성공적으로 완료되었습니다.</p>
                {/* 버튼이 텍스트 아래 한 줄에 나오도록 mt-6 클래스 적용 */}
                <button
                    className="mt-6 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    onClick={() => setShowModal(false)}
                >
                    확인
                </button>
            </div>
        </div>
    );
};

export default PaymentStatusModal;
