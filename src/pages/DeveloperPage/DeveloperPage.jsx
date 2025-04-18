// DeveloperPage.jsx
import React from 'react';
import DeveloperComponent from '../../components/DeveloperComponent/DeveloperComponent.jsx';
import BasicLayout from "../../layout/BasicLayout.jsx";

const DeveloperPage = () => {
    return (
        <BasicLayout>
        <div>
            <h1>개발자 페이지</h1>
            <DeveloperComponent />
        </div>
        </BasicLayout>
    );
};

export default DeveloperPage;
