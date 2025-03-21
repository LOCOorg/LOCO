import {createBrowserRouter} from "react-router-dom";
import IndexPage from "../pages/IndexPage.jsx";
import ChatRouter from "./ChatRouter.jsx";
import CommunityRouter from "./CommunityRouter.jsx";
import SignupPage from "../pages/signupPage/SignupPage.jsx";  // SignupPage 페이지 추가
import LoginHandler from "../components/authComponent/LoginHandler.jsx";
import NaverLoginHandler from "../components/authComponent/NaverLoginHandler.jsx";
import LoginRouter from "./LoginRouter.jsx";
import AdminProductRouter from "./ProductRouter.jsx";
import ProductShowcaseRouter from "./ProductShowcaseRouter.jsx";


const MainRouter = createBrowserRouter([
    {
        path: "/",
        element: <IndexPage/>
    },
    ChatRouter,
    CommunityRouter,
    {
        path: "/signupPage",
        element: <SignupPage/>
    },
    {
        path: "/auth/callback",                    // (추가) OAuth 콜백 처리 경로
        element: <LoginHandler/>                   // 카카오 로그인 핸들러 컴포넌트 렌더링 (추가)
    },
    {
        path: "/auth/naver/callback",
        element: <NaverLoginHandler/>  // 네이버 로그인 콜백 처리
    },

    ChatRouter,
    LoginRouter,
    AdminProductRouter,
    ProductShowcaseRouter
])

export default MainRouter;