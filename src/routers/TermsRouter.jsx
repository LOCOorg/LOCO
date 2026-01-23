import TermsManagementPage from "../pages/admin/TermsManagementPage.jsx";
import AdminGuard from "../components/authComponent/AdminGuard.jsx";

const TermsRouter = {
    path: "admin/terms",
    element: <AdminGuard><TermsManagementPage /></AdminGuard>,
};

export default TermsRouter;
