// src/api/userAPI.js
// import axios from "axios";
import instance from "./axiosInstance.js"; // axios 모듈 import
import debounce from 'lodash.debounce';


//====================================================================================================================
//=========== 프롬프트 변경=========캐싱추가==========Request/Response확인============countDocuments 적용 가능성==============================================


// 유저 프로필 업데이트 API 함수 (PATCH 요청)
// 전체 저장 방식으로, 수정된 모든 필드를 한 번에 전송합니다.
export const updateUserProfile = async (userId, updatedData) => {
    // eslint-disable-next-line no-useless-catch
    try {
        const response = await instance.patch(`/api/user/${userId}`, updatedData);
        return response.data.data || response.data.user;
    } catch (error) {
        throw error;
    }
};

//=========== //=========== 프롬프트 변경=========캐싱추가==========Request/Response확인============countDocuments 적용 가능성============================================== 변경=============================================================================



// 유저 별점 업데이트 API 함수 (fetch 사용)
export const rateUser = async (userId, rating) => {
    try {
        const response = await instance.post(
            `/api/user/${userId}/rate`,
            { rating }//,
            // {
            //     headers: {
            //         "Content-Type": "application/json",
            //     },
            // }
        );
        return response.data;
    } catch (error) {
        console.error("rateUser API 호출 중 오류:", error);
        // axios의 error 객체는 response를 포함할 수 있음
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error("별점 업데이트 실패");
    }
};

//=========== //=========== 프롬프트 변경=========캐싱추가==========Request/Response확인============countDocuments 적용 가능성============================================== 변경=============================================================================

// 별칭(nickname)으로 사용자 조회 API 함수
export const getUserByNickname = async (nickname) => {
    try {
        const response = await instance.get(`/api/user/nickname/${encodeURIComponent(nickname)}`);
        console.log("API 응답 데이터:", response.data); // 응답 데이터 확인
        const data = response.data.data;
        if (!data) {
            throw new Error("응답 데이터에 user 정보가 없습니다.");
        }
        // 만약 data가 배열이면 첫 번째 요소 반환, 아니면 그대로 반환
        if (Array.isArray(data)) {
            if (data.length === 0) {
                throw new Error("해당 별칭을 가진 사용자를 찾을 수 없습니다.");
            }
            return data[0];
        } else {
            return data;
        }
        // eslint-disable-next-line no-unused-vars
    } catch (error) {
        throw new Error("유저 정보를 불러오는 데 실패했습니다.");
    }
};

//=========== //=========== 프롬프트 변경=========캐싱추가==========Request/Response확인============countDocuments 적용 가능성============================================== 변경=============================================================================

export const decrementChatCount = async (userId) => {
    try {
        const response = await instance.post(
            `/api/user/${userId}/decrementChatCount`,
            // { userId },
            // {
            //     headers: {
            //         "Content-Type": "application/json",
            //     },
            // }
        );
        return response.data;
    } catch (error) {
        console.error("채팅 횟수 감소 중 오류 발생:", error);
        throw error;
    }
};

//=========== 프롬프트 변경=========캐싱추가==========Request/Response확인==========================================================


// 친구 요청 보내기 API 함수
export const sendFriendRequest = debounce( async (senderId, receiverId) => {
    try {
        // senderId를 URL 경로에 추가 (라우터: "/:userId/friend-request")
        const response = await instance.post(`/api/user/${senderId}/friend-request`, { senderId, receiverId });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data.message || error.message);
    }
    },
    300,  // 300ms 딜레이
    { leading: true, trailing: false }
);
//=========== 프롬프트 변경=========캐싱추가============Request/Response확인========================================================


// 친구 요청 수락 API 함수
export const acceptFriendRequest = async (userId, requestId) => {
    try {
        // userId(친구 요청을 수락하는 사용자)를 URL 경로에 추가 (라우터: "/:userId/friend-request/accept")
        const response = await instance.post(`/api/user/${userId}/friend-request/accept`, { requestId });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data.message || error.message);
    }
};

//=========== 프롬프트 변경=========캐싱추가==========Request/Response확인============countDocuments 적용 가능성==============================================


// 친구 요청 목록 조회 API 함수
export const getFriendRequestList = async (userId) => {
    try {
        // 라우터 경로: "/:userId/friend-requests"
        const response = await instance.get(`/api/user/${userId}/friend-requests`);
        return response.data.data; // 백엔드에서 data 필드에 목록 전달
    } catch (error) {
        throw new Error(error.response?.data.message || error.message);
    }
};
//=========== 프롬프트 변경=========캐싱추가==========Request/Response확인============countDocuments 적용 가능성==============================================



/**
 * 친구 요청 개수만 조회 (최적화)
 * 전체 데이터 대신 개수만 받아서 네트워크 트래픽 99% 감소
 * @param {string} userId - 사용자 ID
 * @returns {Promise<number>} 친구 요청 개수
 */
export const getFriendRequestCount = async (userId) => {
    try {
        console.log(`📊 [API] 친구 요청 개수 조회: ${userId}`);
        const response = await instance.get(`/api/user/${userId}/friend-requests/count`);
        console.log(`✅ [API] 친구 요청 개수: ${response.data.count}개`);
        return response.data.count;  // ✅ count만 반환
    } catch (error) {
        console.error(`❌ [API] 친구 요청 개수 조회 실패:`, error);
        throw new Error(error.response?.data.message || error.message);
    }
};



//=========== 프롬프트 변경=========캐싱추가==========Request/Response확인============countDocuments 적용 가능성==============================================



// 친구 요청 거절 API 함수
export const declineFriendRequest = async (userId, requestId) => {
    try {
        const response = await instance.post(`/api/user/${userId}/friend-request/decline`, { requestId });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data.message || error.message);
    }
};

//=========== 프롬프트 변경=========캐싱추가==========Request/Response확인============countDocuments 적용 가능성==============================================



// 친구 삭제 요청 API
export const deleteFriend = async (userId, friendId) => {
    try {
        const response = await instance.delete(`/api/user/${userId}/friends/${friendId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data.message || error.message);
    }
};

//=========== 프롬프트 변경=========캐싱추가==========Request/Response확인============countDocuments 적용 가능성==============================================
//차단부터 실제 구동 확인해봐야 할 듯

/**
 * 사용자 차단 (최소 응답)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const blockUserMinimal = async (userId, targetUserId) => {
    const response = await instance.post(
        `/api/user/${userId}/block/${targetUserId}/minimal`
    );
    return response.data;
};

/**
 * 차단 해제 (최소 응답)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const unblockUserMinimal = async (userId, targetUserId) => {
    const response = await instance.delete(
        `/api/user/${userId}/block/${targetUserId}/minimal`
    );
    return response.data;
};

//=========== 프롬프트 변경=========캐싱추가==========Request/Response확인============countDocuments 적용 가능성==============================================


/**
 * 차단 목록 조회
 * GET /api/user/:userId/blocked
 */
export const getBlockedUsers = async (userId) => {
    try {
        const response = await instance.get(
            `/api/user/${userId}/blocked`
        );
        // console.log('getBlockedUsers API 응답:', response.data); // 디버깅용
        return response.data.blockedUsers; // blockedUsers 필드로 수정
    } catch (error) {
        console.error('getBlockedUsers API 오류:', error);
        throw new Error(error.response?.data.message || error.message);
    }
};

//=========== 프롬프트 변경=========캐싱추가==========Request/Response확인============countDocuments 적용 가능성==============================================

// ⚠️ getLeagueRecord는 riotAPI.js로 이동됨
// import { getLeagueRecord, refreshLeagueRecord } from './riotAPI.js';

export const getFriendsPage = async (userId, offset = 0, limit = 20, online) => {
    try {
        const params = { offset, limit };
        if (online !== undefined) {
            params.online = online;
        }
        const url = `/api/user/${userId}/friends`;
        const res = await instance.get(url, { params });
        return res.data;
    } catch (err) {
        console.error("친구 목록을 불러오는 데 실패했습니다.", err); 
        throw err; 
    }
};

//추가 확인 필요
export const updateUserPrefs = async (userId, prefs) => {
    try {
        // PATCH /api/user/:userId/prefs
        const response = await instance.patch(`/api/user/${userId}/prefs`, prefs);
        return response.data.data;
    } catch (error) {
        throw new Error(error.response?.data.message || error.message);
    }
};
//=========== 프롬프트 변경=========캐싱추가==========Request/Response확인============countDocuments 적용 가능성==============================================

// 닉네임 중복 체크
export const checkNickname = async (nickname, userId = null) => {
    try {
        const params = userId ? { userId } : {};
        const response = await instance.get(`/api/user/check-nickname/${encodeURIComponent(nickname)}`, { params });
        return response.data;
    } catch (error) {
        console.error('닉네임 중복 체크 에러:', error);
        throw error;
    }
};


//=========== 프롬프트 변경=========캐싱추가==========Request/Response확인============countDocuments 적용 가능성==============================================

// 닉네임/성별 변경 가능 여부 확인
export const checkChangeAvailability = async (userId) => {
    try {
        const response = await instance.get(`/api/user/${userId}/change-availability`);
        return response.data;
    } catch (error) {
        console.error('변경 가능 여부 확인 에러:', error);
        throw error;
    }
};

//=========== 프롬프트 변경=========캐싱추가==========Request/Response확인============countDocuments 적용 가능성==============================================
