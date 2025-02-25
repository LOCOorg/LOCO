import {createBrowserRouter} from "react-router-dom";
import IndexPage from "../pages/IndexPage.jsx";
import ChatRouter from "./ChatRouter.jsx";

const MainRouter = createBrowserRouter([
    {
        path: "/",
        element: <IndexPage/>
    },
    ChatRouter
])

export default MainRouter;