import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {getUserMinimal, getUserFullProfile, getUserForEdit} from '../../api/userProfileLightAPI';
import { updateUserProfile } from '../../api/userAPI';

/**
 * 최소 프로필 조회 (프로필 사진, 닉네임, ID)
 * - 버튼 표시용
 * - 10분 캐싱 (자주 안 바뀜)
 *
 * @param {string} userId - 사용자 ID
 * @param {Object} options - 추가 옵션
 * @returns {UseQueryResult}
 */
export const useUserMinimal = (userId, options = {}) => {
    return useQuery({
        queryKey: ['userMinimal', userId],
        queryFn: () => getUserMinimal(userId),
        enabled: !!userId && options.enabled !== false,
        staleTime: 10 * 60 * 1000,      // 10분 - 프로필 사진은 자주 안 바뀜
        gcTime: 15 * 60 * 1000,         // 15분 후 가비지 컬렉션
        retry: 2,
        ...options,
    });
};

/**
 * 전체 프로필 조회 (8개 필드)
 * - 모달 표시용
 * - 5분 캐싱
 *
 * @param {string} userId - 사용자 ID
 * @param {Object} options - 추가 옵션
 * @returns {UseQueryResult}
 */
export const useUserFullProfile = (userId, options = {}) => {
    return useQuery({
        queryKey: ['userFullProfile', userId],
        queryFn: () => getUserFullProfile(userId),
        enabled: !!userId && options.enabled !== false,
        staleTime: 5 * 60 * 1000,       // 5분 - 모달용
        gcTime: 10 * 60 * 1000,         // 10분 후 가비지 컬렉션
        retry: 2,
        ...options,
    });
};

/**
 * 프로필 데이터 프리페치 (미리 로드)
 * - 사용자가 버튼에 마우스를 올릴 때 미리 로드
 *
 * @example
 * const prefetchProfile = usePrefetchUserProfile();
 * <button onMouseEnter={() => prefetchProfile(userId)}>
 */
export const usePrefetchUserProfile = () => {
    const queryClient = useQueryClient();

    return (userId) => {
        if (!userId) return;

        queryClient.prefetchQuery({
            queryKey: ['userFullProfile', userId],
            queryFn: () => getUserFullProfile(userId),
            staleTime: 5 * 60 * 1000,
        });
    };
};

/**
 * 프로필 편집 정보 조회 (MyPageComponent용)
 * - 11개 필드 반환
 * - 5분 캐싱
 *
 * @param {string} userId - 사용자 ID
 * @param {Object} options - 추가 옵션
 * @returns {UseQueryResult}
 */
export const useUserForEdit = (userId, options = {}) => {
    return useQuery({
        queryKey: ['userForEdit', userId],
        queryFn: () => getUserForEdit(userId),
        enabled: !!userId && options.enabled !== false,
        staleTime: 5 * 60 * 1000,       // 5분 - 편집 정보
        gcTime: 10 * 60 * 1000,         // 10분 후 가비지 컬렉션
        retry: 2,
        ...options,
    });
};

export const useUpdateUserProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, formData }) => updateUserProfile(userId, formData),

        onSuccess: (data, variables) => {
            // ✅ PR 캐시 무효화
            queryClient.invalidateQueries({ queryKey: ['pr', 'top-users'] });
            queryClient.invalidateQueries({ queryKey: ['pr', 'user-list'] });

            // ✅ 유저 프로필 캐시 무효화
            queryClient.invalidateQueries({ queryKey: ['userMinimal', variables.userId] });
            queryClient.invalidateQueries({ queryKey: ['userFullProfile', variables.userId] });
            queryClient.invalidateQueries({ queryKey: ['userForEdit', variables.userId] });

            console.log('✅ [Mutation] 프로필 수정 완료 - 전체 캐시 무효화');
        },
    });
};