// src/api/communityApi.js
import axios from 'axios';

const host = `${import.meta.env.VITE_API_HOST}/api/communities`;

export const fetchCommunities = async () => {
    try {
        const response = await axios.get(host);
        return response.data;
    } catch (error) {
        console.error("fetchCommunities error:", error);
        throw error;
    }
};

export const fetchCommunityById = async (id) => {
    try {
        const response = await axios.get(`${host}/${id}`);
        return response.data;
    } catch (error) {
        console.error("fetchCommunityById error:", error);
        throw error;
    }
};

export const createCommunity = async (communityData) => {
    try {
        const response = await axios.post(host, communityData, {
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
        const response = await axios.put(`${host}/${id}`, updateData, {
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

export const deleteCommunity = async (id) => {
    try {
        const response = await axios.delete(`${host}/${id}`);
        return response.data;
    } catch (error) {
        console.error("deleteCommunity error:", error);
        throw error;
    }
};

export const recommendCommunity = async (id, userId) => {
    try {
        const response = await axios.post(`${host}/${id}/recommend`, { userId });
        return response.data;
    } catch (error) {
        console.error("recommendCommunity error:", error);
        throw error;
    }
};

// 댓글 추가 API 호출 함수
export const addComment = async (communityId, commentData) => {
    try {
        const response = await axios.post(`${host}/${communityId}/comments`, commentData, {
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
        const response = await axios.post(
            `${host}/${communityId}/comments/${commentId}/replies`,
            replyData
        );
        return response.data;
    } catch (error) {
        console.error("addReply error:", error);
        throw error;
    }
};

export const addSubReply = async (communityId, commentId, replyId, subReplyData) => {
    try {
        const response = await axios.post(
            `${host}/${communityId}/comments/${commentId}/replies/${replyId}/subreplies`,
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
        const response = await axios.delete(`${host}/${communityId}/comments/${commentId}`);
        return response.data;
    } catch (error) {
        console.error("deleteComment error:", error);
        throw error;
    }
};

// 대댓글 삭제 API 호출 함수
export const deleteReply = async (communityId, commentId, replyId) => {
    try {
        const response = await axios.delete(`${host}/${communityId}/comments/${commentId}/replies/${replyId}`);
        return response.data;
    } catch (error) {
        console.error("deleteReply error:", error);
        throw error;
    }
};

// 대대댓글 삭제 API 호출 함수
export const deleteSubReply = async (communityId, commentId, replyId, subReplyId) => {
    try {
        const response = await axios.delete(`${host}/${communityId}/comments/${commentId}/replies/${replyId}/subreplies/${subReplyId}`);
        return response.data;
    } catch (error) {
        console.error("deleteSubReply error:", error);
        throw error;
    }
};
