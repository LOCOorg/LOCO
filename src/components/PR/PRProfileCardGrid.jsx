// src/components/pr/PRProfileCardGrid.jsx
import React from "react";
import PRProfileCard from "./PRProfileCard";

const PRProfileGrid = ({ allUsers, onCardClick }) => (
    <div
        className="mt-6 grid gap-6"
        /*
          ─────────────────────────────────────────
          repeat(auto-fill, minmax(180px, 1fr))
          - 최소 180px 확보 후 남는 공간에 1fr씩 추가
          - 브라우저 창 크기에 따라 컬럼 수 자동 조정
        */
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}
    >



        {allUsers.map(user => (
            <PRProfileCard
                key={user._id}
                user={user}
                onClick={() => onCardClick(user)}   // ← 클릭 이벤트 전달 :contentReference[oaicite:5]{index=5}
            />
        ))}
    </div>
);

export default PRProfileGrid;