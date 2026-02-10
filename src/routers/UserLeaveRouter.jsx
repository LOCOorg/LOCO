import UserLeavePage from "../pages/userLeavePage/UserLeavePage.jsx";
import AuthRequiredGuard from "../components/authComponent/AuthRequiredGuard.jsx";

const UserLeaveRouter = {
    path: "/userLeave",
    element: (
        <AuthRequiredGuard>
            <UserLeavePage/>
        </AuthRequiredGuard>
    )
}

export default UserLeaveRouter;
