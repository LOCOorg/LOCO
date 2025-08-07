// src/components/pr/PRProfileCardGrid.jsx
import React, {useEffect, useRef, useState} from "react";
import PRProfileCard from "./PRProfileCard";

const GAP_PX = 24;         // 카드 간격
const CARD_W = 206;        // 카드 고정 너비

const PRProfileGrid = ({ allUsers, onCardClick }) => {
    const containerRef = useRef();
    const [cols, setCols] = useState(5);

    useEffect(() => {
        const update = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.offsetWidth;
            // 들어갈 수 있는 최대 칸 수: floor((width + gap) / (card+gap))
            const fit = Math.floor((width + GAP_PX) / (CARD_W + GAP_PX)) || 1;
            // 최대 5칸으로 제한
            setCols(Math.min(fit, 5));
        };
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);


    return (
    <div
        ref={containerRef}
        className="mt-6 grid gap-6 justify-center"
        style={{
            gridTemplateColumns: `repeat(${cols}, ${CARD_W}px)`
        }}
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
};

export default PRProfileGrid;