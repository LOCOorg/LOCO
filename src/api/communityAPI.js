// src/api/communityApi.js
import instance from './axiosInstance';



export const fetchCommunities = async (
    page = 1,
    size = 10,
    category = '전체',
    userId = null,
    sort = '최신순',
    keyword = '',
    searchType = 'title+content',
    period = '전체'
) => {
    let url = `/api/communities?page=${page}&size=${size}`;
    if (category)    url += `&category=${encodeURIComponent(category)}`;
    if (userId)      url += `&userId=${userId}`;
    if (sort)        url += `&sort=${encodeURIComponent(sort)}`;
    if (keyword)     url += `&keyword=${encodeURIComponent(keyword)}`;
    if (searchType)  url += `&searchType=${encodeURIComponent(searchType)}`;
    if (period) url += `&period=${encodeURIComponent(period)}`;

    const response = await instance.get(url);
    return response.data;
};


export const fetchCommunityById = async (id) => {
    try {
        const response = await instance.get(`/api/communities/${id}`);
        return response.data;
    } catch (error) {
        console.error("fetchCommunityById error:", error);
        throw error;
    }
};

export const fetchCommentsByPostId = async (postId, page = 1, size = 20) => {
    try {
        const response = await instance.get(`/api/communities/${postId}/comments?page=${page}&size=${size}`);
        return response.data;
    } catch (error) {
        console.error("fetchCommentsByPostId error:", error);
        throw error;
    }
};

export const createCommunity = async (communityData) => {
    try {
        const response = await instance.post('/api/communities', communityData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error("createCommunity error:", error);
        throw error;
    }
};

export const updateCommunity = async (id, updateData) => {
    try {
        const response = await instance.put(`/api/communities/${id}`, updateData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error("updateCommunity error:", error);
        throw error;
    }
};

// communityAPI.js에서 삭제 관련 에러 메시지 개선
export const deleteCommunity = async (id) => {
    try {
        const response = await instance.delete(`/api/communities/${id}`);
        return response.data;
    } catch (error) {
        console.error("deleteCommunity error:", error);
        if (error.response?.status === 404) {
            throw new Error("삭제할 게시글을 찾을 수 없습니다.");
        }
        throw error;
    }
};


export const recommendCommunity = async (id, userId) => {
    try {
        const response = await instance.post(`/api/communities/${id}/recommend`, { userId });
        return response.data;
    } catch (error) {
        console.error("recommendCommunity error:", error);
        throw error;
    }
};

// 추천 취소
export const cancelRecommendCommunity = async (id, userId) => {
    try {
        const response = await instance.delete(`/api/communities/${id}/recommend`,{ data: { userId }
        });
        return response.data;
    } catch (error) {
        console.error("cancelRecommendCommunity error:", error);
        throw error;
    }
};

// 댓글 추가 API 호출 함수
export const addComment = async (communityId, commentData) => {
    try {
        const response = await instance.post(`/api/communities/${communityId}/comments`, commentData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error("addComment error:", error);
        throw error;
    }
};

export const addReply = async (communityId, commentId, replyData) => {
    try {
        const response = await instance.post(
            `/api/communities/${communityId}/comments/${commentId}/replies`,
            replyData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("addReply error:", error);
        throw error;
    }
};

export const addSubReply = async (communityId, commentId, replyId, subReplyData) => {
    try {
        const response = await instance.post(
            `/api/communities/${communityId}/comments/${commentId}/replies/${replyId}/subreplies`,
            subReplyData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("addSubReply error:", error);
        throw error;
    }
};

// 댓글 삭제 API 호출 함수
export const deleteComment = async (communityId, commentId) => {
    try {
        const response = await instance.delete(`/api/communities/${communityId}/comments/${commentId}`);
        return response.data;
    } catch (error) {
        console.error("deleteComment error:", error);
        throw error;
    }
};

// 대댓글 삭제 API 호출 함수
export const deleteReply = async (communityId, commentId, replyId) => {
    try {
        const response = await instance.delete(`/api/communities/${communityId}/comments/${commentId}/replies/${replyId}`);
        return response.data;
    } catch (error) {
        console.error("deleteReply error:", error);
        throw error;
    }
};

// 대대댓글 삭제 API 호출 함수
export const deleteSubReply = async (communityId, commentId, replyId, subReplyId) => {
    try {
        const response = await instance.delete(`/api/communities/${communityId}/comments/${commentId}/replies/${replyId}/subreplies/${subReplyId}`);
        return response.data;
    } catch (error) {
        console.error("deleteSubReply error:", error);
        throw error;
    }
};

//커뮤니티 최다 조회
export const fetchTopViewed = async () => {
    try {
        const response = await instance.get(`/api/communities/top-viewed`);
        return response.data;
    } catch (error) {
        console.error("fetchTopViewed error:", error);
        throw error;
    }
};

//커뮤니티 최다 댓글
export const fetchTopCommented = async () => {
    try {
        const response = await instance.get(`/api/communities/top-commented`);
        return response.data;
    } catch (error) {
        console.error("fetchTopCommented error:", error);
        throw error;
    }
};

export const createPoll = async (postId, pollData) => {
    try {
    const response = await instance.post(
        `/api/communities/${postId}/polls`, pollData);

        return response.data;
    } catch (error) {
        console.error('투표 생성 실패:', error);
        throw error;
    }
};

export const votePoll = async (postId, pollId, userId, optionIndex) => {
    try {
        const response = await instance.post(
          `/api/communities/${postId}/polls/${pollId}/vote`,
          { userId, optionIndex });
        return response.data;
    } catch (error) {
        console.error('투표 참여 실패:', error);
        throw error;
    }
};

export const getPollResults = async (postId, pollId) => {
    try {
        const response = await instance.get(
            `/api/communities/${postId}/polls/${pollId}/results`
        );
        return response.data;
    } catch (error) {
        console.error('투표 결과 조회 실패:', error);
        throw error;
    }
};

export const getUserVoteStatus = async (postId, pollId, userId) => {
    try {
        const response = await instance.get(
            `/api/communities/${postId}/polls/${pollId}/status`,
            { params: { userId } }
        );
        return response.data;
    } catch (error) {
        console.error('투표 상태 조회 실패:', error);
        throw error;
    }
};

export const cancelVote = async (communityId, pollId, userId) => {
    try {
        const response = await instance.post(
            `/api/communities/${communityId}/polls/${pollId}/cancel-vote`,
            { userId }
        );
        return response.data;
    } catch (error) {
        console.error('투표 취소 실패:', error);
        throw error;
    }
};

export const deletePoll = async (communityId, pollId, userId) => {
    try {
        const response = await instance.delete(
            `/api/communities/${communityId}/polls/${pollId}`,
            { data: { userId } }
        );
        return response.data;
    } catch (error) {
        console.error('투표 삭제 실패:', error);
        throw error;
    }
};

// 🔍 댓글 투표 생성
export const createCommentPoll = async (commentId, pollData) => {
    try {
        const response = await instance.post(
            `/api/communities/comments/${commentId}/polls`,
            pollData
        );
        return response.data;
    } catch (error) {
        console.error('댓글 투표 생성 실패:', error);
        throw error;
    }
};

// 댓글 투표 참여
export const voteCommentPoll = async (commentId, pollId, userId, optionIndex) => {
    try {
        const response = await instance.post(
            `/api/communities/comments/${commentId}/polls/${pollId}/vote`,
            { userId, optionIndex }
        );
        return response.data;
    } catch (error) {
        console.error('댓글 투표 참여 실패:', error);
        throw error;
    }
};

// 댓글 투표 결과 조회
export const getCommentPollResults = async (commentId, pollId) => {
    try {
        const response = await instance.get(
            `/api/communities/comments/${commentId}/polls/${pollId}/results`
        );
        return response.data;
    } catch (error) {
        console.error('댓글 투표 결과 조회 실패:', error);
        throw error;
    }
};

// 댓글 투표 상태 확인
export const getCommentUserVoteStatus = async (commentId, pollId, userId) => {
    try {
        const response = await instance.get(
            `/api/communities/comments/${commentId}/polls/${pollId}/status`,
            { params: { userId } }  // ✅ 쿼리 파라미터는 params 객체로
        );
        return response.data;
    } catch (error) {
        console.error('댓글 투표 상태 조회 실패:', error);
        throw error;
    }
};

// 댓글 투표 취소
export const cancelCommentVote = async (commentId, pollId, userId) => {
    try {
        const response = await instance.post(
            `/api/communities/comments/${commentId}/polls/${pollId}/cancel-vote`,
            { userId }
        );
        return response.data;
    } catch (error) {
        console.error('댓글 투표 취소 실패:', error);
        throw error;
    }
};

// 댓글 투표 삭제
export const deleteCommentPoll = async (commentId, pollId, userId) => {
    try {
        const response = await instance.delete(
            `/api/communities/comments/${commentId}/polls/${pollId}`,
            { data: { userId } }  // ✅ DELETE 메서드에서 body 전송 시 data 객체 사용
        );
        return response.data;
    } catch (error) {
        console.error('댓글 투표 삭제 실패:', error);
        throw error;
    }
};
