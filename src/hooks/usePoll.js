
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
            const newPoll = await createPoll(community._id, pollData);

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
            // 1. 서버에 투표 요청 -> 최신 투표 '수'를 결과로 받음
            const results = await votePoll(community._id, pollId, optionIndex);

            // 2. 로컬 UI 상태(선택한 항목) 즉시 업데이트
            setUserVotes(prev => ({
                ...prev,
                [pollId]: optionIndex
            }));

            // 3. 게시글 데이터(votedUsers)를 업데이트하고, 서버에서 받은 투표 수로 동기화
            setCommunity(prevCommunity => {
                const updatedPolls = prevCommunity.polls.map(p => {
                    if (p._id !== pollId) return p;

                    // votedUsers 배열 업데이트: 현재 사용자를 이전 옵션에서 제거하고 새 옵션에 추가
                    const updatedOptionsWithVotedUsers = p.options.map((opt, index) => {
                        const newVotedUsers = (opt.votedUsers || []).filter(uid => uid !== currentUserId);
                        if (index === optionIndex) {
                            newVotedUsers.push(currentUserId);
                        }
                        return { ...opt, votedUsers: newVotedUsers };
                    });

                    // 서버에서 받은 최신 투표 수로 업데이트
                    const finalOptions = updatedOptionsWithVotedUsers.map((opt, index) => ({
                        ...opt,
                        votes: results.options[index].votes,
                    }));

                    return {
                        ...p,
                        options: finalOptions,
                        totalVotes: results.totalVotes,
                    };
                });

                return { ...prevCommunity, polls: updatedPolls };
            });

        } catch (error) {
            console.error('투표 실패:', error);
            // TODO: Consider reverting optimistic UI updates on error
            throw error;
        }
    };

    // 투표 취소
    const handleCancelVote = async (pollId, setCommunity) => {
        try {
            await cancelVote(community._id, pollId);

            // 1. 로컬 UI 상태 즉시 업데이트
            const newUserVotes = { ...userVotes };
            delete newUserVotes[pollId];
            setUserVotes(newUserVotes);

            // 2. 게시글 데이터(votedUsers 와 투표 수)를 즉시 업데이트
            setCommunity(prevCommunity => {
                const updatedPolls = prevCommunity.polls.map(p => {
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

                return { ...prevCommunity, polls: updatedPolls };
            });

        } catch (error) {
            console.error('투표 취소 실패:', error);
            throw error;
        }
    };

    // 투표 삭제
    const handleDeletePoll = async (pollId, setCommunity) => {
        try {
            await deletePoll(community._id, pollId);

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
