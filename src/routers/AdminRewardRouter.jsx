import { lazy, Suspense } from "react";
import AdminGuard from "../components/authComponent/AdminGuard.jsx";
import LoadingComponent from "../common/LoadingComponent.jsx";

const ChatRewardPage = lazy(() => import("../pages/admin/ChatRewardPage.jsx"));

const AdminRewardRouter = {
    path: "admin/chat-reward",
    element: (
        <AdminGuard>
            <Suspense fallback={<LoadingComponent />}>
                <ChatRewardPage />
            </Suspense>
        </AdminGuard>
    ),
};

export default AdminRewardRouter;
