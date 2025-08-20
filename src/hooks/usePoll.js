
import { useState, useEffect } from 'react';
import {
    createPoll,
    votePoll,
    cancelVote,
    deletePoll,
    getUserVoteStatus,
    getPollResults
} from '../api/communityAPI.js';

export const usePoll = (community, currentUserId, isAdmin) => {
    const [userVotes, setUserVotes] = useState({});
    const [showPollModal, setShowPollModal] = useState(false);

    // 투표 데이터 로딩
    useEffect(() => {
        const loadPollData = async () => {
            if (!community?.polls || !currentUserId) return;

            const pollVotes = {};
            await Promise.all(
                community.polls.map(async (poll) => {
                    try {
                        const status = await getUserVoteStatus(community._id, poll._id, currentUserId);
                        if (status.hasVoted) {
                            pollVotes[poll._id] = status.votedOption;
                        }
                    } catch (error) {
                        console.error(`투표 상태 로딩 실패 (${poll._id}):`, error);
                    }
                })
            );
            setUserVotes(pollVotes);
        };

        loadPollData();
    }, [community, currentUserId]);

    // 투표 생성
    const handleCreatePoll = async (pollData, setCommunity) => {
        try {
            const newPoll = await createPoll(community._id, {
                ...pollData,
                userId: currentUserId
            });

            setCommunity(prevCommunity => ({
                ...prevCommunity,
                polls: [...(prevCommunity.polls || []), newPoll]
            }));

            setShowPollModal(false);
        } catch (error) {
            console.error('투표 생성 실패:', error);
            throw error;
        }
    };

    // 투표 결과 새로고침
    const handleRefreshPollResults = async (pollId, setCommunity) => {
        try {
            const results = await getPollResults(community._id, pollId);

            setCommunity(prevCommunity => ({
                ...prevCommunity,
                polls: prevCommunity.polls.map(poll =>
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
            }));
        } catch (error) {
            console.error('투표 결과 새로고침 실패:', error);
        }
    };

    // 투표하기
    const handleVote = async (pollId, optionIndex, setCommunity) => {
        try {
            const updatedPoll = await votePoll(community._id, pollId, currentUserId, optionIndex);

            setCommunity(prevCommunity => ({
                ...prevCommunity,
                polls: prevCommunity.polls.map(poll =>
                    poll._id === pollId ? updatedPoll : poll
                )
            }));

            setUserVotes(prev => ({
                ...prev,
                [pollId]: optionIndex
            }));

            await handleRefreshPollResults(pollId, setCommunity);
        } catch (error) {
            console.error('투표 실패:', error);
            throw error;
        }
    };

    // 투표 취소
    const handleCancelVote = async (pollId, setCommunity) => {
        try {
            await cancelVote(community._id, pollId, currentUserId);

            const newUserVotes = { ...userVotes };
            delete newUserVotes[pollId];
            setUserVotes(newUserVotes);

            await handleRefreshPollResults(pollId, setCommunity);
        } catch (error) {
            console.error('투표 취소 실패:', error);
            throw error;
        }
    };

    // 투표 삭제
    const handleDeletePoll = async (pollId, setCommunity) => {
        try {
            await deletePoll(community._id, pollId, currentUserId);

            setCommunity(prevCommunity => ({
                ...prevCommunity,
                polls: prevCommunity.polls.filter(poll => poll._id !== pollId)
            }));

            const newUserVotes = { ...userVotes };
            delete newUserVotes[pollId];
            setUserVotes(newUserVotes);
        } catch (error) {
            console.error('투표 삭제 실패:', error);
        }
    };

    // 투표 삭제 권한 확인
    const canDeletePoll = (poll) => {
        if (!currentUserId) return false;
        if (isAdmin) return true;
        if (community?.userId === currentUserId) return true;
        if (poll?.createdBy === currentUserId) return true;
        return false;
    };

    return {
        userVotes,
        showPollModal,
        setShowPollModal,
        handleCreatePoll,
        handleVote,
        handleCancelVote,
        handleDeletePoll,
        handleRefreshPollResults,
        canDeletePoll
    };
};
