import NewsPage from "../pages/newsPages/NewsPage.jsx";
import NewsDetailPage from "../pages/newsPages/NewsDetailPage.jsx";
import NewsWritePage from "../pages/newsPages/NewsWritePage.jsx";
import NewsEditPage from "../pages/newsPages/NewsEditPage.jsx";
import AdminGuard from "../components/authComponent/AdminGuard.jsx";

const NewsRouter = {
    path: "news",
    children: [
        { index: true, element: <NewsPage /> },  // 공개
        {
            path: "write",
            element: (
                <AdminGuard>
                    <NewsWritePage />
                </AdminGuard>
            )
        },
        {
            path: ":id/edit",
            element: (
                <AdminGuard>
                    <NewsEditPage />
                </AdminGuard>
            )
        },
        { path: ":id", element: <NewsDetailPage /> }  // 공개
    ]
};

export default NewsRouter;
