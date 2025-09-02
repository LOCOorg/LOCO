// src/components/communitycomponents/PollManager.jsx
import { FaPoll } from 'react-icons/fa';
import PollComponent from './PollComponent.jsx';
import CreatePollModal from './CreatePollModal.jsx';
import { usePoll } from '../../hooks/usePoll.js';

const PollManager = ({
                         community,
                         setCommunity,
                         currentUserId,
                         isAdmin
                     }) => {
    const {
        userVotes,
        showPollModal,
        setShowPollModal,
        handleCreatePoll,
        handleVote,
        handleCancelVote,
        handleDeletePoll,
        handleRefreshPollResults,
        canDeletePoll
    } = usePoll(community, currentUserId, isAdmin);

    // 투표 생성 권한 확인 (게시글 작성자나 관리자만)
    const canCreatePoll = () => {
        return currentUserId && (
            community?.userId === currentUserId
        );
    };

    // 이미 투표가 있는지 확인 (핵심 추가!)
    const hasExistingPoll = () => {
        return community?.polls && community.polls.length > 0;
    };

    return (
        <div className="poll-manager">
            {/* 기존 투표들 표시 */}
            {community?.polls && community.polls.map(poll => (
                <PollComponent
                    key={poll._id}
                    poll={poll}
                    onVote={(optionIndex) => handleVote(poll._id, optionIndex, setCommunity)}
                    currentUserId={currentUserId}
                    hasVoted={userVotes[poll._id] !== undefined}
                    userVote={userVotes[poll._id]}
                    communityId={community._id}
                    onRefreshResults={(pollId) => handleRefreshPollResults(pollId, setCommunity)}
                    onCancelVote={() => handleCancelVote(poll._id, setCommunity)}
                    onDeletePoll={() => handleDeletePoll(poll._id, setCommunity)}
                    canDeletePoll={canDeletePoll(poll)}
                />
            ))}

            {/* 투표 생성 버튼 - 이미 투표가 있으면 숨김 */}
            {canCreatePoll() && !hasExistingPoll() && (
                <div className="flex justify-start mt-3">
                    <button
                        onClick={() => setShowPollModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-md transition-colors"
                    >
                        <FaPoll size={14} />
                        <span>투표 만들기</span>
                    </button>
                </div>
            )}

            {/* 투표 생성 모달 */}
            <CreatePollModal
                isOpen={showPollModal}
                onClose={() => setShowPollModal(false)}
                onCreatePoll={(pollData) => handleCreatePoll(pollData, setCommunity)}
            />
        </div>
    );
};

export default PollManager;
