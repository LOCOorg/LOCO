//src/routers/ProductRouter.jsx
import AdminProductPage from "../pages/adminProductPage/AdminProductPage.jsx";
//접근제한
import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore.js';

/**
 * AdminProductGuard
 * - userLv < 3 이면 홈("/")으로 리다이렉트
 * - userLv ≥ 3 이면 AdminProductPage 렌더
 */
function AdminProductGuard() {
    const user = useAuthStore(state => state.user);

    // 아직 사용자 정보 로딩 중 또는 비로그인 시
    if (!user) {
        return <Navigate to="/loginPage" replace />;
    }
    // Lv3 미만은 홈으로 리다이렉트
    if (user.userLv < 3) {
        return <Navigate to="/" replace />;
    }
    // Lv3 이상은 페이지 렌더
    return <AdminProductPage />;
}



const AdminProductRouter = {

    path: "/adminproducts",
    element: <AdminProductGuard />
};

export default AdminProductRouter;