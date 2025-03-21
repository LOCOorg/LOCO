
import CommunityIndexPage from "../pages/communitypages/CommnunityIndexPage.jsx";
import CommunityFormPage from "../pages/communitypages/CommunityFormPage.jsx";
import CommunityDetailPage from "../pages/communitypages/CommunityDetailPage.jsx";
import CommunityListPage from "../pages/communitypages/CommunityListPage.jsx";
import CommunityEditPage from "../pages/communitypages/CommunityEditPage.jsx";

const CommunityRouter = {

    path: "/community",
    element: <CommunityIndexPage/>,
    children: [
        {
          path: "",
          element: <CommunityListPage/>
        },
        {
            path: "new",
            element: <CommunityFormPage/>
        },
        {
            path: ":id",
            element: <CommunityDetailPage/>
        },
        {
            path: "edit/:id",
            element: <CommunityEditPage/>
        }
    ]

}

export default CommunityRouter;