import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchNotifications,
    markNotificationAsRead,
    markNotificationAsReadAndDelete
} from '../../api/reportNotificationAPI';
import {updateUserPrefs} from "../../api/userAPI.js";
import { useInfiniteQuery } from '@tanstack/react-query';

/**
 * 알림 목록 조회
 * - 1분 캐싱
 * - 사용자별 알림 관리
 *
 * @param {string} userId - 사용자 ID
 * @param {Object} options - 추가 옵션
 * @returns {UseQueryResult}
 */
export const useNotifications = (userId, options = {}) => {
    return useQuery({
        queryKey: ['notifications', userId],
        queryFn: () => fetchNotifications(userId),
        enabled: !!userId && options.enabled !== false,
        staleTime: 1 * 60 * 1000,       // 1분 - 알림은 자주 바뀜
        gcTime: 5 * 60 * 1000,          // 5분 후 가비지 컬렉션
        retry: 2,
        ...options,
    });
};

/**
 * 알림 읽음 처리 Mutation
 * - 낙관적 업데이트
 * - 자동 캐시 업데이트
 *
 * @returns {UseMutationResult}
 */
export const useMarkAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationId) => markNotificationAsRead(notificationId),

        onSuccess: (data, notificationId) => {
            // ✅ 모든 사용자의 알림 캐시 무효화
            queryClient.invalidateQueries({
                queryKey: ['notifications']
            });

            console.log('✅ [Mutation] 알림 읽음 처리 완료');
        },

        onError: (error) => {
            console.error('❌ [Mutation] 알림 읽음 처리 실패:', error);
        },
    });
};

/**
 * 알림 읽음 + 삭제 Mutation (낙관적 업데이트)
 * - 즉시 UI에서 제거
 * - 서버 응답 대기 없음
 *
 * @returns {UseMutationResult}
 */
export const useMarkAsReadAndDelete = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ notificationId }) => markNotificationAsReadAndDelete(notificationId),

        // 🆕 낙관적 업데이트: API 호출 전 즉시 UI 업데이트
        onMutate: async ({ userId, notificationId }) => {
            // 1. 진행 중인 쿼리 취소
            await queryClient.cancelQueries({
                queryKey: ['notifications', userId]
            });

            // 2. 이전 데이터 백업
            const previousNotifications = queryClient.getQueryData(['notifications', userId]);

            // 3. 캐시에서 알림 즉시 제거
            queryClient.setQueryData(['notifications', userId], (old) => {
                if (!old) return old;
                return old.filter(notif => notif._id !== notificationId);
            });

            console.log('✨ [Optimistic] 알림 삭제 반영:', notificationId);

            // 4. 롤백용 데이터 반환
            return { previousNotifications };
        },

        onSuccess: (data, variables) => {
            // ✅ 서버 응답 후 캐시 무효화 (정확한 데이터 보장)
            queryClient.invalidateQueries({
                queryKey: ['notifications', variables.userId]
            });

            console.log('✅ [Mutation] 알림 삭제 완료');
        },

        onError: (error, variables, context) => {
            // ❌ 실패 시 이전 데이터로 롤백
            if (context?.previousNotifications) {
                queryClient.setQueryData(
                    ['notifications', variables.userId],
                    context.previousNotifications
                );
            }

            console.error('❌ [Mutation] 알림 삭제 실패:', error);
        },
    });
};

/**
 * 사용자 알림 설정 업데이트 Mutation
 * - 친구 요청, 토스트, 채팅 미리보기, 욕설 필터 설정
 * - 낙관적 업데이트 적용
 *
 * @returns {UseMutationResult}
 */
export const useUpdateUserPrefs = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, prefs }) => updateUserPrefs(userId, prefs),

        onMutate: async ({ userId, prefs }) => {
            // 1. 진행 중인 쿼리 취소
            await queryClient.cancelQueries({
                queryKey: ['userPrefs', userId]
            });

            // 2. 이전 데이터 백업
            const previousPrefs = queryClient.getQueryData(['userPrefs', userId]);

            // 3. 캐시 즉시 업데이트
            queryClient.setQueryData(['userPrefs', userId], (old) => ({
                ...old,
                ...prefs
            }));

            console.log('✨ [Optimistic] 알림 설정 변경:', prefs);

            // 4. 롤백용 데이터 반환
            return { previousPrefs };
        },

        onSuccess: (data, variables) => {
            // ✅ 서버 응답 후 캐시 무효화
            queryClient.invalidateQueries({
                queryKey: ['userPrefs', variables.userId]
            });

            console.log('✅ [Mutation] 알림 설정 업데이트 완료');
        },

        onError: (error, variables, context) => {
            // ❌ 실패 시 이전 데이터로 롤백
            if (context?.previousPrefs) {
                queryClient.setQueryData(
                    ['userPrefs', variables.userId],
                    context.previousPrefs
                );
            }

            console.error('❌ [Mutation] 알림 설정 업데이트 실패:', error);
        },
    });
};

/**
 * 사용자 알림 설정 조회
 * - 10분 캐싱
 *
 * @param {string} userId - 사용자 ID
 * @returns {UseQueryResult}
 */
export const useUserPrefs = (userId, options = {}) => {
    return useQuery({
        queryKey: ['userPrefs', userId],
        queryFn: async () => {
            // userAPI에 getUserPrefs 함수가 없다면 getUserForEdit 사용
            const { getUserForEdit } = await import('../../api/userProfileLightAPI');
            const userData = await getUserForEdit(userId);
            return {
                friendReqEnabled: userData.friendReqEnabled ?? true,
                toastEnabled: userData.toastEnabled ?? true,
                chatPreviewEnabled: userData.chatPreviewEnabled ?? true,
                wordFilterEnabled: userData.wordFilterEnabled ?? true,
            };
        },
        enabled: !!userId && options.enabled !== false,
        staleTime: 10 * 60 * 1000,      // 10분
        gcTime: 15 * 60 * 1000,         // 15분
        retry: 2,
        ...options,
    });
};


/**
 * 알림 무한 스크롤 조회
 * - 페이지네이션 지원
 * - 자동 다음 페이지 로드
 *
 * @param {string} userId - 사용자 ID
 * @param {number} pageSize - 페이지당 알림 수 (기본 20)
 * @returns {UseInfiniteQueryResult}
 */
export const useInfiniteNotifications = (userId, pageSize = 20) => {
    return useInfiniteQuery({
        queryKey: ['notifications', 'infinite', userId],

        queryFn: ({ pageParam = 1 }) => {
            return fetchNotifications(userId, pageParam, pageSize);
        },

        getNextPageParam: (lastPage, allPages) => {
            // 서버 응답에서 다음 페이지 정보 확인
            // 방법 1: 서버가 hasMore를 보내주는 경우
            if (lastPage.hasMore) {
                return allPages.length + 1;
            }

            // 방법 2: 데이터 개수로 판단
            if (lastPage.length === pageSize) {
                return allPages.length + 1;
            }

            return undefined;  // 더 이상 페이지 없음
        },

        enabled: !!userId,
        staleTime: 1 * 60 * 1000,       // 1분
        gcTime: 5 * 60 * 1000,          // 5분
    });
};