import { useNavigate } from "react-router-dom";

function MainComponent() {
    const navigate = useNavigate();

    const handleNavigate = () => {
        navigate("/chat");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-6">홈</h1>
            <button
                onClick={handleNavigate}
                className="px-6 py-3 bg-blue-500 text-white text-lg rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                채팅하러 가기
            </button>
        </div>
    );
}

export default MainComponent;
