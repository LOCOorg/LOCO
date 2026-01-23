// src/hooks/queries/useQnAQueries.js
// QnA 관련 React Query Hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQnaPageByStatus, deleteQna } from '../../api/qnaAPI.js';

/**
 * QnA 목록 조회
 * - 상태(답변대기/답변완료)별 독립 캐싱
 * - 페이지/검색어/검색타입별 독립 캐싱
 *
 * @param {Object} params - 검색 파라미터
 * @param {string} params.status - QnA 상태 ("답변대기" | "답변완료")
 * @param {number} params.page - 페이지 번호
 * @param {number} params.size - 페이지 크기
 * @param {string} params.keyword - 검색어 (선택)
 * @param {string} params.searchType - 검색 타입 (선택)
 * @returns {UseQueryResult}
 */
export const useQnAList = (params) => {
    const {
        status,                    // "답변대기" | "답변완료"
        page = 1,
        size = 6,
        keyword = '',
        searchType = 'both',       // title | contents | both | author | answerer
    } = params;

    return useQuery({
        // 🎯 queryKey: 캐싱의 핵심!
        queryKey: ['qna', 'list', { status, page, keyword, searchType }],
        //                         ↑ 이 조합이 바뀌면 새로운 쿼리!

        queryFn: async () => {
            const response = await getQnaPageByStatus(
                page,
                size,
                status,
                keyword,
                searchType
            );
            return response;
        },

        // 🎯 캐싱 전략
        staleTime: 60000,          // 1분 - QnA는 자주 바뀜
        gcTime: 300000,            // 5분 후 가비지 컬렉션

        // 🎯 데이터 변환 (select)
        select: (data) => ({
            qnas: data.dtoList || [],
            pagination: {
                pageNumList: data.pageNumList || [],
                prev: data.prev || false,
                next: data.next || false,
                prevPage: data.prevPage,
                nextPage: data.nextPage,
                current: data.current,
                totalCount: data.totalCount,
            }
        }),

        // 🎯 에러 재시도
        retry: 1,
    });
};


/**
 * QnA 삭제 Mutation
 *
 * @returns {UseMutationResult}
 */
export const useDeleteQnA = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => deleteQna(id),

        onSuccess: () => {
            // 🎯 모든 QnA 목록 캐시 무효화
            queryClient.invalidateQueries({
                queryKey: ['qna', 'list']
            });

            console.log('✅ [Mutation] QnA 삭제 완료');
        },

        onError: (error) => {
            console.error('❌ [Mutation] QnA 삭제 실패:', error);
        },
    });
};