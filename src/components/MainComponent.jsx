import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/authStore.js";
import PlanButton from "./product/PlanButton.jsx";

function MainComponent() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const handleNavigate = () => {
        navigate("/chat");
    };

    const handleNavigateLogin = () => {
        if (user) {
            // 로그인 상태이면 로그아웃 처리 후 로그인 페이지로 이동
            logout();
            navigate("/loginPage");
        } else {
            // 로그인 상태가 아니면 로그인 페이지로 이동
            navigate("/loginPage");
        }
    };
    const handleProductRegistration = () => {
        navigate("/adminproducts");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-6">홈</h1>
            {user && <p className="mb-4 text-xl">안녕하세요, {user.name}님!</p>}
            <button
                onClick={handleNavigate}
                className="px-6 py-3 bg-blue-500 text-white text-lg rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                채팅하러 가기
            </button>
            <button
                onClick={handleNavigateLogin}
                className="mt-4 px-6 py-3 bg-purple-500 text-white text-lg rounded-lg shadow-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
                {user ? "로그아웃" : "로그인"}
            </button>
            <button
                onClick={handleProductRegistration}
                className="mt-4 px-6 py-3 bg-green-500 text-white text-lg rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
                상품등록
            </button>
            <PlanButton />  {/* productShowcase 플랜 버튼 추가 */}

        </div>
    );
}

export default MainComponent;
