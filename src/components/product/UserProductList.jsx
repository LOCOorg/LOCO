// UserProductList.jsx
import React, { useState, useEffect } from 'react';
import { productAPI } from '../../api/adminProductAPI.js';
import ProductCard from './ProductCard.jsx';

const ProductList = ({ onProductSelect }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await productAPI.getAll();
            setProducts(response.data);
        } catch (error) {
            console.error('상품 목록 불러오기 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const subscriptionProducts = products.filter(
        (product) => product.productType === 'subscription'
    );
    const coinProducts = products.filter(
        (product) => product.productType === 'coin'
    );

    if (loading)
        return <p className="text-center">상품 목록을 불러오는 중입니다...</p>;

    return (
        <div>
            <div>
                <h2 className="text-2xl font-bold mb-4">구독 상품</h2>
                {subscriptionProducts.length === 0 ? (
                    <p>등록된 구독 상품이 없습니다.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {subscriptionProducts.map((product) => (
                            <ProductCard
                                key={product._id}
                                product={product}
                                onClick={() => onProductSelect(product)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {coinProducts.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4">코인 상품</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {coinProducts.map((product) => (
                            <ProductCard
                                key={product._id}
                                product={product}
                                onClick={() => onProductSelect(product)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductList;
