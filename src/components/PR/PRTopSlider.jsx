// src/components/pr/PRTopSlider.jsx
import React from "react";
import PRProfileCard from "./PRProfileCard";

const PRTopSlider = ({ topUsers, sliderIndex, handlePrev, handleNext }) => {
    const slideSize = 5;
    const maxIndex = Math.max(0, topUsers.length - slideSize);

    return (
        <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">별점 랭킹 TOP 10</h2>
            <div className="flex items-center">
                <button
                    onClick={handlePrev}
                    disabled={sliderIndex === 0}
                    className="text-2xl text-gray-500 disabled:text-gray-300 px-2"
                >
                    &lt;
                </button>
                <div className="overflow-hidden">
                    <div
                        className="flex space-x-6 transition-transform duration-300"
                        style={{ transform: `translateX(-${sliderIndex * (180 + 24)}px)` }}
                    >
                        {topUsers.map((user) => (
                            <div key={user._id} className="w-44 flex-shrink-0">
                                <PRProfileCard user={user} />
                            </div>
                        ))}
                    </div>
                </div>
                <button
                    onClick={handleNext}
                    disabled={sliderIndex >= maxIndex}
                    className="text-2xl text-gray-500 disabled:text-gray-300 px-2"
                >
                    &gt;
                </button>
            </div>
        </section>
    );
};

export default PRTopSlider;
