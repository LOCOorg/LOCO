import PRPageComponent  from "../../components/PR/PRPageComponent.jsx";
import BasicLayout from "../../layout/BasicLayout.jsx";

const PRPage  = () => {
    return (
        <BasicLayout>
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">PR페이지</h1>
            <PRPageComponent />
        </div>
        </BasicLayout>
    );
};

export default PRPage ;