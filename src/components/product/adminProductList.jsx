import React, { useState, useEffect } from 'react';
import {productAPI} from "../../api/adminProductAPI.js";

const AdminProductList = ({ onProductSelect }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await productAPI.getAll(); // GET /api/product: 전체 상품 목록 반환
            setProducts(response.data);
        } catch (error) {
            console.error('제품 목록 불러오기 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    return (
        <div className="p-6 bg-white shadow rounded-lg">
            <h2 className="text-2xl font-bold mb-4">등록된 상품</h2>
            {loading ? (
                <p>로딩 중...</p>
            ) : products.length === 0 ? (
                <p>등록된 상품이 없습니다.</p>
            ) : (
                <ul className="space-y-4">
                    {products.map((product) => (
                        <li
                            key={product._id}
                            className="p-4 border rounded-lg cursor-pointer hover:bg-gray-100"
                            onClick={() => onProductSelect(product)}
                        >
                            <h3 className="text-xl font-semibold">{product.productName}</h3>
                            <p>{product.description}</p>
                            <p className="mt-2">가격: {product.productPrice.toLocaleString()} 원</p>
                        </li>
                    ))}
                </ul>
            )}
            <button onClick={fetchProducts} className="mt-4 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                새로고침
            </button>
        </div>
    );
};

export default AdminProductList;
