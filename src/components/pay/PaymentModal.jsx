// src/components/pay/PaymentModal.jsx
import React from 'react';
import KakaoPayment from "./KakaoPayment.jsx";
import NaverPayment from "./NaverPayment.jsx";


const PaymentModal = ({ product, onClose }) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">결제하기</h2>
                <p className="mb-4">상품: {product.productName}</p>
                <div className="flex flex-col gap-4">
                    <KakaoPayment product={product} />
                    <NaverPayment product={product} />
                </div>
                <button
                    onClick={onClose}
                    className="mt-6 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                    닫기
                </button>
            </div>
        </div>
    );
};

export default PaymentModal;
