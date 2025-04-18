// src/components/pr/PRPageComponent.jsx
import React, { useState, useEffect } from "react";
import { getPRTopUsers, getPRUserList } from "../../api/prAPI";
import PRTopSlider from "./PRTopSlider";
import PRFilter from "./PRFilter";
import PRProfileGrid from "./PRProfileCardGrid.jsx";
import PRLoadMore from "./PRLoadMore";

const PRPageComponent = () => {
    const [topUsers, setTopUsers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [sort, setSort] = useState("star|desc");
    const [gender, setGender] = useState("all");
    const [page, setPage] = useState(1);
    const limit = 30;
    const [loading, setLoading] = useState(false);
    const [sliderIndex, setSliderIndex] = useState(0);

    // 상단 Top 10 사용자 로드
    useEffect(() => {
        const fetchTopUsers = async () => {
            try {
                const result = await getPRTopUsers();
                setTopUsers(result.data || []);
            } catch (err) {
                console.error("TopUsers 로드 실패:", err);
            }
        };
        fetchTopUsers();
    }, []);

    // 하단 유저 목록 로드 (필터/페이지네이션)
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const result = await getPRUserList({ sort, gender, page, limit });
                if (page === 1) {
                    setAllUsers(result.data);
                } else {
                    setAllUsers((prev) => [...prev, ...result.data]);
                }
            } catch (err) {
                console.error("Users 로드 실패:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [sort, gender, page]);

    // 슬라이더 조작
    const handlePrev = () => {
        setSliderIndex((prev) => Math.max(prev - 5, 0));
    };
    const handleNext = () => {
        setSliderIndex((prev) => Math.min(prev + 5, 5));
    };

    // 필터 변경 시 페이지 초기화
    const handleSortChange = (e) => {
        setPage(1);
        setSort(e.target.value);
    };

    const handleGenderChange = (e) => {
        setPage(1);
        setGender(e.target.value);
    };

    const handleShowMore = () => {
        setPage((prev) => prev + 1);
    };

    return (
        <div>
            <h1>PR 페이지</h1>
            <PRTopSlider
                topUsers={topUsers}
                sliderIndex={sliderIndex}
                handlePrev={handlePrev}
                handleNext={handleNext}
            />
            <PRFilter
                sort={sort}
                gender={gender}
                handleSortChange={handleSortChange}
                handleGenderChange={handleGenderChange}
            />
            <PRProfileGrid allUsers={allUsers} />
            <PRLoadMore loading={loading} handleShowMore={handleShowMore} />
        </div>
    );
};

export default PRPageComponent;
