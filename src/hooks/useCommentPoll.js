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
        if (!comment?.polls || !currentUserId) {
            setCommentUserVotes({}); // Clear votes if no polls or user
            return;
        }

        const pollVotes = {};
        comment.polls.forEach(poll => {
            const votedOptionIndex = poll.options.findIndex(option =>
                (option.votedUsers || []).includes(currentUserId)
            );
            if (votedOptionIndex >= 0) {
                pollVotes[`${comment._id}-${poll._id}`] = votedOptionIndex;
            }
        });
        setCommentUserVotes(pollVotes);
    }, [comment, currentUserId]);

    // 댓글 투표 생성
    const handleCreateCommentPoll = async (pollData) => {
        try {
            const newPoll = await createCommentPoll(comment._id, pollData);

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
            await cancelCommentVote(comment._id, pollId);

            // 1. 로컬 UI 상태 즉시 업데이트
            const newVotes = { ...commentUserVotes };
            delete newVotes[`${comment._id}-${pollId}`];
            setCommentUserVotes(newVotes);

            // 2. 댓글 데이터(votedUsers 와 투표 수)를 즉시 업데이트
            setComments(prevComments =>
                prevComments.map(c => {
                    if (c._id !== comment._id) return c;

                    const updatedPolls = c.polls.map(p => {
                        if (p._id !== pollId) return p;

                        let userVoteIndex = -1;
                        const updatedOptions = p.options.map((opt, index) => {
                            const originalVotedUsers = opt.votedUsers || [];
                            if (originalVotedUsers.includes(currentUserId)) {
                                userVoteIndex = index;
                            }
                            return {
                                ...opt,
                                votedUsers: originalVotedUsers.filter(uid => uid !== currentUserId)
                            };
                        });

                        if (userVoteIndex > -1) {
                            updatedOptions[userVoteIndex].votes = Math.max(0, updatedOptions[userVoteIndex].votes - 1);
                        }

                        const newTotalVotes = updatedOptions.reduce((sum, opt) => sum + opt.votes, 0);

                        return { ...p, options: updatedOptions, totalVotes: newTotalVotes };
                    });

                    return { ...c, polls: updatedPolls };
                })
            );

        } catch (error) {
            console.error('댓글 투표 취소 실패:', error);
            throw error;
        }
    };

    // 댓글 투표 삭제
    const handleDeleteCommentPoll = async (pollId) => {
        try {
            await deleteCommentPoll(comment._id, pollId);

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
