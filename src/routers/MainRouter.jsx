import {createBrowserRouter} from "react-router-dom";

import AuthGuard from '../components/authComponent/AuthGuard.jsx';
import BasicLayout from "../layout/BasicLayout.jsx";

import IndexPage from "../pages/IndexPage.jsx";
import ChatRouter from "./ChatRouter.jsx";

import CommunityRouter from "./CommunityRouter.jsx";
import SignupPage from "../pages/signupPage/SignupPage.jsx";  // SignupPage 페이지 추가

import LoginHandler from "../components/authComponent/LoginHandler.jsx";
import NaverLoginHandler from "../components/authComponent/NaverLoginHandler.jsx";

import LoginRouter from "./LoginRouter.jsx";
import AdminProductRouter from "./ProductRouter.jsx";

import ProductShowcaseRouter from "./ProductShowcaseRouter.jsx";
import QnaRouter from "./QnaRouter.jsx";

import MyPageRouter from "./MyPageRouter.jsx";
import ReportRouter from "./ReportRouter.jsx";

import PRRouter from "./PRRouter.jsx";
import DeveloperRouter from "./DeveloperRouter.jsx";
import NewsRouter from "./NewsRouter.jsx";

const MainRouter = createBrowserRouter([
    {
        path: "/",
        element: <AuthGuard>
            <BasicLayout />
        </AuthGuard>,
        children: [
            { index: true,                     element: <IndexPage /> },
            { path: "signupPage",              element: <SignupPage /> },
            { path: "auth/callback",           element: <LoginHandler /> },
            { path: "auth/naver/callback",     element: <NaverLoginHandler /> },
            CommunityRouter,
            ChatRouter,
            LoginRouter,
            AdminProductRouter,
            ProductShowcaseRouter,
            QnaRouter,
            ...ReportRouter,
            MyPageRouter,
            NewsRouter,
            PRRouter,
            DeveloperRouter,
        ],
    },
]);

export default MainRouter;