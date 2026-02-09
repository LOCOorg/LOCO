import { Routes, Route } from 'react-router-dom';
import BannerListPage from '../pages/bannerAdminPages/BannerListPage.jsx';
import BannerCreatePage from '../pages/bannerAdminPages/BannerCreatePage.jsx';
import BannerEditPage from '../pages/bannerAdminPages/BannerEditPage.jsx';
import AdminGuard from '../components/authComponent/AdminGuard.jsx';

const BannerRouter = () => {
    return (
        <AdminGuard>
            <Routes>
                <Route path="/" element={<BannerListPage />} />
                <Route path="/create" element={<BannerCreatePage />} />
                <Route path="/edit/:id" element={<BannerEditPage />} />
            </Routes>
        </AdminGuard>
    );
};

export default BannerRouter;
