// src/hooks/queries/usePRQueries.js
// PR(Product Request) 관련 React Query Hooks

import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { getPRTopUsers, getPRUserList } from '../../api/prAPI';

/**
 * PR Top 10 유저 조회
 * - 1회 로딩
 * - 5분 캐싱 (TOP 유저는 자주 안 바뀜)
 *
 * @returns {UseQueryResult}
 */
export const usePRTopUsers = () => {
    return useQuery({
        queryKey: ['pr', 'top-users'],
        queryFn: async () => {
            const response = await getPRTopUsers();
            return response.data || [];
        },

        // 🎯 캐싱 전략
        staleTime: 300000,             // 5분 - TOP 유저는 자주 안 바뀜
        gcTime: 600000,                // 10분 후 가비지 컬렉션

        // 🎯 재시도 전략
        retry: 2,
    });
};


/**
 * PR 유저 목록 조회 (무한 스크롤)
 * - 필터/정렬별 캐싱
 * - useInfiniteQuery로 "더보기" 구현
 *
 * @param {Object} params - 검색 파라미터
 * @param {string} params.sort - 정렬 (예: "star|desc")
 * @param {string} params.gender - 성별 필터 ("all", "male", "female")
 * @param {Array} params.tier - 티어 필터 (예: ["gold", "platinum"])
 * @param {number} params.limit - 페이지당 개수
 * @returns {UseInfiniteQueryResult}
 */
export const usePRUserList = (params) => {
    const {
        sort = 'star|desc',
        gender = 'all',
        tier = [],
        limit = 5,
    } = params;

    return useInfiniteQuery({
        queryKey: ['pr', 'user-list', { sort, gender, tier }],

        queryFn: async ({ pageParam = 1 }) => {
            const response = await getPRUserList({
                sort,
                gender,
                tier,
                page: pageParam,
                limit,
            });

            return {
                users: response.data || [],
                currentPage: pageParam,
            };
        },

        getNextPageParam: (lastPage, allPages) => {
            // 데이터가 있으면 다음 페이지, 없으면 undefined
            if (lastPage.users.length === limit) {
                return lastPage.currentPage + 1;
            }
            return undefined;
        },

        // 🎯 캐싱 전략
        staleTime: 60000,              // 1분 - 유저 목록은 자주 바뀜
        gcTime: 300000,                // 5분 후 가비지 컬렉션

        // 🎯 초기 페이지 파라미터
        initialPageParam: 1,
    });
};