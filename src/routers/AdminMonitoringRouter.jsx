import { lazy, Suspense } from "react";
import AdminGuard from "../components/authComponent/AdminGuard.jsx";
import LoadingComponent from "../common/LoadingComponent.jsx";

const SystemMonitoringPage = lazy(() => import("../pages/admin/SystemMonitoringPage.jsx"));
const UserMonitoringPage = lazy(() => import("../pages/admin/UserMonitoringPage.jsx"));

const AdminMonitoringRouter = {
    path: "admin",
    children: [
        {
            path: "monitoring",
            element: (
                <AdminGuard>
                    <Suspense fallback={<LoadingComponent />}>
                        <SystemMonitoringPage />
                    </Suspense>
                </AdminGuard>
            ),
        },
        {
            path: "user-monitoring",
            element: (
                <AdminGuard>
                    <Suspense fallback={<LoadingComponent />}>
                        <UserMonitoringPage />
                    </Suspense>
                </AdminGuard>
            ),
        }
    ]
};

export default AdminMonitoringRouter;
