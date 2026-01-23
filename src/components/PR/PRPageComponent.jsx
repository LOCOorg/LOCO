// src/components/pr/PRPageComponent.jsx
import React, {useState} from "react";
// import {getPRTopUsers, getPRUserList} from "../../api/prAPI";
import { usePRTopUsers, usePRUserList } from "../../hooks/queries/usePRQueries";
import PRTopSlider from "./PRTopSlider";
import PRFilter from "./PRFilter";
import PRProfileGrid from "./PRProfileCardGrid";
import PRLoadMore from "./PRLoadMore";
import SimpleProfileModal from "../MyPageComponent/SimpleProfileModal.jsx"
import { useOnlineStatus } from "../../hooks/useOnlineStatus.js";

const PRPageComponent = () => {
    // const [topUsers, setTopUsers] = useState([]);
    // const [allUsers, setAllUsers] = useState([]);
    const [sort, setSort] = useState("star|desc");
    const [tier, setTier] = useState([]);
    const [gender, setGender] = useState("all");
    const limit = 5;             // ← 한 번에 5개씩
    // const [loading, setLoading] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // ✅ Top 10 유저 Query Hook
    const { data: topUsers = [] } = usePRTopUsers();

    // ✅ 유저 목록 Infinite Query Hook
    const {
        data: usersData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = usePRUserList({
        sort,
        gender,
        tier,
        limit,
    });

    // ✅ 전체 유저 배열 추출
    const allUsers = usersData?.pages.flatMap(page => page.users) || [];

    // 온라인 상태 추적 (백엔드에서 온 데이터의 실시간 업데이트를 위해)
    const allUserIds = [...topUsers, ...allUsers].map(user => user._id).filter(Boolean);
    const { onlineStatus } = useOnlineStatus(allUserIds);



    // // Top 10 불러오기 (unchanged)
    // useEffect(() => {
    //     getPRTopUsers()
    //         .then(res => setTopUsers(res.data || []))
    //         .catch(console.error);
    // }, []);
    //
    // // allUsers 불러오기 (sort, gender, page 바뀔 때마다)
    // useEffect(() => {
    //     setLoading(true);
    //     getPRUserList({sort, gender, tier, page, limit})
    //         .then(res => {
    //             const next = res.data || [];
    //             setAllUsers(prev => page === 1 ? next : [...prev, ...next]);
    //         })
    //         .catch(console.error)
    //         .finally(() => setLoading(false));
    // }, [sort, gender, tier, page]);


    // 핸들러
    const handleSortChange = e => {
        // setPage(1);
        setSort(e.target.value);
    };
    const handleGenderChange = e => {
        // setPage(1);
        setGender(e.target.value);
    };
    const handleTierChange = e => {
        const {value, checked} = e.target;
        // setPage(1);
        setTier(prev => checked
            ? [...prev, value]
            : prev.filter(g => g !== value)
        );
    };
    //  더보기 핸들러
    const handleShowMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    // 프로필 카드 클릭 시 모달 오픈
    const handleCardClick = user => {
        setSelectedProfile(user);
        setIsModalOpen(true);
    };


    return (
        <div className="pl-64 lg:pl-64">
            {/* ─── 좌측 필터 사이드바 ─── */}
            <aside className="fixed inset-y-0 left-0 top-20 w-64 overflow-y-auto z-10 bg-white">
                {/* 내부 패딩 */}
                <div className="px-4 py-6">
                    <PRFilter
                        sort={sort}
                        gender={gender}
                        tier={tier}
                        onSortChange={handleSortChange}
                        onGenderChange={handleGenderChange}
                        onTierChange={handleTierChange}
                    />
                </div>
            </aside>

            {/* ─── 우측 메인 컨텐츠 ─── */}
            <main className="bg-[#F5F7FA] px-6 py-4">
                {/* 상단 슬라이더 (전체 폭) */}

                <PRTopSlider 
                    topUsers={topUsers.map(user => ({
                        ...user,
                        // 백엔드에서 온 데이터 우선, 실시간 데이터로 fallback
                        isOnline: user.isOnline ?? onlineStatus[user._id] ?? false
                    }))}
                />

                {/* 카드 그리드 */}
                {isLoading ? (
                    // ✅ 첫 페이지 로딩 중
                    <div className="flex justify-center items-center py-20">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-gray-600">유저 목록을 불러오는 중...</p>
                        </div>
                    </div>
                ) : allUsers.length === 0 ? (
                    // ✅ 데이터가 없을 때
                    <div className="text-center py-20">
                        <p className="text-gray-600">조건에 맞는 유저가 없습니다.</p>
                    </div>
                ) : (
                    // ✅ 정상 렌더링
                    <PRProfileGrid
                        allUsers={allUsers.map(user => ({
                            ...user,
                            isOnline: user.isOnline ?? onlineStatus[user._id] ?? false
                        }))}
                        onCardClick={handleCardClick}
                    />
                )}


                {/* 더보기 버튼 */}
                <div className="mt-6 flex justify-center">
                <PRLoadMore
                    loading={isFetchingNextPage}
                    handleShowMore={handleShowMore}
                    hasMore={hasNextPage}
                />

                </div>
                {isModalOpen && (
                    <SimpleProfileModal
                        profile={selectedProfile}
                        onClose={() => setIsModalOpen(false)}
                    />
                )}


            </main>
        </div>
    );
};

export default PRPageComponent;
