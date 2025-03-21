import {createBrowserRouter} from "react-router-dom";
import IndexPage from "../pages/IndexPage.jsx";
import ChatRouter from "./ChatRouter.jsx";
import CommunityRouter from "./CommunityRouter.jsx";

const MainRouter = createBrowserRouter([
    {
        path: "/",
        element: <IndexPage/>
    },
    ChatRouter,
    CommunityRouter
])

export default MainRouter;