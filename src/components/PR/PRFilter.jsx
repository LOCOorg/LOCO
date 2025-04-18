// src/components/pr/PRFilter.jsx
import React from "react";

const PRFilter = ({ sort, gender, handleSortChange, handleGenderChange }) => {
    return (
        <div style={{ margin: "20px 0" }}>
            <label>
                정렬:{" "}
                <select value={sort} onChange={handleSortChange}>
                    <option value="star|desc">별점 높은순</option>
                    <option value="star|asc">별점 낮은순</option>
                    <option value="online">온라인 순</option>
                </select>
            </label>
            <label style={{ marginLeft: "20px" }}>
                성별:{" "}
                <select value={gender} onChange={handleGenderChange}>
                    <option value="all">모두</option>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                </select>
            </label>
        </div>
    );
};

export default PRFilter;
