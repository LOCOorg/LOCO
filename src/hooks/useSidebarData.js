// src/hooks/useSidebarData.js
import { useState } from 'react';
import { useTopCommunities } from './queries/useCommunityQueries';

/**
 * 커뮤니티 사이드바용 데이터 관리 훅
 * React Query로 자동 캐싱 및 갱신
 */
export default function useSidebarData() {
    const [sideTab, setSideTab] = useState('viewed');

    // ✅ React Query로 인기글 데이터 조회 (자동 캐싱)
    const [viewedQuery, commentedQuery] = useTopCommunities();

    return {
        sideTab,
        setSideTab,
        topViewed: viewedQuery.data || [],
        topCommented: commentedQuery.data || [],
        isLoading: viewedQuery.isLoading || commentedQuery.isLoading,
        error: viewedQuery.error || commentedQuery.error,
    };
}














// // src/hooks/useSidebarData.js
// import { useState, useEffect } from 'react';
// import { fetchTopViewed, fetchTopCommented } from '../api/communityApi.js';
//
// /**
//  * 커뮤니티 사이드바용 데이터(fetch + state) 관리 훅
//  */
// export default function useSidebarData() {
//     const [sideTab, setSideTab] = useState('viewed');
//     const [topViewed, setTopViewed] = useState([]);
//     const [topCommented, setTopCommented] = useState([]);
//
//     useEffect(() => {
//         const load = async () => {
//             try {
//                 const viewed  = await fetchTopViewed();     // 커뮤니티 최다 조회 데이터 :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}
//                 const commented = await fetchTopCommented(); // 커뮤니티 최다 댓글 데이터 :contentReference[oaicite:2]{index=2}:contentReference[oaicite:3]{index=3}
//                 setTopViewed(viewed.data || viewed);
//                 setTopCommented(commented.data || commented);
//             } catch (err) {
//                 console.error('useSidebarData error:', err);
//             }
//         };
//         load();
//     }, []);
//
//     return { sideTab, setSideTab, topViewed, topCommented };
// }
