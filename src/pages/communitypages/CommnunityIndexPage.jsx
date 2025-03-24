import {Outlet} from "react-router-dom";
import BasicLayout from "../../layout/BasicLayout.jsx";

function CommnunityIndexPage() {
    return (
        <>
            <BasicLayout>
                <Outlet/>
            </BasicLayout>
        </>
    );
}

export default CommnunityIndexPage;