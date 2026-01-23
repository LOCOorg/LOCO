import { useQuery } from '@tanstack/react-query';
import { getLeagueRecord } from '../../api/userAPI';


//페이지별 참가자 분리할때 사용가능 2명3명4명5명
/**
 * 전적 정보 캐싱
 * - 5분 캐싱 (게임 결과 반영 시간 고려)
 * - Riot API 부하 감소
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

        // ✅ 캐싱 전략
        staleTime: 5 * 60 * 1000,   // 5분 - 게임 종료 후 데이터 반영 시간
        gcTime: 30 * 60 * 1000,     // 30분 - 메모리 유지

        // ✅ 조건부 실행
        enabled: !!gameName && !!tagLine,  // 둘 다 있을 때만 조회

        // ✅ 에러 처리
        retry: 1,  // 전적 조회 실패 시 1번만 재시도 (Riot API 부하 고려)

        // ✅ 에러 시 폴백
        placeholderData: null,  // 로딩 중에는 null 표시
    });
};

/**
 * Riot ID 정보 캐싱
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