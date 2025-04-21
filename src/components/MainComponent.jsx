// src/components/MainComponent.jsx
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/authStore.js";
import FriendListPanel from "../components/MyPageComponent/FriendListPanel.jsx";
import PlanButton from "./product/PlanButton.jsx";
import PaymentStatusModal from "./pay/PaymentStatusModal.jsx";
import MyPageButton from "./MyPageComponent/MyPageButton.jsx";
import PRButton from "./PR/PRButton.jsx";
import DeveloperButton from "./DeveloperComponent/DeveloperButton.jsx";
import ReportNotificationModal from "./reportcomponents/ReportNotificationModal.jsx";

function MainComponent() {
    const navigate = useNavigate();
    const authUser = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    const handleNavigateChat = () => navigate("/chat");
    const handleCommunity = () => navigate("/community");
    const handleNavigateLogin = () => {
        if (authUser) logout();
        navigate("/loginPage");
    };
    const handleProductRegistration = () => navigate("/adminproducts");

    return (
        <>
            <PaymentStatusModal />
            <ReportNotificationModal />

            <div className="flex flex-col lg:flex-row items-start justify-start min-h-screen bg-gray-50 p-6 lg:space-x-6">
                {/* 왼쪽: 친구 목록 패널 */}
                <FriendListPanel />

                {/* 오른쪽: 액션 버튼들 */}
                <div className="flex flex-col items-center lg:items-start space-y-4">
                    <MyPageButton />
                    <button
                        onClick={handleNavigateChat}
                        className="px-6 py-3 bg-blue-500 text-white text-lg rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        채팅하러 가기
                    </button>
                    <button
                        onClick={handleCommunity}
                        className="px-6 py-3 bg-green-500 text-white text-lg rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        커뮤니티
                    </button>
                    <button
                        onClick={handleNavigateLogin}
                        className="px-6 py-3 bg-purple-500 text-white text-lg rounded-lg shadow-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        {authUser ? "로그아웃" : "로그인"}
                    </button>
                    <button
                        onClick={handleProductRegistration}
                        className="px-6 py-3 bg-green-500 text-white text-lg rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                        상품등록
                    </button>
                    <PlanButton />
                    <PRButton />
                    <DeveloperButton />
                </div>
            </div>
        </>
    );
}

export default MainComponent;
