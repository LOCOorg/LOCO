// src/components/pr/PRFilter.jsx
import React from "react";

const PRFilter = ({ sort, gender, handleSortChange, handleGenderChange }) => (
    <div className="flex flex-wrap gap-6 my-6 text-sm text-gray-700">
        <label className="flex items-center space-x-2">
            <span>정렬:</span>
            <select
                value={sort}
                onChange={handleSortChange}
                className="p-1 border border-gray-300 rounded"
            >
                <option value="star|desc">별점 높은순</option>
                <option value="star|asc">별점 낮은순</option>
                <option value="online">온라인 순</option>
            </select>
        </label>
        <label className="flex items-center space-x-2">
            <span>성별:</span>
            <select
                value={gender}
                onChange={handleGenderChange}
                className="p-1 border border-gray-300 rounded"
            >
                <option value="all">모두</option>
                <option value="female">여성</option>
                <option value="male">남성</option>
            </select>
        </label>
    </div>
);

export default PRFilter;
