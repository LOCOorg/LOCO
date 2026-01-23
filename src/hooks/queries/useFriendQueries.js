import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
    getFriendRequestCount,
    getFriendRequestList,
    acceptFriendRequest,
    declineFriendRequest, deleteFriend, getFriendsPage
} from '../../api/userAPI';

// ✅ 친구 요청 개수 조회
export const useFriendRequestCount = (userId) => {
    return useQuery({
        queryKey: ['friendRequestCount', userId],
        queryFn: () => getFriendRequestCount(userId),
        enabled: !!userId,
        staleTime: 30 * 1000,        // 30초 - 자주 변하지 않음
        gcTime: 5 * 60 * 1000,       // 5분
        retry: 2,
    });
};

// ✅ 친구 요청 전체 목록 조회 (탭 클릭 시)
export const useFriendRequestList = (userId, enabled = false) => {
    return useQuery({
        queryKey: ['friendRequestList', userId],
        queryFn: () => getFriendRequestList(userId),
        enabled: !!userId && enabled,  // 탭 활성화 시에만
        staleTime: 20 * 1000,
        gcTime: 3 * 60 * 1000,
    });
};

// ✅ 친구 요청 수락
// 🆕 친구 요청 수락 (낙관적 업데이트)
export const useAcceptFriendRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, requestId }) => acceptFriendRequest(userId, requestId),

        // 🆕 낙관적 업데이트: API 호출 전 즉시 UI 업데이트
        onMutate: async ({ userId, requestId }) => {
            // 1. 진행 중인 쿼리 취소
            await queryClient.cancelQueries({ queryKey: ['friendRequestCount', userId] });
            await queryClient.cancelQueries({ queryKey: ['friendRequestList', userId] });

            // 2. 이전 데이터 백업
            const previousCount = queryClient.getQueryData(['friendRequestCount', userId]);
            const previousList = queryClient.getQueryData(['friendRequestList', userId]);

            // 3. 개수 즉시 감소
            queryClient.setQueryData(['friendRequestCount', userId], (old) => {
                return old > 0 ? old - 1 : 0;
            });

            // 4. 목록에서 즉시 제거
            queryClient.setQueryData(['friendRequestList', userId], (old) => {
                if (!old) return old;
                return old.filter(req => req._id !== requestId);
            });

            // 5. 롤백용 데이터 반환
            return { previousCount, previousList };
        },

        onSuccess: (data, variables) => {
            // ✅ 요청 관련 캐시 무효화
            queryClient.invalidateQueries({
                queryKey: ['friendRequestCount', variables.userId]
            });
            queryClient.invalidateQueries({
                queryKey: ['friendRequestList', variables.userId]
            });

            // ⭐⭐⭐ 추가: 친구 목록 캐시 무효화 ⭐⭐⭐
            queryClient.invalidateQueries({
                queryKey: ['friends', 'list', { userId: variables.userId }]
            });

            console.log('✅ [Mutation] 친구 요청 수락 완료 + 친구 목록 갱신');
        },

        onError: (error, variables, context) => {
            // ❌ 실패 시 롤백
            if (context?.previousCount !== undefined) {
                queryClient.setQueryData(['friendRequestCount', variables.userId], context.previousCount);
            }
            if (context?.previousList) {
                queryClient.setQueryData(['friendRequestList', variables.userId], context.previousList);
            }
            console.error('❌ [Mutation] 친구 요청 수락 실패:', error);
        },
    });
};

// 🆕 친구 요청 거절 (낙관적 업데이트)
export const useDeclineFriendRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, requestId }) => declineFriendRequest(userId, requestId),

        // 🆕 낙관적 업데이트 (수락과 동일한 로직)
        onMutate: async ({ userId, requestId }) => {
            await queryClient.cancelQueries({ queryKey: ['friendRequestCount', userId] });
            await queryClient.cancelQueries({ queryKey: ['friendRequestList', userId] });

            const previousCount = queryClient.getQueryData(['friendRequestCount', userId]);
            const previousList = queryClient.getQueryData(['friendRequestList', userId]);

            queryClient.setQueryData(['friendRequestCount', userId], (old) => {
                return old > 0 ? old - 1 : 0;
            });

            queryClient.setQueryData(['friendRequestList', userId], (old) => {
                if (!old) return old;
                return old.filter(req => req._id !== requestId);
            });

            return { previousCount, previousList };
        },

        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['friendRequestCount', variables.userId] });
            queryClient.invalidateQueries({ queryKey: ['friendRequestList', variables.userId] });

            console.log('✅ [Mutation] 친구 요청 거절 완료');
        },

        onError: (error, variables, context) => {
            if (context?.previousCount !== undefined) {
                queryClient.setQueryData(['friendRequestCount', variables.userId], context.previousCount);
            }
            if (context?.previousList) {
                queryClient.setQueryData(['friendRequestList', variables.userId], context.previousList);
            }
            console.error('❌ [Mutation] 친구 요청 거절 실패:', error);
        },
    });
};


/**
 * 친구 목록 조회 (무한 스크롤)
 * - React Query로 캐싱
 * - 온라인/오프라인 필터링
 * - 페이지네이션 지원
 *
 * @param {string} userId - 사용자 ID
 * @param {boolean} online - 온라인 필터 (undefined = 전체)
 * @returns {UseInfiniteQueryResult}
 */
export const useInfiniteFriends = (userId, online) => {
    return useInfiniteQuery({
        queryKey: ['friends', 'list', { userId, online }],

        queryFn: async ({ pageParam = 0 }) => {
            const PAGE_SIZE = 5;
            const offset = pageParam * PAGE_SIZE;
            const response = await getFriendsPage(userId, offset, PAGE_SIZE, online);

            return {
                friends: response.friends || [],
                total: response.total || 0,
                currentPage: pageParam,
            };
        },

        getNextPageParam: (lastPage) => {
            const PAGE_SIZE = 5;
            const nextPage = lastPage.currentPage + 1;

            // 다음 페이지가 있으면 페이지 번호 반환
            if (nextPage * PAGE_SIZE < lastPage.total) {
                return nextPage;
            }
            return undefined;  // 더 이상 페이지 없음
        },

        // 🎯 캐싱 전략
        staleTime: 10000,        // 10초 - 친구 목록은 자주 변경될 수 있음
        gcTime: 300000,          // 5분 후 가비지 컬렉션

        // 🎯 조건부 실행
        enabled: !!userId,       // userId 있을 때만 실행

        // 🎯 초기 페이지
        initialPageParam: 0,
    });
};


/**
 * 친구 삭제 Mutation (낙관적 업데이트)
 * - 즉시 UI에서 제거 (0ms)
 * - 백그라운드에서 API 호출
 * - 실패 시 자동 롤백
 * - 채팅방 목록 자동 무효화
 *
 * @returns {UseMutationResult}
 */
export const useDeleteFriend = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, friendId }) => deleteFriend(userId, friendId),

        // 🆕 낙관적 업데이트: API 호출 전 즉시 UI 업데이트
        onMutate: async ({ userId, friendId }) => {
            console.log('✨ [Optimistic] 친구 삭제 시작:', friendId);

            // 1. 진행 중인 쿼리 취소 (충돌 방지)
            await queryClient.cancelQueries({
                queryKey: ['friends', 'list', { userId }]
            });

            // 2. 이전 데이터 백업 (롤백용)
            const previousFriends = queryClient.getQueriesData({
                queryKey: ['friends', 'list', { userId }]
            });

            // 3. 모든 친구 목록 캐시에서 즉시 제거
            queryClient.setQueriesData(
                { queryKey: ['friends', 'list', { userId }] },
                (old) => {
                    if (!old?.pages) return old;

                    return {
                        ...old,
                        pages: old.pages.map(page => ({
                            ...page,
                            friends: page.friends.filter(f => f._id !== friendId),
                            total: Math.max(page.total - 1, 0),  // total도 감소
                        })),
                    };
                }
            );

            console.log('✨ [Optimistic] UI에서 즉시 제거 완료');

            // 4. 롤백용 데이터 반환
            return { previousFriends };
        },

        onSuccess: (data, variables) => {
            console.log('✅ [Mutation] 친구 삭제 성공 - 서버 확인');

            // ✅ 친구 목록 정확한 데이터로 갱신
            queryClient.invalidateQueries({
                queryKey: ['friends', 'list', { userId: variables.userId }]
            });

            // ✅ 친구 요청 관련 캐시 무효화
            queryClient.invalidateQueries({
                queryKey: ['friendRequestCount', variables.userId]
            });
            queryClient.invalidateQueries({
                queryKey: ['friendRequestList', variables.userId]
            });

            // ⭐ 채팅방 목록 캐시 무효화 (핵심!)
            queryClient.invalidateQueries({
                queryKey: ['chat-rooms']
            });
        },

        onError: (error, variables, context) => {
            console.error('❌ [Mutation] 친구 삭제 실패 - 롤백 시작:', error);

            // ❌ 실패 시 이전 데이터로 롤백
            if (context?.previousFriends) {
                context.previousFriends.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
                console.log('↩️ [Rollback] 이전 상태로 복원 완료');
            }
        },
    });
};