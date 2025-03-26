// src/components/PaymentFailureModal/PaymentFailureModal.jsx
import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

const PaymentFailureModal = () => {
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const paymentFailure = Cookies.get('paymentFailure');
        if (paymentFailure === 'true') {
            setShowModal(true);
            Cookies.remove('paymentFailure');
        }
    }, []);

    if (!showModal) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg relative">
                <h2 className="text-xl font-bold mb-4">결제 실패</h2>
                <p>결제에 실패했습니다. 다시 시도해 주세요.</p>
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

export default PaymentFailureModal;
