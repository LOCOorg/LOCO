
import { useState, useEffect } from 'react';
import {
    createPoll,
    votePoll,
    cancelVote,
    deletePoll,
} from '../api/communityAPI.js';

export const usePoll = (community, currentUserId, isAdmin) => {
    const [userVotes, setUserVotes] = useState({});
    const [showPollModal, setShowPollModal] = useState(false);

    // 투표 데이터 로딩 (클라이언트에서 직접 계산)
    useEffect(() => {
        if (!community?.polls || !currentUserId) return;

        const pollVotes = {};
        community.polls.forEach(poll => {
            const votedOptionIndex = poll.options.findIndex(option =>
                (option.votedUsers || []).includes(currentUserId)
            );
            if (votedOptionIndex >= 0) {
                pollVotes[poll._id] = votedOptionIndex;
            }
        });
        setUserVotes(pollVotes);
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

    // 투표하기
    const handleVote = async (pollId, optionIndex, setCommunity) => {
        try {
            const results = await votePoll(community._id, pollId, currentUserId, optionIndex);

            setCommunity(prevCommunity => ({
                ...prevCommunity,
                polls: prevCommunity.polls.map(poll =>
                    poll._id === pollId
                        ? {
                            ...poll,
                            options: poll.options.map((option, index) => ({
                                ...option,
                                votes: results.options[index].votes,
                            })),
                            totalVotes: results.totalVotes,
                        }
                        : poll
                )
            }));

            setUserVotes(prev => ({
                ...prev,
                [pollId]: optionIndex
            }));

        } catch (error) {
            console.error('투표 실패:', error);
            throw error;
        }
    };

    // 투표 취소
    const handleCancelVote = async (pollId, setCommunity) => {
        try {
            const results = await cancelVote(community._id, pollId, currentUserId); // Now returns results

            const newUserVotes = { ...userVotes };
            delete newUserVotes[pollId];
            setUserVotes(newUserVotes);

            setCommunity(prevCommunity => ({
                ...prevCommunity,
                polls: prevCommunity.polls.map(poll =>
                    poll._id === pollId
                        ? {
                            ...poll,
                            options: poll.options.map((option, index) => ({
                                ...option,
                                votes: results.options[index].votes,
                            })),
                            totalVotes: results.totalVotes,
                        }
                        : poll
                )
            }));

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
        canDeletePoll
    };
};
