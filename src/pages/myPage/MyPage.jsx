// src/pages/MyPage/MyPage.jsx
import MyPageComponent from '../../components/MyPageComponent/MyPageComponent.jsx';

const MyPage = () => {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">마이페이지</h1>
            <MyPageComponent />
        </div>
    );
};

export default MyPage;
