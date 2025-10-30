// src/hooks/useCommentPoll.js
import { useState, useEffect } from 'react';
import {
    createCommentPoll,
    voteCommentPoll,
    cancelCommentVote,
    deleteCommentPoll,
    getCommentUserVoteStatus,
    getCommentPollResults
} from '../api/communityApi.js';

export const useCommentPoll = (community, comment, setComments, currentUserId, isAdmin) => {
    const [commentUserVotes, setCommentUserVotes] = useState({});
    const [showCommentPollModal, setShowCommentPollModal] = useState({});

    // 댓글 투표 데이터 로딩
    useEffect(() => {
        const loadCommentPollData = async () => {
            if (!comment?.polls || !currentUserId) return;

            const pollVotes = {};

            await Promise.all(
                comment.polls.map(async (poll) => {
                    try {
                                                            const status = await getCommentUserVoteStatus(
                                                                comment._id,
                                                                poll._id,
                                                                currentUserId
                                                            );                        if (status.hasVoted) {
                            pollVotes[`${comment._id}-${poll._id}`] = status.votedOption;
                        }
                    } catch (error) {
                        console.error(`댓글 투표 상태 로딩 실패:`, error);
                    }
                })
            );

            setCommentUserVotes(pollVotes);
        };

        loadCommentPollData();
    }, [comment, currentUserId, community]);

    // 댓글 투표 생성
    const handleCreateCommentPoll = async (pollData) => {
        try {
            const newPoll = await createCommentPoll(comment._id, {
                ...pollData,
                userId: currentUserId
            });

            setComments(prevComments =>
                prevComments.map(c =>
                    c._id === comment._id
                        ? {
                            ...c,
                            polls: [...(c.polls || []), newPoll]
                        }
                        : c
                )
            );

            setShowCommentPollModal(prev => ({
                ...prev,
                [comment._id]: false
            }));
        } catch (error) {
            console.error('댓글 투표 생성 실패:', error);
            throw error;
        }
    };


    // 댓글 투표 참여
    const handleCommentVote = async (pollId, optionIndex) => {
        try {
            const updatedPoll = await voteCommentPoll(
                comment._id,
                pollId,
                currentUserId,
                optionIndex
            );

            setComments(prevComments =>
                prevComments.map(c =>
                    c._id === comment._id
                        ? {
                            ...c,
                            polls: c.polls.map(poll =>
                                poll._id === pollId ? updatedPoll : poll
                            )
                        }
                        : c
                )
            );

            setCommentUserVotes(prev => ({
                ...prev,
                [`${comment._id}-${pollId}`]: optionIndex
            }));

            await handleRefreshCommentPollResults(pollId);
        } catch (error) {
            console.error('댓글 투표 실패:', error);
            throw error;
        }
    };

    // 댓글 투표 취소
    const handleCancelCommentVote = async (pollId) => {
        try {
            await cancelCommentVote(comment._id, pollId, currentUserId);

            const newVotes = { ...commentUserVotes };
            delete newVotes[`${comment._id}-${pollId}`];
            setCommentUserVotes(newVotes);

            await handleRefreshCommentPollResults(pollId);
        } catch (error) {
            console.error('댓글 투표 취소 실패:', error);
            throw error;
        }
    };

    // 댓글 투표 삭제
    const handleDeleteCommentPoll = async (pollId) => {
        try {
            await deleteCommentPoll(comment._id, pollId, currentUserId);

            setComments(prevComments =>
                prevComments.map(c =>
                    c._id === comment._id
                        ? {
                            ...c,
                            polls: c.polls.filter(poll => poll._id !== pollId)
                        }
                        : c
                )
            );

            const newVotes = { ...commentUserVotes };
            delete newVotes[`${comment._id}-${pollId}`];
            setCommentUserVotes(newVotes);
        } catch (error) {
            console.error('댓글 투표 삭제 실패:', error);
        }
    };

    // 댓글 투표 결과 새로고침
    const handleRefreshCommentPollResults = async (pollId) => {
        try {
            const results = await getCommentPollResults(comment._id, pollId);

            setComments(prevComments =>
                prevComments.map(c =>
                    c._id === comment._id
                        ? {
                            ...c,
                            polls: c.polls.map(poll =>
                                poll._id === pollId
                                    ? {
                                        ...poll,
                                        options: results.options.map((resultOption, index) => ({
                                            ...poll.options[index],
                                            votes: resultOption.votes
                                        })),
                                        totalVotes: results.totalVotes
                                    }
                                    : poll
                            )
                        }
                        : c
                )
            );
        } catch (error) {
            console.error('댓글 투표 결과 새로고침 실패:', error);
        }
    };

    // 댓글 투표 삭제 권한 확인
    const canDeleteCommentPoll = (comment, poll) => {
        if (!currentUserId) return false;
        if (isAdmin) return true;
        if (comment.userId === currentUserId) return true;
        if (poll?.createdBy === currentUserId) return true;
        return false;
    };

    return {
        commentUserVotes,
        showCommentPollModal,
        setShowCommentPollModal,
        handleCreateCommentPoll,
        handleCommentVote,
        handleCancelCommentVote,
        handleDeleteCommentPoll,
        handleRefreshCommentPollResults,
        canDeleteCommentPoll
    };
};
