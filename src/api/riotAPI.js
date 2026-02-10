// src/api/riotAPI.js
// 라이엇 전적 조회 API

import instance from "./axiosInstance.js";

/**
 * 전적 조회 (캐시 우선)
 * - DB에 캐시된 데이터가 있으면 즉시 반환
 * - 없으면 Riot API 호출 후 DB 저장 → 반환
 *
 * @param {string} gameName - Riot ID의 게임명 부분
 * @param {string} tagLine - Riot ID의 태그라인 부분
 * @returns {Promise<Object>} 전적 데이터
 */
export const getLeagueRecord = async (gameName, tagLine) => {
    try {
        const encodedGameName = encodeURIComponent(gameName);
        const encodedTagLine = encodeURIComponent(tagLine);

        const response = await instance.get(
            `/api/riot/lol/${encodedGameName}/${encodedTagLine}`
        );

        return response.data.data;
    } catch (error) {
        console.error("getLeagueRecord API 호출 중 오류:", error);

        // 에러 메시지 개선
        if (error.response?.status === 404) {
            throw new Error("소환사를 찾을 수 없습니다.");
        }
        if (error.response?.status === 502) {
            throw new Error("Riot API 키가 만료되었습니다.");
        }
        if (error.response?.status === 503) {
            throw new Error("Riot API 호출 제한에 걸렸습니다. 잠시 후 다시 시도해주세요.");
        }

        throw new Error("전적을 불러오는 데 실패했습니다.");
    }
};

/**
 * 전적 갱신 (새로고침)
 * - Riot API에서 최신 데이터 조회 → DB 업데이트 → 반환
 * - 5분 쿨타임 적용
 *
 * @param {string} gameName - Riot ID의 게임명 부분
 * @param {string} tagLine - Riot ID의 태그라인 부분
 * @returns {Promise<Object>} 갱신된 전적 데이터
 */
export const refreshLeagueRecord = async (gameName, tagLine) => {
    try {
        const encodedGameName = encodeURIComponent(gameName);
        const encodedTagLine = encodeURIComponent(tagLine);

        const response = await instance.post(
            `/api/riot/lol/${encodedGameName}/${encodedTagLine}/refresh`
        );

        return response.data.data;
    } catch (error) {
        console.error("refreshLeagueRecord API 호출 중 오류:", error);

        // 쿨타임 에러
        if (error.response?.status === 429) {
            const data = error.response.data.data;
            const cooldown = data?.cooldownRemaining || 0;
            throw new Error(`${cooldown}초 후 갱신 가능합니다.`);
        }

        // 기타 에러
        if (error.response?.status === 404) {
            throw new Error("소환사를 찾을 수 없습니다.");
        }
        if (error.response?.status === 502) {
            throw new Error("Riot API 키가 만료되었습니다.");
        }
        if (error.response?.status === 503) {
            throw new Error("Riot API 호출 제한에 걸렸습니다. 잠시 후 다시 시도해주세요.");
        }

        throw new Error("전적 갱신에 실패했습니다.");
    }
};
