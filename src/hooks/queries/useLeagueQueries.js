import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLeagueRecord, refreshLeagueRecord } from '../../api/riotAPI';


/**
 * 전적 정보 조회 (DB 캐시 우선)
 * - 서버 DB에 캐싱된 데이터 즉시 반환 (0.1초)
 * - 클라이언트에서 30분 캐싱
 *
 * @param {string} gameName - Riot 게임명
 * @param {string} tagLine - Riot 태그라인
 * @returns {UseQueryResult}
 *
 * @example
 * const { data: record, isLoading, error } = useLeagueRecord('Hide on bush', 'KR1');
 */
export const useLeagueRecord = (gameName, tagLine) => {
    return useQuery({
        queryKey: ['league-record', gameName, tagLine],
        queryFn: () => getLeagueRecord(gameName, tagLine),

        // ✅ 캐싱 전략 - DB 캐싱으로 더 길게 설정 가능
        staleTime: 30 * 60 * 1000,   // 30분 - DB에서 오므로 길게
        gcTime: 60 * 60 * 1000,      // 1시간 - 메모리 유지

        // ✅ 조건부 실행
        enabled: !!gameName && !!tagLine,

        // ✅ 에러 처리
        retry: 1,

        // ✅ 에러 시 폴백
        placeholderData: null,
    });
};

/**
 * 전적 갱신 (새로고침 버튼)
 * - Riot API에서 최신 데이터 조회 → DB 업데이트
 * - 5분 쿨타임 적용
 *
 * @returns {UseMutationResult}
 *
 * @example
 * const { mutate: refresh, isPending } = useRefreshLeagueRecord();
 * refresh({ gameName: 'Hide on bush', tagLine: 'KR1' });
 */
export const useRefreshLeagueRecord = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ gameName, tagLine }) =>
            refreshLeagueRecord(gameName, tagLine),

        onSuccess: (data, { gameName, tagLine }) => {
            // 캐시 업데이트
            queryClient.setQueryData(
                ['league-record', gameName, tagLine],
                data
            );
            console.log(`✅ 전적 갱신 완료: ${gameName}#${tagLine}`);
        },

        onError: (error) => {
            console.error('❌ 전적 갱신 실패:', error.message);
        }
    });
};

/**
 * Riot ID 정보 캐싱 (사용자 DB에서)
 * - 1시간 캐싱 (거의 안 바뀜)
 *
 * @param {string} userId - 사용자 ID
 * @returns {UseQueryResult}
 */
export const useUserRiotInfo = (userId) => {
    return useQuery({
        queryKey: ['user-riot-info', userId],
        queryFn: async () => {
            const { getUserRiotInfo } = await import('../../api/userLightAPI');
            return getUserRiotInfo(userId);
        },

        staleTime: 60 * 60 * 1000,   // 1시간
        gcTime: 2 * 60 * 60 * 1000,  // 2시간
        enabled: !!userId,
    });
};
