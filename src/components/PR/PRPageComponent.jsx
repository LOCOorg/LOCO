// src/components/pr/PRPageComponent.jsx
import React, { useState, useEffect } from "react";
import { getPRTopUsers, getPRUserList } from "../../api/prAPI";
import PRTopSlider from "./PRTopSlider";
import PRFilter from "./PRFilter";
import PRProfileGrid from "./PRProfileCardGrid";
import PRLoadMore from "./PRLoadMore";

const PRPageComponent = () => {
    const [topUsers, setTopUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [sort, setSort] = useState("star|desc");
    const [gender, setGender] = useState("all");
    const [page, setPage] = useState(1);
    const limit = 5;             // ← 한 번에 5개씩
    const [loading, setLoading] = useState(false);
    const [sliderIndex, setSliderIndex] = useState(0);

    // Top 10 불러오기 (unchanged)
    useEffect(() => {
        getPRTopUsers().then(res => setTopUsers(res.data || []))
            .catch(console.error);
    }, []);

    // allUsers 불러오기 (sort, gender, page 바뀔 때마다)
    useEffect(() => {
        setLoading(true);
        getPRUserList({ sort, gender, page, limit })
            .then(res => {
                const next = res.data || [];
                setAllUsers(prev => page === 1 ? next : [...prev, ...next]);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [sort, gender, page]);

    return (
        <div>
            <h1>PR 페이지</h1>
            <PRTopSlider
                topUsers={topUsers}
                sliderIndex={sliderIndex}
                handlePrev={() => setSliderIndex(i => Math.max(i - 5, 0))}
                handleNext={() => setSliderIndex(i => Math.min(i + 5, 5))}
            />
            <PRFilter
                sort={sort} gender={gender}
                handleSortChange={e => { setPage(1); setSort(e.target.value); }}
                handleGenderChange={e => { setPage(1); setGender(e.target.value); }}
            />
            <PRProfileGrid allUsers={allUsers} />
            <PRLoadMore
                loading={loading}
                handleShowMore={() => setPage(p => p + 1)}
            />
        </div>
    );
};

export default PRPageComponent;
