
import QnaIndexPage from "../pages/qnapages/QnaIndexPage.jsx";
import QnaListPage from "../pages/qnapages/QnaListPage.jsx";
import QnaModalPage from "../pages/qnapages/QnaModalPage.jsx";
import QnaWritePage from "../pages/qnapages/QnaWritePage.jsx";

const QnaRouter = {
    path: "/qna",
    element: <QnaIndexPage />,
    children: [
        {
            path: "",
            element: <QnaListPage/>
        },
        {
            path: ":id",
            element: <QnaModalPage/>
        },
        {
            path: "new",
            element: <QnaWritePage/>
        }
    ]

}

export default QnaRouter;