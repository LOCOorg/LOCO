// src/routers/MyPageRouter.jsx
import MyPage from "../pages/myPage/MyPage.jsx";
import AuthRequiredGuard from "../components/authComponent/AuthRequiredGuard.jsx";

const MyPageRouter = {
    path: "/mypage",
    element: (
        <AuthRequiredGuard>
            <MyPage />
        </AuthRequiredGuard>
    )
};

export default MyPageRouter;
