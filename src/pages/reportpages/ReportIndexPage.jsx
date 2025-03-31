import {Outlet} from "react-router-dom";
import BasicLayout from "../../layout/BasicLayout.jsx";

function ReportIndexPage() {
    return (
        <>
            <BasicLayout>
                <Outlet/>
            </BasicLayout>
        </>
    );
}

export default ReportIndexPage;