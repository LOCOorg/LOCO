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