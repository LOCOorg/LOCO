import React, { useState } from 'react';
import AdminProductForm from '../../components/product/AdminProductForm.jsx';
import AdminProductList from './adminProductList.jsx';

const ManageProductsPage = () => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    // 새로고침을 위해 키 값을 변경하는 방식(상품 목록 컴포넌트 재렌더링)
    const [refreshKey, setRefreshKey] = useState(0);

    const handleProductSelect = (product) => {
        setSelectedProduct(product);
    };

    const handleFormSuccess = () => {
        setSelectedProduct(null);
        setRefreshKey((prev) => prev + 1);
    };

    const handleCancelEdit = () => {
        setSelectedProduct(null);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold mb-6 text-center">상품 관리</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <AdminProductForm
                        initialData={selectedProduct}
                        onSuccess={handleFormSuccess}
                        onCancel={handleCancelEdit}
                    />
                </div>
                <div>
                    <AdminProductList key={refreshKey} onProductSelect={handleProductSelect} />
                </div>
            </div>
        </div>
    );
};

export default ManageProductsPage;
