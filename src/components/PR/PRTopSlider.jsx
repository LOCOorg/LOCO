// src/components/pr/PRTopSlider.jsx
import React from "react";

const PRTopSlider = ({ topUsers, sliderIndex, handlePrev, handleNext }) => {
    return (
        <section>
            <h2>별점 랭킹 TOP 10</h2>
            <div style={{ display: "flex", alignItems: "center" }}>
                <button onClick={handlePrev} disabled={sliderIndex === 0}>
                    {"<"}
                </button>
                <div style={{ display: "flex", overflow: "hidden", width: "800px" }}>
                    {topUsers.slice(sliderIndex, sliderIndex + 5).map((user) => (
                        <div
                            key={user._id}
                            style={{ width: "150px", margin: "0 10px", textAlign: "center" }}
                        >
                            <img
                                src={user.photo?.[0] || "https://via.placeholder.com/150"}
                                alt={user.nickname}
                                style={{ width: "100%" }}
                            />
                            <p>{user.nickname}</p>
                            <p>별점: {user.star}</p>
                        </div>
                    ))}
                </div>
                <button onClick={handleNext} disabled={sliderIndex >= 5}>
                    {">"}
                </button>
            </div>
        </section>
    );
};

export default PRTopSlider;
