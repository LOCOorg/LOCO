import { Routes, Route } from 'react-router-dom';
import BannerListPage from '../pages/bannerAdminPages/BannerListPage.jsx';
import BannerCreatePage from '../pages/bannerAdminPages/BannerCreatePage.jsx';
import BannerEditPage from '../pages/bannerAdminPages/BannerEditPage.jsx';

const BannerRouter = () => {
    return (
        <Routes>
            <Route path="/" element={<BannerListPage />} />
            <Route path="/create" element={<BannerCreatePage />} />
            <Route path="/edit/:id" element={<BannerEditPage />} />
        </Routes>
    );
};

export default BannerRouter;
