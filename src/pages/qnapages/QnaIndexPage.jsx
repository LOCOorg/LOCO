import {Outlet} from "react-router-dom";
import BasicLayout from "../../layout/BasicLayout.jsx";

function QnaIndexPage() {
    return (
        <>
            <BasicLayout>
            <Outlet/>
            </BasicLayout>
        </>
    );
}

export default QnaIndexPage;