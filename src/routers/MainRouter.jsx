import {createBrowserRouter} from "react-router-dom";

import AuthGuard from '../components/authComponent/AuthGuard.jsx';
import SignupGuard from '../components/authComponent/SignupGuard.jsx';
import BasicLayout from "../layout/BasicLayout.jsx";

import IndexPage from "../pages/IndexPage.jsx";
import ChatRouter from "./ChatRouter.jsx";

import CommunityRouter from "./CommunityRouter.jsx";
import SignupPage from "../pages/signupPage/SignupPage.jsx";

import LoginHandler from "../components/authComponent/LoginHandler.jsx";
import NaverLoginHandler from "../components/authComponent/NaverLoginHandler.jsx";

import LoginRouter from "./LoginRouter.jsx";

import QnaRouter from "./QnaRouter.jsx";

import MyPageRouter from "./MyPageRouter.jsx";
import ReportRouter from "./ReportRouter.jsx";

import PRRouter from "./PRRouter.jsx";
import DeveloperRouter from "./DeveloperRouter.jsx";
import NewsRouter from "./NewsRouter.jsx";
import BannerRouter from "./BannerRouter.jsx";
import UserLeaveRouter from "./UserLeaveRouter.jsx";
import TermsRouter from "./TermsRouter.jsx";
import TermsPage from "../pages/TermsPage.jsx";

const MainRouter = createBrowserRouter([
    {
        path: "/",
        element: <AuthGuard>
            <BasicLayout />
        </AuthGuard>,
        children: [
            { index: true,                     element: <IndexPage /> },
            { path: "signupPage",              element: <SignupGuard><SignupPage /></SignupGuard> },
            { path: "auth/callback",           element: <LoginHandler /> },
            { path: "auth/naver/callback",     element: <NaverLoginHandler /> },
            CommunityRouter,
            ChatRouter,
            LoginRouter,
            QnaRouter,
            ...ReportRouter,
            MyPageRouter,
            NewsRouter,
            {
                path: "admin/banners/*",
                element: <BannerRouter />,
            },
            { path: "terms", element: <TermsPage type="TERMS" /> },
            { path: "privacy", element: <TermsPage type="PRIVACY" /> },
            TermsRouter,
            PRRouter,
            DeveloperRouter,
            UserLeaveRouter
        ],
    },
]);

export default MainRouter;