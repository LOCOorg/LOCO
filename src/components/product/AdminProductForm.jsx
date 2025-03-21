import React, { useState, useEffect } from 'react';
import {adminProductAPI} from "../../api/adminProductAPI.js";

const AdminProductForm = ({ initialData, onSuccess, onCancel }) => {
    const [productName, setProductName] = useState('');
    const [productType, setProductType] = useState('subscription');
    const [subscriptionTier, setSubscriptionTier] = useState('basic');
    const [description, setDescription] = useState('');
    const [productPrice, setProductPrice] = useState('');
    const [durationInDays, setDurationInDays] = useState('');
    const [coinAmount, setCoinAmount] = useState('');
    const [active, setActive] = useState(true);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // 초기 데이터가 변경되면 폼 값 채우기
    useEffect(() => {
        if (initialData) {
            setProductName(initialData.productName || '');
            setProductType(initialData.productType || 'subscription');
            setSubscriptionTier(initialData.subscriptionTier || 'basic');
            setDescription(initialData.description || '');
            setProductPrice(initialData.productPrice || '');
            setDurationInDays(initialData.durationInDays || '');
            setCoinAmount(initialData.coinAmount || '');
            setActive(initialData.active !== undefined ? initialData.active : true);
        } else {
            setProductName('');
            setProductType('subscription');
            setSubscriptionTier('basic');
            setDescription('');
            setProductPrice('');
            setDurationInDays('');
            setCoinAmount('');
            setActive(true);
        }
    }, [initialData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const productData = {
            productName,
            productType,
            description,
            productPrice: Number(productPrice),
            active,
        };

        if (productType === 'subscription') {
            productData.subscriptionTier = subscriptionTier;
            productData.durationInDays = Number(durationInDays);
        } else if (productType === 'coin') {
            productData.coinAmount = Number(coinAmount);
        }

        try {
            let response;
            if (initialData && initialData._id) {
                // 수정 요청 (PUT)
                response = await adminProductAPI.update(initialData._id, productData);
            } else {
                // 신규 추가 (POST)
                response = await adminProductAPI.add(productData);
            }
            if (response.data) {
                setMessage(initialData ? '상품이 성공적으로 수정되었습니다.' : '상품이 성공적으로 추가되었습니다.');
                if (!initialData) {
                    // 추가 시 폼 초기화
                    setProductName('');
                    setDescription('');
                    setProductPrice('');
                    setDurationInDays('');
                    setCoinAmount('');
                }
                onSuccess && onSuccess();
            }
        } catch (error) {
            console.error('상품 저장 실패:', error);
            setMessage('상품 저장에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-white shadow rounded-lg">
            <h2 className="text-2xl font-bold mb-4">{initialData ? '상품 수정' : '상품 추가'}</h2>
            {message && <p className="mb-4 text-green-600">{message}</p>}
            <div className="mb-4">
                <label className="block text-gray-700">상품명</label>
                <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700">상품 타입</label>
                <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                >
                    <option value="subscription">구독</option>
                    <option value="coin">재화</option>
                </select>
            </div>
            {productType === 'subscription' && (
                <>
                    <div className="mb-4">
                        <label className="block text-gray-700">구독 티어</label>
                        <select
                            value={subscriptionTier}
                            onChange={(e) => setSubscriptionTier(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg"
                            required
                        >
                            <option value="basic">배이직</option>
                            <option value="standard">스텐다드</option>
                            <option value="premium">프리미엄</option>
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700">구독 기간 (일)</label>
                        <input
                            type="number"
                            value={durationInDays}
                            onChange={(e) => setDurationInDays(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg"
                            placeholder="예: 30"
                            required
                        />
                    </div>
                </>
            )}
            {productType === 'coin' && (
                <div className="mb-4">
                    <label className="block text-gray-700">코인 수량</label>
                    <input
                        type="number"
                        value={coinAmount}
                        onChange={(e) => setCoinAmount(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                    />
                </div>
            )}
            <div className="mb-4">
                <label className="block text-gray-700">상품 설명</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    rows="3"
                />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700">상품 가격 (원)</label>
                <input
                    type="number"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                />
            </div>
            <div className="mb-4 flex items-center">
                <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="mr-2"
                />
                <label className="text-gray-700">활성화</label>
            </div>
            <div className="flex gap-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="py-3 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    {loading ? (initialData ? '수정 중...' : '저장 중...') : (initialData ? '수정하기' : '상품 추가')}
                </button>
                {initialData && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="py-3 px-6 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                        취소
                    </button>
                )}
            </div>
        </form>
    );
};

export default AdminProductForm;
