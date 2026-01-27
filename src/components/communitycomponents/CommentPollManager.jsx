// src/components/communitycomponents/CommentPollManager.jsx
import { FaPoll } from 'react-icons/fa';
import PollComponent from './PollComponent.jsx';
import CreatePollModal from './CreatePollModal.jsx';
import { useCommentPoll } from '../../hooks/useCommentPoll.js';

const CommentPollManager = ({
                                comment,
                                community,
                                currentUserId,
                                isAdmin
                            }) => {
    const {
        commentUserVotes,
        showCommentPollModal,
        setShowCommentPollModal,
        handleCreateCommentPoll,
        handleCommentVote,
        handleCancelCommentVote,
        handleDeleteCommentPoll,
        handleRefreshCommentPollResults,
        canDeleteCommentPoll
    } = useCommentPoll(community, comment, currentUserId, isAdmin);

    // 댓글 투표 생성 권한 확인
    const canCreateCommentPoll = () => {
        return currentUserId && (
            comment.userId === currentUserId
        );
    };

    // 댓글에 이미 투표가 있는지 확인 (핵심 추가!)
    const hasExistingPoll = () => {
        return comment?.polls && comment.polls.length > 0;
    };

    return (
        <div className="comment-poll-manager mt-3">
            {/* 기존 댓글 투표들 표시 */}
            {comment?.polls && comment.polls.map(poll => (
                <PollComponent
                    key={poll._id}
                    poll={poll}
                    communityId={community._id}
                    commentId={comment._id}  // 댓글 ID 전달 (중요!)
                    currentUserId={currentUserId}
                    hasVoted={commentUserVotes[`${comment._id}-${poll._id}`] !== undefined}
                    userVote={commentUserVotes[`${comment._id}-${poll._id}`]}
                    onVote={(optionIndex) => handleCommentVote(poll._id, optionIndex)}
                    onRefreshResults={() => handleRefreshCommentPollResults(poll._id)}
                    onCancelVote={() => handleCancelCommentVote(poll._id)}
                    onDeletePoll={() => handleDeleteCommentPoll(poll._id)}
                    canDeletePoll={canDeleteCommentPoll(comment, poll)}
                />
            ))}

            {/* 댓글 투표 생성 버튼 - 이미 투표가 있으면 숨김 */}
            {canCreateCommentPoll() && !hasExistingPoll() && (
                <div className="flex justify-start mt-2">
                    <button
                        onClick={() => setShowCommentPollModal(prev => ({
                            ...prev,
                            [comment._id]: true
                        }))}
                        className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-md transition-colors"
                    >
                        <FaPoll size={12} />
                        <span>투표 만들기</span>
                    </button>
                </div>
            )}

            {/* 댓글 투표 생성 모달 */}
            <CreatePollModal
                isOpen={showCommentPollModal[comment._id] || false}
                onClose={() => setShowCommentPollModal(prev => ({
                    ...prev,
                    [comment._id]: false
                }))}
                onCreatePoll={(pollData) => handleCreateCommentPoll(pollData)}
            />
        </div>
    );
};

export default CommentPollManager;
