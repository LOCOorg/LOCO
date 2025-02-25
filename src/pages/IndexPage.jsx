import { Link } from "react-router-dom";

const IndexPage = () => {
    return (
        <div>
            <h1>홈</h1>
            <Link to="/chat">채팅하러 가기</Link>
        </div>
    );
};

export default IndexPage;
