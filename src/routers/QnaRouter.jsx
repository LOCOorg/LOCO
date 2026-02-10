import QnaIndexPage from "../pages/qnapages/QnaIndexPage.jsx";
import QnaListPage from "../pages/qnapages/QnaListPage.jsx";
import QnaModalPage from "../pages/qnapages/QnaModalPage.jsx";
import QnaWritePage from "../pages/qnapages/QnaWritePage.jsx";
import AuthRequiredGuard from "../components/authComponent/AuthRequiredGuard.jsx";

const QnaRouter = {
    path: "/qna",
    element: <QnaIndexPage />,
    children: [
        {
            path: "",
            element: <QnaListPage/>  // 공개
        },
        {
            path: ":id",
            element: <QnaModalPage/>  // 공개
        },
        {
            path: "new",
            element: (
                <AuthRequiredGuard>
                    <QnaWritePage/>
                </AuthRequiredGuard>
            )
        }
    ]
}

export default QnaRouter;
