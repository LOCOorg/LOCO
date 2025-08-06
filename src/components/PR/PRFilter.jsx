// src/components/pr/PRFilter.jsx
import React from "react";
import {
    sortOptions,
    genderOptions,
    tierOptions
} from "./PRFilterConfig.js";
const PRFilter = ({
                      sort,
                      gender,
                      tier,
                      onSortChange,
                      onGenderChange,
                      onTierChange,
                  }) => (



    <div className="space-y-6">
        {/* 정렬 */}
        <div>
            <h3 className="mb-2 text-gray-800 font-semibold">정렬</h3>
            <div className="space-y-2">
                {sortOptions.map(opt => (
                    <label key={opt.value} className="flex items-center space-x-2">
                        <input
                            type="radio"
                            name="sort"
                            value={opt.value}
                            checked={sort === opt.value}
                            onChange={onSortChange}
                            className="w-4 h-4 text-green-400 border-gray-300 focus:ring-green-300"
                        />
                        <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                ))}
            </div>
        </div>

        {/* 성별 */}
        <div>
            <h3 className="mb-2 text-gray-800 font-semibold">성별</h3>
            <div className="space-y-2">
                {genderOptions.map(opt => (
                    <label key={opt.value} className="flex items-center space-x-2">
                        <input
                            type="radio"
                            name="gender"
                            value={opt.value}
                            checked={gender === opt.value}
                            onChange={onGenderChange}
                            className="w-4 h-4 text-green-400 border-gray-300 focus:ring-green-300"
                        />
                        <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                ))}
            </div>
        </div>

        {/* 등급 */}
        <div>
            <h3 className="mb-2 text-gray-800 font-semibold">등급</h3>
            <div className="space-y-2">
                {tierOptions.map(opt => (
                    <label key={opt.value} className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            name="tier"
                            value={opt.value}
                            checked={tier.includes(opt.value)}
                            onChange={onTierChange}
                            className="w-4 h-4 text-green-400 border-gray-300 focus:ring-green-300"
                        />
                        <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                ))}
            </div>
        </div>
    </div>
);

export default PRFilter;
