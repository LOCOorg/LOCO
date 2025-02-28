// src/common/LoadingComponent.jsx
// eslint-disable-next-line react/prop-types
const LoadingComponent = ({ message = "로딩 중..." }) => {
    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <p>{message}</p>
                <div className="spinner"></div>
            </div>
        </div>
    );
};

export default LoadingComponent;
