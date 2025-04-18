// src/components/pr/PRLoadMore.jsx
import React from "react";

const PRLoadMore = ({ loading, handleShowMore }) => {
    return (
        <div style={{ textAlign: "center", margin: "20px 0" }}>
            <button onClick={handleShowMore} disabled={loading}>
                {loading ? "로딩중..." : "더보기"}
            </button>
        </div>
    );
};

export default PRLoadMore;
