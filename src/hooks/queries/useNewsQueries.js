// src/hooks/queries/useNewsQueries.js
// 뉴스(공지사항) 관련 React Query Hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { newsService } from '../../api/newsAPI.js';

/**
 * 뉴스 목록 조회
 * - 카테고리(공지사항/이벤트)/페이지별 캐싱
 * - keepPreviousData로 페이지 이동 시 깜빡임 방지
 *
 * @param {Object} params - 검색 파라미터
 * @param {number} params.page - 페이지 번호
 * @param {number} params.limit - 페이지당 항목 수
 * @param {string} params.category - 카테고리 ('all', '공지사항', '이벤트')
 * @returns {UseQueryResult}
 */
export const useNews = (params) => {
    const {
        page = 1,
        limit = 10,
        category = 'all',
    } = params;

    return useQuery({
        queryKey: ['news', 'list', { category, page, limit }],

        queryFn: async () => {
            const apiParams = {
                page,
                limit,
            };

            // category가 'all'이 아닐 때만 추가
            if (category !== 'all') {
                apiParams.category = category;
            }

            return await newsService.getNewsList(apiParams);
        },

        // 🎯 캐싱 전략
        staleTime: 60000,              // 1분 - 공지사항은 자주 바뀜
        gcTime: 300000,                // 5분 후 가비지 컬렉션

        // 🎯 페이지 이동 시 깜빡임 방지
        placeholderData: keepPreviousData,

        // 🎯 데이터 변환
        select: (data) => ({
            news: data.data?.news || [],
            pagination: data.data?.pagination || {},
            isAdmin: data.data?.isAdmin || false,
        }),
    });
};


/**
 * 뉴스 상세 조회
 * - 뉴스 ID별 캐싱
 * - 5분 캐싱 (공지사항 내용은 자주 안 바뀜)
 *
 * @param {string} newsId - 뉴스 ID
 * @returns {UseQueryResult}
 */
export const useNewsDetail = (newsId) => {
    return useQuery({
        queryKey: ['news', 'detail', newsId],
        queryFn: () => newsService.getNewsById(newsId),

        // 🎯 캐싱 전략
        staleTime: 300000,             // 5분 - 상세 내용 자주 안 바뀜
        gcTime: 600000,                // 10분 후 가비지 컬렉션

        // 🎯 조건부 실행
        enabled: !!newsId,             // newsId 있을 때만 실행

        // 🎯 재시도 전략
        retry: 2,                      // 실패 시 2번 재시도
    });
};


/**
 * 뉴스 작성 Mutation (낙관적 업데이트)
 * - onMutate: API 호출 전 캐시에 임시 뉴스 추가
 * - onSuccess: 서버 응답 후 정확한 데이터로 교체
 * - onError: 실패 시 이전 상태로 롤백
 *
 * @returns {UseMutationResult}
 */
export const useCreateNews = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (newsData) => newsService.createNews(newsData),

        // 🆕 낙관적 업데이트: API 호출 전 즉시 UI 업데이트
        onMutate: async (newsData) => {
            // 1. 진행 중인 쿼리 취소 (충돌 방지)
            await queryClient.cancelQueries({
                queryKey: ['news', 'list']
            });

            // 2. 이전 데이터 백업 (롤백용)
            const previousNewsList = queryClient.getQueriesData({
                queryKey: ['news', 'list']
            });

            // 3. 임시 뉴스 객체 생성
            const optimisticNews = {
                _id: `temp-${Date.now()}`,
                title: newsData.title,
                content: newsData.content,
                category: newsData.category,
                isImportant: newsData.isImportant || false,
                createdAt: new Date().toISOString(),
                views: 0,
                isOptimistic: true,  // 임시 데이터 플래그
            };

            // 4. 모든 목록 캐시에 임시 뉴스 추가
            queryClient.getQueriesData({ queryKey: ['news', 'list'] }).forEach(([queryKey, data]) => {
                if (data?.news) {
                    queryClient.setQueryData(queryKey, {
                        ...data,
                        news: [optimisticNews, ...data.news],
                        pagination: {
                            ...data.pagination,
                            total: (data.pagination?.total || 0) + 1,
                        },
                    });
                }
            });

            console.log('✨ [Optimistic] 임시 뉴스 추가:', optimisticNews._id);

            // 5. 롤백용 데이터 반환
            return { previousNewsList };
        },

        onSuccess: () => {
            // ✅ 서버 응답 후 정확한 데이터로 교체
            queryClient.invalidateQueries({
                queryKey: ['news', 'list']
            });

            console.log('✅ [Mutation] 뉴스 작성 완료 - 실제 데이터로 교체');
        },

        onError: (error, variables, context) => {
            // ❌ 실패 시 이전 데이터로 롤백
            if (context?.previousNewsList) {
                context.previousNewsList.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }

            console.error('❌ [Mutation] 뉴스 작성 실패:', error);
        },
    });
};


/**
 * 뉴스 수정 Mutation (낙관적 업데이트)
 *
 * @returns {UseMutationResult}
 */
export const useUpdateNews = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ newsId, newsData }) => newsService.updateNews(newsId, newsData),

        // 🆕 낙관적 업데이트
        onMutate: async ({ newsId, newsData }) => {
            // 1. 진행 중인 쿼리 취소
            await queryClient.cancelQueries({ queryKey: ['news', 'detail', newsId] });
            await queryClient.cancelQueries({ queryKey: ['news', 'list'] });

            // 2. 이전 데이터 백업
            const previousDetail = queryClient.getQueryData(['news', 'detail', newsId]);
            const previousLists = queryClient.getQueriesData({ queryKey: ['news', 'list'] });

            // 3. 상세 캐시 즉시 업데이트
            queryClient.setQueryData(['news', 'detail', newsId], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    data: {
                        ...old.data,
                        ...newsData,
                    },
                };
            });

            // 4. 목록 캐시 업데이트
            queryClient.getQueriesData({ queryKey: ['news', 'list'] }).forEach(([queryKey, data]) => {
                if (data?.news) {
                    queryClient.setQueryData(queryKey, {
                        ...data,
                        news: data.news.map(item =>
                            item._id === newsId
                                ? { ...item, ...newsData }
                                : item
                        ),
                    });
                }
            });

            console.log('✨ [Optimistic] 뉴스 수정 반영:', newsId);

            return { previousDetail, previousLists };
        },

        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['news', 'list'] });
            queryClient.invalidateQueries({ queryKey: ['news', 'detail', variables.newsId] });

            console.log('✅ [Mutation] 뉴스 수정 완료');
        },

        onError: (error, variables, context) => {
            // 롤백
            if (context?.previousDetail) {
                queryClient.setQueryData(['news', 'detail', variables.newsId], context.previousDetail);
            }
            if (context?.previousLists) {
                context.previousLists.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }

            console.error('❌ [Mutation] 뉴스 수정 실패:', error);
        },
    });
};


/**
 * 뉴스 삭제 Mutation (낙관적 업데이트)
 *
 * @returns {UseMutationResult}
 */
export const useDeleteNews = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (newsId) => newsService.deleteNews(newsId),

        // 🆕 낙관적 업데이트
        onMutate: async (newsId) => {
            // 1. 진행 중인 쿼리 취소
            await queryClient.cancelQueries({ queryKey: ['news', 'list'] });

            // 2. 이전 데이터 백업
            const previousLists = queryClient.getQueriesData({ queryKey: ['news', 'list'] });

            // 3. 모든 목록에서 즉시 제거
            queryClient.getQueriesData({ queryKey: ['news', 'list'] }).forEach(([queryKey, data]) => {
                if (data?.news) {
                    queryClient.setQueryData(queryKey, {
                        ...data,
                        news: data.news.filter(item => item._id !== newsId),
                        pagination: {
                            ...data.pagination,
                            total: Math.max((data.pagination?.total || 0) - 1, 0),
                        },
                    });
                }
            });

            console.log('✨ [Optimistic] 뉴스 삭제 반영:', newsId);

            return { previousLists };
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['news', 'list'] });
            console.log('✅ [Mutation] 뉴스 삭제 완료');
        },

        onError: (error, newsId, context) => {
            // 롤백
            if (context?.previousLists) {
                context.previousLists.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }

            console.error('❌ [Mutation] 뉴스 삭제 실패:', error);
        },
    });
};