// src/components/ProductCard.jsx
import React, { useState } from 'react';
import PaymentModal from '../../components/pay/PaymentModal.jsx';

const ProductCard = ({ product, onClick }) => {
    const [isModalOpen, setModalOpen] = useState(false);

    // "구독하기" 버튼 클릭 시 모달 열기
    const handleSubscribeClick = (e) => {
        e.stopPropagation(); // 카드의 다른 클릭 이벤트 방지
        setModalOpen(true);
    };

    return (
        <div
            onClick={onClick}
            className="border rounded-lg p-4 shadow hover:shadow-lg transition cursor-pointer relative"
        >
            <h3 className="text-xl font-bold mb-2">{product.productName}</h3>
            <p className="text-gray-600 mb-2">{product.description}</p>
            <p className="text-lg font-semibold">
                {product.productPrice.toLocaleString()} 원
            </p>
            {product.productType === 'subscription' && product.subscriptionTier && (
                <>
                    <p className="text-sm text-gray-500">
                        구독 티어: {product.subscriptionTier}
                    </p>
                    <button
                        onClick={handleSubscribeClick}
                        className="mt-2 py-1 px-3 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                        구독하기
                    </button>
                </>
            )}
            {product.productType === 'coin' && product.coinAmount && (
                <p className="text-sm text-gray-500">제공 코인: {product.coinAmount}</p>
            )}

            {isModalOpen && (
                <PaymentModal
                    product={product}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div>
    );
};

export default ProductCard;
