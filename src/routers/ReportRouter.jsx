
import ReportIndexPage from "../pages/reportpages/ReportIndexPage.jsx";
import ReportListPage from "../pages/reportpages/ReportListPage.jsx";

const ReportRouter = {

    path: "/report",
    element: <ReportIndexPage/>,
    children: [
        {
            path: "list",
            element: <ReportListPage/>,
        }
    ]

}

export default ReportRouter;