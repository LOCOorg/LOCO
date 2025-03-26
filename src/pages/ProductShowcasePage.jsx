// src/pages/ProductShowcasePage.jsx
import React from 'react';
import ProductList from '../components/product/UserProductList.jsx';
import BasicLayout from "../layout/BasicLayout.jsx";

const ProductShowcasePage = () => {
    return (
        <BasicLayout>
        <div className="min-h-screen p-6 bg-gray-100">
            <h1 className="text-3xl font-bold mb-6 text-center">상품 진열 페이지</h1>
            <ProductList />
        </div>
        </BasicLayout>
    );
};

export default ProductShowcasePage;
