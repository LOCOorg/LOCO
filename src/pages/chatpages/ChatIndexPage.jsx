import {Outlet} from "react-router-dom";
import BasicLayout from "../../layout/BasicLayout.jsx";

function ChatIndexPage() {
    return (
        <>
            <BasicLayout>
                <Outlet/>
            </BasicLayout>
        </>
    );
}

export default ChatIndexPage;