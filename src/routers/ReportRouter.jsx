//src/routers/ReportRouter.jsx
import ReportIndexPage from "../pages/reportpages/ReportIndexPage.jsx";
import ReportListPage from "../pages/reportpages/ReportListPage.jsx";
//접근제한
import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore.js';

function ReportGuard({ children }) {
    const user = useAuthStore(state => state.user);

    if (!user) {
        return <Navigate to="/loginPage" replace />;
    }
    if (user.userLv < 2) {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
}

const ReportRouter = [
    {
        path: '/report',
        element: (
            <ReportGuard>
                <ReportIndexPage />
            </ReportGuard>
        )
    },
    {
        path: '/report/list',
        element: (
            <ReportGuard>
                <ReportListPage />
            </ReportGuard>
        )
    }
];

export default ReportRouter;