import CommunityIndexPage from "../pages/communitypages/CommnunityIndexPage.jsx";
import CommunityFormPage from "../pages/communitypages/CommunityFormPage.jsx";
import CommunityDetailPage from "../pages/communitypages/CommunityDetailPage.jsx";
import CommunityListPage from "../pages/communitypages/CommunityListPage.jsx";
import CommunityEditPage from "../pages/communitypages/CommunityEditPage.jsx";
import AuthRequiredGuard from "../components/authComponent/AuthRequiredGuard.jsx";

const CommunityRouter = {
    path: "/community",
    element: <CommunityIndexPage/>,
    children: [
        {
            path: "",
            element: <CommunityListPage/>  // 공개
        },
        {
            path: "new",
            element: (
                <AuthRequiredGuard>
                    <CommunityFormPage/>
                </AuthRequiredGuard>
            )
        },
        {
            path: ":id",
            element: <CommunityDetailPage/>  // 공개
        },
        {
            path: "edit/:id",
            element: (
                <AuthRequiredGuard>
                    <CommunityEditPage/>
                </AuthRequiredGuard>
            )
        }
    ]
}

export default CommunityRouter;
