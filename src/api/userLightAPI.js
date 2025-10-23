// ============================================================================
// 경량 사용자 프로필 API
// 목적: 필요한 정보만 요청하여 네트워크 최적화
// ============================================================================

import instance from "./axiosInstance.js";

/**
 * 기본 프로필 정보 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} { _id, nickname, profilePhoto }
 *
 * 사용 예시:
 * const profile = await getUserBasic(userId);
 * console.log(profile.nickname);
 */
export const getUserBasic = async (userId) => {
    try {
        const response = await instance.get(`/api/user/${userId}/basic`);
        return response.data.data;
    } catch (error) {
        console.error('getUserBasic 에러:', error);
        throw new Error(error.response?.data?.message || "기본 프로필 조회 실패");
    }
};

/**
 * Riot ID 정보 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} { riotGameName, riotTagLine }
 *
 * 사용 예시:
 * const { riotGameName, riotTagLine } = await getUserRiotInfo(userId);
 * const record = await getLeagueRecord(riotGameName, riotTagLine);
 */
export const getUserRiotInfo = async (userId) => {
    try {
        const response = await instance.get(`/api/user/${userId}/riot-info`);
        return response.data.data;
    } catch (error) {
        console.error('getUserRiotInfo 에러:', error);
        throw new Error(error.response?.data?.message || "Riot ID 조회 실패");
    }
};

/**
 * 닉네임만 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} { nickname }
 *
 * 사용 예시:
 * const { nickname } = await getUserNickname(userId);
 * setUserName(nickname);
 */
export const getUserNickname = async (userId) => {
    try {
        const response = await instance.get(`/api/user/${userId}/nickname`);
        return response.data.data;
    } catch (error) {
        console.error('getUserNickname 에러:', error);
        throw new Error(error.response?.data?.message || "닉네임 조회 실패");
    }
};

/**
 * 친구 프로필 정보 조회
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} { _id, nickname, profilePhoto, star, gender }
 *
 * 사용 예시:
 * const friendProfile = await getUserFriendProfile(friendId);
 * addFriend(friendProfile);
 */
export const getUserFriendProfile = async (userId) => {
    try {
        const response = await instance.get(`/api/user/${userId}/friend-profile`);
        return response.data.data;
    } catch (error) {
        console.error('getUserFriendProfile 에러:', error);
        throw new Error(error.response?.data?.message || "친구 프로필 조회 실패");
    }
};


// ✅ 친구 ID 목록 조회
export const getUserFriendIds = async (userId) => {
    try {
        const response = await instance.get(`/api/user/${userId}/friends-ids`);
        return response.data.data; // { friendIds: string[] }
    } catch (error) {
        console.error('친구 ID 조회 실패:', error);
        throw new Error(error.response?.data.message || error.message);
    }
};