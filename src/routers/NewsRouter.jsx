import NewsPage from "../pages/newsPages/NewsPage.jsx";
import NewsDetailPage from "../pages/newsPages/NewsDetailPage.jsx";
import NewsWritePage from "../pages/newsPages/NewsWritePage.jsx";
import NewsEditPage from "../pages/newsPages/NewsEditPage.jsx";

const NewsRouter = {
    path: "news",
    children: [
        { index: true, element: <NewsPage /> },
        { path: "write", element: <NewsWritePage /> },
        { path: ":id/edit", element: <NewsEditPage /> },
        { path: ":id", element: <NewsDetailPage /> }
    ]
};

export default NewsRouter;
