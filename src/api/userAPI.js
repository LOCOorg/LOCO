// src/api/userAPI.js
import axios from "axios"; // axios 모듈 import

const host = `${import.meta.env.VITE_API_HOST}/api/user`;

// 유저 정보 조회 API 함수
export const getUserInfo = async (userId) => {
    try {
        const response = await axios.get(`${host}/${userId}`); // API 호출
        return response.data.data; // 성공적으로 데이터 받으면 반환
        // eslint-disable-next-line no-unused-vars
    } catch (error) {
        throw new Error("유저 정보를 불러오는 데 실패했습니다."); // 에러 발생 시 에러 메시지
    }
};


// 유저 프로필 업데이트 API 함수 (PATCH 요청)
// 전체 저장 방식으로, 수정된 모든 필드를 한 번에 전송합니다.
export const updateUserProfile = async (userId, updatedData) => {
    try {
        const response = await axios.patch(`${host}/${userId}`, updatedData);
        return response.data.data || response.data.user;
    } catch (error) {
        throw new Error(error.response?.data.message || error.message);
    }
};


// 유저 별점 업데이트 API 함수 (fetch 사용)
export const rateUser = async (userId, rating) => {
    try {
        const response = await axios.post(
            `${host}/${userId}/rate`,
            { rating },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
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

// 별칭(nickname)으로 사용자 조회 API 함수
export const getUserByNickname = async (nickname) => {
    try {
        const response = await axios.get(`${host}/nickname/${encodeURIComponent(nickname)}`);
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

export const decrementChatCount = async (userId) => {
    try {
        const response = await axios.post(
            `${host}/${userId}/decrementChatCount`,
            { userId },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("채팅 횟수 감소 중 오류 발생:", error);
        throw error;
    }
};

// 친구 요청 보내기 API 함수
export const sendFriendRequest = async (senderId, receiverId) => {
    try {
        // senderId를 URL 경로에 추가 (라우터: "/:userId/friend-request")
        const response = await axios.post(`${host}/${senderId}/friend-request`, { senderId, receiverId });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data.message || error.message);
    }
};

// 친구 요청 수락 API 함수
export const acceptFriendRequest = async (userId, requestId) => {
    try {
        // userId(친구 요청을 수락하는 사용자)를 URL 경로에 추가 (라우터: "/:userId/friend-request/accept")
        const response = await axios.post(`${host}/${userId}/friend-request/accept`, { requestId });
        return response.data.data;
    } catch (error) {
        throw new Error(error.response?.data.message || error.message);
    }
};

// 친구 요청 목록 조회 API 함수
export const getFriendRequestList = async (userId) => {
    try {
        // 라우터 경로: "/:userId/friend-requests"
        const response = await axios.get(`${host}/${userId}/friend-requests`);
        return response.data.data; // 백엔드에서 data 필드에 목록 전달
    } catch (error) {
        throw new Error(error.response?.data.message || error.message);
    }
};

// 친구 요청 거절 API 함수
export const declineFriendRequest = async (userId, requestId) => {
    try {
        const response = await axios.post(`${host}/${userId}/friend-request/decline`, { requestId });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data.message || error.message);
    }
};

// 친구 삭제 요청 API
export const deleteFriend = async (userId, friendId) => {
    try {
        const response = await axios.delete(`${host}/${userId}/friends/${friendId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data.message || error.message);
    }
};

/**
 * 사용자 차단
 * POST /api/user/:userId/block/:targetUserId
 */
export const blockUser = async (userId, targetUserId) => {
    try {
        const response = await axios.post(
            `${host}/${userId}/block/${targetUserId}`
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data.message || error.message);
    }
};

/**
 * 차단 해제
 * DELETE /api/user/:userId/block/:targetUserId
 */
export const unblockUser = async (userId, targetUserId) => {
    try {
        const response = await axios.delete(
            `${host}/${userId}/block/${targetUserId}`
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data.message || error.message);
    }
};

/**
 * 차단 목록 조회
 * GET /api/user/:userId/blocked
 */
export const getBlockedUsers = async (userId) => {
    try {
        const response = await axios.get(
            `${host}/${userId}/blocked`
        );
        return response.data.data; // [{ _id, nickname, photo }, …]
    } catch (error) {
        throw new Error(error.response?.data.message || error.message);
    }
};

/**
 * Riot ID(gameName, tagLine)로 PUUID 기반 전적 조회
 * @param {string} gameName – Riot ID의 게임명 부분
 * @param {string} tagLine – Riot ID의 태그라인 부분
 */
export const getLeagueRecord = async (gameName, tagLine) => {
    try {
        const encodedGameName = encodeURIComponent(gameName);
        const encodedTagLine = encodeURIComponent(tagLine);
        const response = await axios.get(
            `${host}/lol/${encodedGameName}/${encodedTagLine}`
        );
        return response.data.data; // { summoner: {...}, matches: [...] }
    } catch (error) {
        console.error("getLeagueRecord API 호출 중 오류:", error);
        throw new Error("전적을 불러오는 데 실패했습니다.");
    }
};

export const getFriendsPage = async (userId, offset = 0, limit = 20) => {
    try {
        const url = `${host}/${userId}/friends?offset=${offset}&limit=${limit}`;
        const res = await axios.get(url);
        // 백엔드에서 { total, friends } 형태로 내려준다고 가정
        return res.data;
    } catch (err) {
        throw new Error("친구 목록을 불러오는 데 실패했습니다.");
    }
};
