// src/hooks/queries/useCommunityQueries.js
// 사이드바 인기글 캐싱 + 게시글 Mutation
import {useQueries, useMutation, useQueryClient, useQuery, useInfiniteQuery} from '@tanstack/react-query';
import {
    fetchTopViewed,
    fetchTopCommented,
    createCommunity,
    updateCommunity,
    deleteCommunity,
    fetchCommunities,
    fetchCommunityById, fetchCommentsByPostId,
    recommendCommunity,
    cancelRecommendCommunity,
    addComment,
    addReply,
    addSubReply,
    deleteComment,
    deleteReply,
    deleteSubReply
} from '../../api/communityAPI';
import { keepPreviousData } from '@tanstack/react-query';

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

/**
 * 게시글 작성 Mutation (낙관적 업데이트)
 * - onMutate: API 호출 전 캐시에 임시 게시글 추가
 * - onSuccess: 서버 응답 후 정확한 데이터로 교체
 * - onError: 실패 시 이전 상태로 롤백
 *
 * @returns {UseMutationResult}
 */
export const useCreateCommunity = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (formData) => createCommunity(formData),
        // 🆕 낙관적 업데이트: API 호출 전 즉시 UI 업데이트
        onMutate: async (formData) => {
            // 1. FormData에서 필요한 데이터 추출
            const title = formData.get('communityTitle');
            const contents = formData.get('communityContents');
            const category = formData.get('communityCategory');
            const userId = formData.get('userId');
            const isAnonymous = formData.get('isAnonymous') === 'true';

            // 2. 임시 게시글 객체 생성
            const optimisticPost = {
                _id: `temp-${Date.now()}`,  // 임시 ID
                communityTitle: title,
                communityContents: contents,
                communityCategory: category,
                userId: isAnonymous ? null : userId,
                isAnonymous: isAnonymous,
                createdAt: new Date().toISOString(),
                views: 0,
                commentCount: 0,
                recommendedUsers: [],
                isOptimistic: true,  // 임시 데이터 플래그
            };

            // 3. 모든 관련 목록 캐시 업데이트
            const categories = ['전체', category];  // '전체' + 해당 카테고리

            // 각 카테고리별 캐시 업데이트
            categories.forEach((cat) => {
                // 최신순 정렬의 1페이지 캐시 업데이트
                const queryKey = ['communities', 'list', {
                    category: cat,
                    page: 1,
                    pageSize: 5,
                    sort: '최신순',
                    keyword: '',
                    searchType: 'title+content',
                    period: '전체'
                }];

                queryClient.setQueryData(queryKey, (old) => {
                    if (!old) return old;

                    // 임시 게시글을 목록 최상단에 추가
                    return {
                        ...old,
                        posts: [optimisticPost, ...old.posts],
                        totalPosts: old.totalPosts + 1,
                    };
                });
            });

            console.log('✨ [Optimistic] 임시 게시글 추가:', optimisticPost._id);

            // 4. 롤백용 데이터 반환
            return { optimisticPost };
        },
        onSuccess: () => {
            // ✅ 인기글 캐시 무효화 (작성한 글이 인기글이 될 수 있음)
            queryClient.invalidateQueries({ 
                queryKey: ['communities', 'top-viewed'] 
            });
            queryClient.invalidateQueries({ 
                queryKey: ['communities', 'top-commented'] 
            });

            // ✅ 목록 캐시 무효화
            queryClient.invalidateQueries({
                queryKey: ['communities', 'list']
            });

            console.log('✅ [Mutation] 게시글 작성 완료 - 실제 데이터로 교체');
        },
        onError: (error) => {
            // ❌ 실패 시 모든 목록 캐시 무효화 (임시 게시글 제거)
            queryClient.invalidateQueries({
                queryKey: ['communities', 'list']
            });

            console.error('❌ [Mutation] 게시글 작성 실패:', error);
        },
    });
};

/**
 * 게시글 수정 Mutation (낙관적 업데이트)
 * - onMutate: API 호출 전 캐시에 수정 내용 즉시 반영
 * - onSuccess: 서버 응답 후 정확한 데이터로 교체
 * - onError: 실패 시 이전 상태로 롤백
 *
 * @returns {UseMutationResult}
 */
export const useUpdateCommunity = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: ({ postId, formData }) => updateCommunity(postId, formData),
        //  낙관적 업데이트: API 호출 전 즉시 UI 업데이트
        onMutate: async ({ postId, formData }) => {
            // 1. FormData에서 필요한 데이터 추출
            const title = formData.get('communityTitle');
            const contents = formData.get('communityContents');
            const category = formData.get('communityCategory');
            const isAnonymous = formData.get('isAnonymous') === 'true';

            // 2. 진행 중인 쿼리 취소 (충돌 방지)
            await queryClient.cancelQueries({
                queryKey: ['communities', 'detail', postId]
            });

            // 3. 이전 데이터 백업 (롤백용)
            const previousDetail = queryClient.getQueryData(['communities', 'detail', postId]);

            // 4. 상세 캐시 즉시 업데이트
            queryClient.setQueryData(['communities', 'detail', postId], (old) => {
                if (!old) return old;

                return {
                    ...old,
                    communityTitle: title,
                    communityContents: contents,
                    communityCategory: category,
                    isAnonymous: isAnonymous,
                    // 나머지 필드는 유지
                };
            });

            console.log('✨ [Optimistic] 게시글 수정 반영:', postId);

            // 5. 롤백용 데이터 반환
            return { previousDetail };
        },
        onSuccess: (data, variables) => {
            // ✅ 인기글 캐시 무효화 (제목/내용 변경이 인기글에 반영)
            queryClient.invalidateQueries({ 
                queryKey: ['communities', 'top-viewed'] 
            });
            queryClient.invalidateQueries({ 
                queryKey: ['communities', 'top-commented'] 
            });
            
            // ✅ 게시글 상세 캐시 무효화
            queryClient.invalidateQueries({ 
                queryKey: ['communities', 'detail', variables.postId] 
            });
            
            // ✅ 게시글 목록 캐시 무효화
            queryClient.invalidateQueries({ 
                queryKey: ['communities', 'list'] 
            });

            console.log('✅ [Mutation] 게시글 수정 완료 - 실제 데이터로 교체');
        },
        onError: (error, variables, context) => {
            // ❌ 실패 시 이전 데이터로 롤백
            if (context?.previousDetail) {
                queryClient.setQueryData(
                    ['communities', 'detail', variables.postId],
                    context.previousDetail
                );
            }

            // 목록 캐시도 무효화 (안전장치)
            queryClient.invalidateQueries({
                queryKey: ['communities', 'list']
            });

            console.error('❌ [Mutation] 게시글 수정 실패:', error);
        },
    });
};

/**
 * 게시글 삭제 Mutation (낙관적 업데이트)
 * - onMutate: API 호출 전 목록 캐시에서 게시글 즉시 제거
 * - onSuccess: 서버 응답 후 캐시 무효화
 * - onError: 실패 시 이전 상태로 롤백
 *
 * @returns {UseMutationResult}
 */
export const useDeleteCommunity = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (postId) => deleteCommunity(postId),
        //  낙관적 업데이트: API 호출 전 즉시 UI 업데이트
        onMutate: async (postId) => {
            // 1. 모든 관련 쿼리 취소 (충돌 방지)
            await queryClient.cancelQueries({
                queryKey: ['communities', 'list']
            });

            // 2. 이전 목록 데이터 백업 (롤백용)
            const previousLists = [];

            // 모든 목록 캐시 찾기
            queryClient.getQueriesData({ queryKey: ['communities', 'list'] }).forEach(([queryKey, data]) => {
                if (data) {
                    previousLists.push({ queryKey, data });
                }
            });

            // 3. 모든 목록 캐시에서 게시글 제거
            queryClient.getQueriesData({ queryKey: ['communities', 'list'] }).forEach(([queryKey, data]) => {
                if (data?.posts) {
                    queryClient.setQueryData(queryKey, {
                        ...data,
                        posts: data.posts.filter(post => post._id !== postId),
                        totalPosts: data.totalPosts - 1,
                    });
                }
            });

            console.log('✨ [Optimistic] 게시글 삭제 반영:', postId);

            // 4. 롤백용 데이터 반환
            return { previousLists };
        },
        onSuccess: (data, postId) => {
            //  인기글 캐시 무효화 (삭제된 글이 인기글에서 제거)
            queryClient.invalidateQueries({ 
                queryKey: ['communities', 'top-viewed'] 
            });
            queryClient.invalidateQueries({ 
                queryKey: ['communities', 'top-commented'] 
            });

            // 목록 캐시 무효화
            queryClient.invalidateQueries({
                queryKey: ['communities', 'list']
            });

            console.log('✅ [Mutation] 게시글 삭제 완료 - 실제 삭제 반영');
        },
        onError: (error, postId, context) => {
            // ❌ 실패 시 이전 데이터로 롤백
            if (context?.previousLists) {
                context.previousLists.forEach(({ queryKey, data }) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }

            // 전체 목록 캐시 무효화 (안전장치)
            queryClient.invalidateQueries({
                queryKey: ['communities', 'list']
            });

            console.error('❌ [Mutation] 게시글 삭제 실패:', error);
        },
    });
};


/**
 * 게시글 목록 조회
 * - 카테고리/페이지/정렬별 캐싱
 * - keepPreviousData로 페이지 이동 시 깜빡임 방지
 *
 * @param {Object} params - 검색 파라미터
 * @returns {UseQueryResult}
 */
export const useCommunities = (params) => {
    const {
        page = 1,
        pageSize = 5,
        category = '전체',
        userId = null,
        sort = '최신순',
        keyword = '',
        searchType = 'title+content',
        period = '전체'
    } = params;

    return useQuery({
        queryKey: ['communities', 'list', {
            category, page, pageSize, sort, keyword, searchType, period
        }],
        queryFn: () => fetchCommunities(
            page, pageSize, category, userId,
            sort, keyword, searchType, period
        ),

        // 🎯 캐싱 전략
        staleTime: 60000,              // 1분 - 게시판은 자주 바뀜
        gcTime: 300000,                // 5분 후 가비지 컬렉션

        // 🎯 페이지 이동 시 깜빡임 방지
        placeholderData: keepPreviousData,

        // 🎯 조건부 실행
        enabled: category !== '내 글' && category !== '내 댓글' || !!userId,
    });
};

/**
 * 게시글 상세 조회
 * - 게시글 ID별 캐싱
 * - 5분 캐싱 (상세 내용은 자주 안 바뀜)
 * 
 * @param {string} postId - 게시글 ID
 * @returns {UseQueryResult}
 */
export const useCommunity = (postId) => {
    return useQuery({
        queryKey: ['communities', 'detail', postId],
        queryFn: () => fetchCommunityById(postId),
        
        // 🎯 캐싱 전략
        staleTime: 300000,             // 5분 - 상세 내용 자주 안 바뀜
        gcTime: 600000,                // 10분 후 가비지 컬렉션
        
        // 🎯 조건부 실행
        enabled: !!postId,             // postId 있을 때만 실행
        
        // 🎯 재시도 전략
        retry: 2,                      // 실패 시 2번 재시도
    });
};


/**
 * 댓글 목록 조회 (무한 스크롤)
 * - useInfiniteQuery로 페이지별 캐싱
 * - fetchNextPage()로 간단하게 다음 페이지 로드
 * - 뒤로가기 시 로드했던 페이지 전부 유지
 *
 * @param {string} postId - 게시글 ID
 * @param {number} pageSize - 페이지당 댓글 수 (기본 20)
 * @returns {UseInfiniteQueryResult}
 */
export const useComments = (postId, pageSize = 20) => {
    return useInfiniteQuery({
        queryKey: ['comments', postId],

        queryFn: ({ pageParam = 1 }) => {
            return fetchCommentsByPostId(postId, pageParam, pageSize);
        },

        getNextPageParam: (lastPage) => {
            // 다음 페이지가 있으면 페이지 번호 반환, 없으면 undefined
            if (lastPage.currentPage < lastPage.totalPages) {
                return lastPage.currentPage + 1;
            }
            return undefined;
        },

        // 🎯 캐싱 전략
        staleTime: 60000,              // 1분 - 댓글은 자주 바뀜
        gcTime: 300000,                // 5분 후 가비지 컬렉션

        // 🎯 조건부 실행
        enabled: !!postId,             // postId 있을 때만 실행
    });
};


/**
 * 게시글 추천/추천 취소 Mutation (낙관적 업데이트)
 * - onMutate: API 호출 전 캐시 미리 업데이트
 * - onSuccess: 인기글 캐시 무효화
 * - onError: 실패 시 이전 캐시로 자동 롤백
 *
 * @returns {UseMutationResult}
 */
export const useRecommendCommunity = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, userId, isRecommend }) => {
            if (isRecommend) {
                return recommendCommunity(postId, userId);
            } else {
                return cancelRecommendCommunity(postId, userId);
            }
        },

        // 🎯 낙관적 업데이트 (API 호출 전)
        onMutate: async ({ postId, userId, isRecommend }) => {
            // 1. 진행 중인 쿼리 취소 (충돌 방지)
            await queryClient.cancelQueries({
                queryKey: ['communities', 'detail', postId]
            });

            // 2. 이전 데이터 백업 (롤백용)
            const previousData = queryClient.getQueryData(['communities', 'detail', postId]);

            // 3. 캐시 미리 업데이트
            queryClient.setQueryData(['communities', 'detail', postId], (old) => {
                if (!old) return old;

                // 추천 사용자 배열 업데이트
                const newRecommendedUsers = isRecommend
                    ? [...(old.recommendedUsers || []), userId]
                    : (old.recommendedUsers || []).filter(id => id !== userId);

                return {
                    ...old,
                    recommendedUsers: newRecommendedUsers,
                };
            });

            // 4. 롤백용 데이터 반환
            return { previousData };
        },

        // 🎯 성공 시
        onSuccess: (data, variables) => {
            // 인기글 캐시 무효화 (추천 수 변경이 인기글에 반영)
            queryClient.invalidateQueries({
                queryKey: ['communities', 'top-viewed']
            });
            queryClient.invalidateQueries({
                queryKey: ['communities', 'top-commented']
            });

            // 게시글 목록 캐시 무효화
            queryClient.invalidateQueries({
                queryKey: ['communities', 'list']
            });

            console.log('✅ [Mutation] 추천 처리 완료');
        },

        // 🎯 실패 시 롤백
        onError: (err, variables, context) => {
            // 이전 데이터로 복원
            if (context?.previousData) {
                queryClient.setQueryData(
                    ['communities', 'detail', variables.postId],
                    context.previousData
                );
            }
            console.error('❌ [Mutation] 추천 처리 실패:', err);
        },
    });
};


/**
 * 댓글 작성 Mutation (낙관적 업데이트)
 * - onMutate: API 호출 전 캐시에 임시 댓글 추가
 * - onSuccess: 서버 응답 후 정확한 데이터로 교체
 * - onError: 실패 시 이전 상태로 롤백
 *
 * @returns {UseMutationResult}
 */
export const useAddComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, formData }) => {
            return addComment(postId, formData);
        },

        // 🆕 낙관적 업데이트: API 호출 전 즉시 UI 업데이트
        onMutate: async ({ postId, formData }) => {
            // 1. 진행 중인 댓글 쿼리 취소 (충돌 방지)
            await queryClient.cancelQueries({
                queryKey: ['comments', postId]
            });

            // 2. 이전 댓글 데이터 백업 (롤백용)
            const previousComments = queryClient.getQueryData(['comments', postId]);

            // 3. 임시 댓글 객체 생성
            const optimisticComment = {
                _id: `temp-${Date.now()}`,
                communityPost: postId,
                text: formData.get('commentText'),
                userId: {
                    _id: formData.get('userId'),
                    nickname: '작성중...',  // 실제 닉네임은 서버에서
                },
                createdAt: new Date().toISOString(),
                isOptimistic: true,  // 임시 데이터 플래그
            };

            // 4. 캐시에 임시 댓글 즉시 추가
            queryClient.setQueryData(['comments', postId], (old) => {
                if (!old?.pages) return old;

                // useInfiniteQuery 구조에 맞춰 첫 페이지에 추가
                const newPages = [...old.pages];
                newPages[0] = {
                    ...newPages[0],
                    comments: [optimisticComment, ...newPages[0].comments],
                    totalComments: newPages[0].totalComments + 1,
                };

                return {
                    ...old,
                    pages: newPages,
                };
            });

            // 5. 롤백용 데이터 반환
            return { previousComments };
        },

        onSuccess: (data, variables) => {
            // ✅ 서버 응답 후 정확한 데이터로 교체
            queryClient.invalidateQueries({
                queryKey: ['comments', variables.postId]
            });

            console.log('✅ [Mutation] 댓글 작성 완료');
        },

        onError: (error, variables, context) => {
            // ❌ 실패 시 이전 상태로 롤백
            if (context?.previousComments) {
                queryClient.setQueryData(
                    ['comments', variables.postId],
                    context.previousComments
                );
            }
            console.error('❌ [Mutation] 댓글 작성 실패:', error);
        },
    });
};


/**
 * 대댓글 작성 Mutation
 * - 댓글에 대한 답글 작성
 * - 성공 시 댓글 캐시 무효화
 *  * 대댓글 작성 Mutation (낙관적 업데이트)
 *
 * @returns {UseMutationResult}
 */
export const useAddReply = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, commentId, formData }) => {
            return addReply(postId, commentId, formData);
        },

        // 🆕 낙관적 업데이트
        onMutate: async ({ postId, commentId, formData }) => {
            await queryClient.cancelQueries({ queryKey: ['comments', postId] });

            const previousComments = queryClient.getQueryData(['comments', postId]);

            const optimisticReply = {
                _id: `temp-${Date.now()}`,
                commentId: commentId,
                text: formData.get('replyText'),
                userId: {
                    _id: formData.get('userId'),
                    nickname: '작성중...',
                },
                createdAt: new Date().toISOString(),
                isOptimistic: true,
            };

            queryClient.setQueryData(['comments', postId], (old) => {
                if (!old?.pages) return old;

                const newPages = old.pages.map(page => ({
                    ...page,
                    comments: page.comments.map(comment => {
                        if (comment._id === commentId) {
                            return {
                                ...comment,
                                replies: [optimisticReply, ...(comment.replies || [])],
                            };
                        }
                        return comment;
                    }),
                }));

                return { ...old, pages: newPages };
            });

            return { previousComments };
        },

        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
            console.log('✅ [Mutation] 대댓글 작성 완료');
        },

        onError: (error, variables, context) => {
            if (context?.previousComments) {
                queryClient.setQueryData(['comments', variables.postId], context.previousComments);
            }
            console.error('❌ [Mutation] 대댓글 작성 실패:', error);
        },
    });
};


/**
 * 대대댓글 작성 Mutation
 * - 대댓글에 대한 답글 작성
 * - 성공 시 댓글 캐시 무효화
 *
 *  * 대대댓글 작성 Mutation (낙관적 업데이트)
 * @returns {UseMutationResult}
 */
export const useAddSubReply = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, commentId, replyId, formData }) => {
            return addSubReply(postId, commentId, replyId, formData);
        },

        // 🆕 낙관적 업데이트
        onMutate: async ({ postId, commentId, replyId, formData }) => {
            await queryClient.cancelQueries({ queryKey: ['comments', postId] });

            const previousComments = queryClient.getQueryData(['comments', postId]);

            const optimisticSubReply = {
                _id: `temp-${Date.now()}`,
                replyId: replyId,
                text: formData.get('subReplyText'),
                userId: {
                    _id: formData.get('userId'),
                    nickname: '작성중...',
                },
                createdAt: new Date().toISOString(),
                isOptimistic: true,
            };

            queryClient.setQueryData(['comments', postId], (old) => {
                if (!old?.pages) return old;

                const newPages = old.pages.map(page => ({
                    ...page,
                    comments: page.comments.map(comment => {
                        if (comment._id === commentId) {
                            return {
                                ...comment,
                                replies: comment.replies?.map(reply => {
                                    if (reply._id === replyId) {
                                        return {
                                            ...reply,
                                            subReplies: [optimisticSubReply, ...(reply.subReplies || [])],
                                        };
                                    }
                                    return reply;
                                }),
                            };
                        }
                        return comment;
                    }),
                }));

                return { ...old, pages: newPages };
            });

            return { previousComments };
        },

        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
            console.log('✅ [Mutation] 대대댓글 작성 완료');
        },

        onError: (error, variables, context) => {
            if (context?.previousComments) {
                queryClient.setQueryData(['comments', variables.postId], context.previousComments);
            }
            console.error('❌ [Mutation] 대대댓글 작성 실패:', error);
        },
    });
};

/**
 * 댓글 삭제 Mutation (낙관적 업데이트)
 * - onMutate: API 호출 전 캐시에서 댓글 즉시 제거
 * - onSuccess: 서버 응답 후 캐시 무효화
 * - onError: 실패 시 이전 상태로 롤백
 *
 * @returns {UseMutationResult}
 */
export const useDeleteComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, commentId }) => deleteComment(postId, commentId),

        // 🆕 낙관적 업데이트: API 호출 전 즉시 UI 업데이트
        onMutate: async ({ postId, commentId }) => {
            // 1. 진행 중인 쿼리 취소 (충돌 방지)
            await queryClient.cancelQueries({
                queryKey: ['comments', postId]
            });

            // 2. 이전 데이터 백업 (롤백용)
            const previousComments = queryClient.getQueryData(['comments', postId]);

            // 3. 캐시에서 댓글 즉시 제거
            queryClient.setQueryData(['comments', postId], (old) => {
                if (!old?.pages) return old;

                const newPages = old.pages.map(page => ({
                    ...page,
                    comments: page.comments.filter(comment => comment._id !== commentId),
                    totalComments: page.totalComments - 1,
                }));

                return { ...old, pages: newPages };
            });

            console.log('✨ [Optimistic] 댓글 삭제 반영:', commentId);

            // 4. 롤백용 데이터 반환
            return { previousComments };
        },

        onSuccess: (data, variables) => {
            // ✅ 서버 응답 후 정확한 데이터로 교체
            queryClient.invalidateQueries({
                queryKey: ['comments', variables.postId]
            });

            console.log('✅ [Mutation] 댓글 삭제 완료');
        },

        onError: (error, variables, context) => {
            // ❌ 실패 시 이전 상태로 롤백
            if (context?.previousComments) {
                queryClient.setQueryData(
                    ['comments', variables.postId],
                    context.previousComments
                );
            }
            console.error('❌ [Mutation] 댓글 삭제 실패:', error);
        },
    });
};


/**
 * 대댓글 삭제 Mutation (낙관적 업데이트)
 * - onMutate: API 호출 전 캐시에서 대댓글 즉시 제거
 * - onSuccess: 서버 응답 후 캐시 무효화
 * - onError: 실패 시 이전 상태로 롤백
 *
 * @returns {UseMutationResult}
 */
export const useDeleteReply = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, commentId, replyId }) => deleteReply(postId, commentId, replyId),

        // 🆕 낙관적 업데이트
        onMutate: async ({ postId, commentId, replyId }) => {
            await queryClient.cancelQueries({ queryKey: ['comments', postId] });

            const previousComments = queryClient.getQueryData(['comments', postId]);

            queryClient.setQueryData(['comments', postId], (old) => {
                if (!old?.pages) return old;

                const newPages = old.pages.map(page => ({
                    ...page,
                    comments: page.comments.map(comment => {
                        if (comment._id === commentId) {
                            return {
                                ...comment,
                                replies: comment.replies?.filter(reply => reply._id !== replyId) || [],
                            };
                        }
                        return comment;
                    }),
                }));

                return { ...old, pages: newPages };
            });

            console.log('✨ [Optimistic] 대댓글 삭제 반영:', replyId);

            return { previousComments };
        },

        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
            console.log('✅ [Mutation] 대댓글 삭제 완료');
        },

        onError: (error, variables, context) => {
            if (context?.previousComments) {
                queryClient.setQueryData(['comments', variables.postId], context.previousComments);
            }
            console.error('❌ [Mutation] 대댓글 삭제 실패:', error);
        },
    });
};

/**
 * 대대댓글 삭제 Mutation (낙관적 업데이트)
 * - onMutate: API 호출 전 캐시에서 대대댓글 즉시 제거
 * - onSuccess: 서버 응답 후 캐시 무효화
 * - onError: 실패 시 이전 상태로 롤백
 *
 * @returns {UseMutationResult}
 */
export const useDeleteSubReply = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, commentId, replyId, subReplyId }) =>
            deleteSubReply(postId, commentId, replyId, subReplyId),

        // 🆕 낙관적 업데이트
        onMutate: async ({ postId, commentId, replyId, subReplyId }) => {
            await queryClient.cancelQueries({ queryKey: ['comments', postId] });

            const previousComments = queryClient.getQueryData(['comments', postId]);

            queryClient.setQueryData(['comments', postId], (old) => {
                if (!old?.pages) return old;

                const newPages = old.pages.map(page => ({
                    ...page,
                    comments: page.comments.map(comment => {
                        if (comment._id === commentId) {
                            return {
                                ...comment,
                                replies: comment.replies?.map(reply => {
                                    if (reply._id === replyId) {
                                        return {
                                            ...reply,
                                            subReplies: reply.subReplies?.filter(sub => sub._id !== subReplyId) || [],
                                        };
                                    }
                                    return reply;
                                }),
                            };
                        }
                        return comment;
                    }),
                }));

                return { ...old, pages: newPages };
            });

            console.log('✨ [Optimistic] 대대댓글 삭제 반영:', subReplyId);

            return { previousComments };
        },

        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
            console.log('✅ [Mutation] 대대댓글 삭제 완료');
        },

        onError: (error, variables, context) => {
            if (context?.previousComments) {
                queryClient.setQueryData(['comments', variables.postId], context.previousComments);
            }
            console.error('❌ [Mutation] 대대댓글 삭제 실패:', error);
        },
    });
};
