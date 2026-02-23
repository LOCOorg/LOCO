// src/utils/loadFullUser.js
// OAuth 로그인 및 AuthInit에서 공통으로 사용하는 유저 + 친구 + 차단 목록 로드 유틸리티

import { getUserFriendIds } from '../api/userLightAPI.js';
import { getBlockedUsers } from '../api/userAPI.js';
import useAuthStore from '../stores/authStore.js';
import useBlockedStore from '../stores/useBlockedStore.js';

/**
 * 기본 유저 객체를 받아 친구 ID 목록과 차단 사용자 목록을 병렬 로드한 후
 * authStore와 blockedStore에 설정합니다.
 * @param {Object} baseUser - 서버에서 받은 기본 유저 객체 (_id 필수)
 * @returns {Object} friends 필드가 병합된 최종 유저 객체
 */
export async function loadFullUser(baseUser) {
    const [friendData, blockedList] = await Promise.all([
        getUserFriendIds(baseUser._id).catch(err => {
            console.error('[loadFullUser] 친구 ID 로드 실패:', err);
            return { friendIds: [] };
        }),
        getBlockedUsers(baseUser._id).catch(err => {
            console.error('[loadFullUser] 차단 목록 로드 실패:', err);
            return [];
        })
    ]);

    const finalUser = { ...baseUser, friends: friendData.friendIds };
    useAuthStore.getState().setUser(finalUser);
    useBlockedStore.getState().setBlockedUsers(blockedList);

    console.log('[loadFullUser] 유저 + 친구 + 차단 목록 로드 완료:', baseUser._id);
    return finalUser;
}
