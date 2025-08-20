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

export const useCommentPoll = (community, currentUserId, isAdmin) => {
    const [commentUserVotes, setCommentUserVotes] = useState({});
    const [showCommentPollModal, setShowCommentPollModal] = useState({});

    // 댓글 투표 데이터 로딩
    useEffect(() => {
        const loadCommentPollData = async () => {
            if (!community?.comments || !currentUserId) return;

            const pollVotes = {};

            await Promise.all(
                community.comments.map(async (comment) => {
                    if (comment.polls && comment.polls.length > 0) {
                        await Promise.all(
                            comment.polls.map(async (poll) => {
                                try {
                                    const status = await getCommentUserVoteStatus(
                                        community._id,
                                        comment._id,
                                        poll._id,
                                        currentUserId
                                    );
                                    if (status.hasVoted) {
                                        pollVotes[`${comment._id}-${poll._id}`] = status.votedOption;
                                    }
                                } catch (error) {
                                    console.error(`댓글 투표 상태 로딩 실패:`, error);
                                }
                            })
                        );
                    }
                })
            );

            setCommentUserVotes(pollVotes);
        };

        loadCommentPollData();
    }, [community, currentUserId]);

    // 댓글 투표 생성
    const handleCreateCommentPoll = async (commentId, pollData, setCommunity) => {
        try {
            const newPoll = await createCommentPoll(community._id, commentId, {
                ...pollData,
                userId: currentUserId
            });

            setCommunity(prevCommunity => ({
                ...prevCommunity,
                comments: prevCommunity.comments.map(comment =>
                    comment._id === commentId
                        ? {
                            ...comment,
                            polls: [...(comment.polls || []), newPoll]
                        }
                        : comment
                )
            }));

            setShowCommentPollModal(prev => ({
                ...prev,
                [commentId]: false
            }));
        } catch (error) {
            console.error('댓글 투표 생성 실패:', error);
            throw error;
        }
    };

    // 댓글 투표 참여
    const handleCommentVote = async (commentId, pollId, optionIndex, setCommunity) => {
        try {
            const updatedPoll = await voteCommentPoll(
                community._id,
                commentId,
                pollId,
                currentUserId,
                optionIndex
            );

            setCommunity(prevCommunity => ({
                ...prevCommunity,
                comments: prevCommunity.comments.map(comment =>
                    comment._id === commentId
                        ? {
                            ...comment,
                            polls: comment.polls.map(poll =>
                                poll._id === pollId ? updatedPoll : poll
                            )
                        }
                        : comment
                )
            }));

            setCommentUserVotes(prev => ({
                ...prev,
                [`${commentId}-${pollId}`]: optionIndex
            }));

            await handleRefreshCommentPollResults(commentId, pollId, setCommunity);
        } catch (error) {
            console.error('댓글 투표 실패:', error);
            throw error;
        }
    };

    // 댓글 투표 취소
    const handleCancelCommentVote = async (commentId, pollId, setCommunity) => {
        try {
            await cancelCommentVote(community._id, commentId, pollId, currentUserId);

            const newVotes = { ...commentUserVotes };
            delete newVotes[`${commentId}-${pollId}`];
            setCommentUserVotes(newVotes);

            await handleRefreshCommentPollResults(commentId, pollId, setCommunity);
        } catch (error) {
            console.error('댓글 투표 취소 실패:', error);
            throw error;
        }
    };

    // 댓글 투표 삭제
    const handleDeleteCommentPoll = async (commentId, pollId, setCommunity) => {
        try {
            await deleteCommentPoll(community._id, commentId, pollId, currentUserId);

            setCommunity(prevCommunity => ({
                ...prevCommunity,
                comments: prevCommunity.comments.map(comment =>
                    comment._id === commentId
                        ? {
                            ...comment,
                            polls: comment.polls.filter(poll => poll._id !== pollId)
                        }
                        : comment
                )
            }));

            const newVotes = { ...commentUserVotes };
            delete newVotes[`${commentId}-${pollId}`];
            setCommentUserVotes(newVotes);
        } catch (error) {
            console.error('댓글 투표 삭제 실패:', error);
        }
    };

    // 댓글 투표 결과 새로고침
    const handleRefreshCommentPollResults = async (commentId, pollId, setCommunity) => {
        try {
            const results = await getCommentPollResults(community._id, commentId, pollId);

            setCommunity(prevCommunity => ({
                ...prevCommunity,
                comments: prevCommunity.comments.map(comment =>
                    comment._id === commentId
                        ? {
                            ...comment,
                            polls: comment.polls.map(poll =>
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
                        : comment
                )
            }));
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
