// src/components/pr/PRProfileCardGrid.jsx
import React from "react";
import PRProfileCard from "./PRProfileCard";

const PRProfileGrid = ({ allUsers }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-6">
        {allUsers.map((user) => (
            <PRProfileCard key={user._id} user={user} />
        ))}
    </div>
);

export default PRProfileGrid;
