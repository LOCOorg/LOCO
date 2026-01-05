// src/hooks/queries/useCommunityQueries.js
import { useQueries } from '@tanstack/react-query';
import { fetchTopViewed, fetchTopCommented } from '../../api/communityAPI';

/**
 * 사이드바 인기글 조회 (Top 조회수 + Top 댓글수)
 * useQueries로 2개 쿼리를 동시에 실행
 *
 * @returns {[UseQueryResult, UseQueryResult]} [조회수 TOP, 댓글수 TOP]
 */
export const useTopCommunities = () => {
    return useQueries({
        queries: [
            {
                queryKey: ['communities', 'top-viewed'],
                queryFn: fetchTopViewed,
                staleTime: 300000,  // 5분 (인기글은 자주 안 바뀜)
                gcTime: 600000,     // 10분
            },
            {
                queryKey: ['communities', 'top-commented'],
                queryFn: fetchTopCommented,
                staleTime: 300000,  // 5분
                gcTime: 600000,     // 10분
            },
        ],
    });
};