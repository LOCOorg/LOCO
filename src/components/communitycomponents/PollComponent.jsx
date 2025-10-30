// PollComponent.jsx 수정
import { useState, useEffect } from 'react';
import {FaCheck, FaClock, FaTimes, FaTrash} from 'react-icons/fa';
import clsx from 'clsx';
import CommonModal from "../../common/CommonModal.jsx";

const PollComponent = ({
                           poll,
                           onVote,
                           currentUserId,
                           hasVoted,
                           userVote,
                           onCancelVote, // 투표 취소 함수 추가
                           onDeletePoll, // 투표 삭제 함수 추가
                           canDeletePoll = false, // 삭제 권한 여부
                       }) => {
    const [selectedOption, setSelectedOption] = useState(userVote);
    const [isVoting, setIsVoting] = useState(false);
    const [isExpired, setIsExpired] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);     // 삭제 모달

    // 투표 만료 확인
    useEffect(() => {
        const checkExpiry = () => {
            if (poll.expiresAt) {
                setIsExpired(new Date() > new Date(poll.expiresAt));
            }
        };

        checkExpiry();
        const interval = setInterval(checkExpiry, 60000);
        return () => clearInterval(interval);
    }, [poll.expiresAt]);

    // 투표 삭제 모달 열기
    const handleDeletePoll = () => {
        setIsDeleteModalOpen(true);
    };

    // 투표 삭제 확인
    const confirmDeletePoll = async () => {
        try {
            if (onDeletePoll) {
                await onDeletePoll();
            }
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error('투표 삭제 실패:', error);
            alert('투표 삭제에 실패했습니다.');
            setIsDeleteModalOpen(false);
        }
    };

    // 투표 삭제 취소
    const cancelDeletePoll = () => {
        setIsDeleteModalOpen(false);
    };

    const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);

    const handleVote = async (optionIndex) => {
        if (isVoting || !currentUserId || isExpired) return;

        setIsVoting(true);
        const previousSelection = selectedOption;
        setSelectedOption(optionIndex);

        try {
            await onVote(optionIndex);

        } catch (error) {
            setSelectedOption(previousSelection);
            console.error('투표 실패:', error);
        } finally {
            setIsVoting(false);
        }
    };

    // 투표 취소 함수 (댓글/게시글 구분)
    const handleCancelVote = async () => {
        if (isVoting || !currentUserId || isExpired || !hasVoted) return;

        setIsVoting(true);

        try {
            // 상위 컴포넌트에서 적절한 API 호출하도록 위임
            if (onCancelVote) {
                await onCancelVote();
            }

            setSelectedOption(null);

        } catch (error) {
            console.error('투표 취소 실패:', error);
        } finally {
            setIsVoting(false);
        }
    };

    const getPercentage = (votes) => {
        if (totalVotes === 0) return 0;
        return Math.round((votes / totalVotes) * 100);
    };

    const getOptionVotes = (index) => {
        return poll.options[index]?.votes ?? 0;
    };

    // 투표 만료되지 않으면 항상 투표 가능
    const canVote = !isExpired && currentUserId;
    const timeLeft = poll.expiresAt ? new Date(poll.expiresAt) - new Date() : null;
    const hoursLeft = timeLeft > 0 ? Math.floor(timeLeft / (1000 * 60 * 60)) : 0;

    return (
        <>
        <div className="bg-gray-50 rounded-xl p-4 my-4 border border-gray-200">
            {/* 투표 질문 및 상태 */}
            <div className="mb-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">{poll.question}</h3>
                    <div className="flex items-center space-x-2">
                        {isExpired && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                마감됨
              </span>
                        )}
                        {hasVoted && !isExpired && (
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                투표함
              </span>
                        )}
                        {/* 투표 삭제 버튼 */}
                        {canDeletePoll && (
                            <button
                                onClick={handleDeletePoll}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                title="투표 삭제"
                            >
                                <FaTrash size={12} />
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-gray-500">
                        {totalVotes}명이 투표했습니다
                    </p>
                    {!isExpired && hoursLeft > 0 && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <FaClock />
                            <span>{hoursLeft}시간 남음</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 투표 옵션들 */}
            <div className="space-y-3">
                {poll.options.map((option, index) => {
                    const votes = getOptionVotes(index);
                    const percentage = getPercentage(votes);
                    const isSelected = selectedOption === index;
                    const isUserChoice = hasVoted && userVote === index;

                    return (
                        <div
                            key={index}
                            className={clsx(
                                "relative overflow-hidden rounded-lg border-2 transition-all duration-200",
                                canVote && "cursor-pointer hover:border-gray-300",
                                isSelected || isUserChoice
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 bg-white",
                                !canVote && "cursor-default"
                            )}
                            onClick={() => canVote && handleVote(index)}
                        >
                            {/* 투표 결과 배경 바 */}
                            {totalVotes > 0 && (
                                <div
                                    className={clsx(
                                        "absolute inset-0 transition-all duration-500 ease-out",
                                        isSelected || isUserChoice ? "bg-blue-100" : "bg-gray-100"
                                    )}
                                    style={{ width: `${percentage}%` }}
                                />
                            )}

                            <div className="relative p-3 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    {/* 선택 표시 아이콘 */}
                                    {(isSelected || isUserChoice) && (
                                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                            <FaCheck className="w-3 h-3 text-white" />
                                        </div>
                                    )}

                                    <span className={clsx(
                                        "font-medium",
                                        (isSelected || isUserChoice) ? "text-blue-700" : "text-gray-700"
                                    )}>
                    {option.text}
                  </span>
                                </div>

                                {/* 투표 결과 표시 */}
                                {totalVotes > 0 && (
                                    <div className="flex items-center space-x-2">
                    <span className={clsx(
                        "text-sm font-semibold",
                        (isSelected || isUserChoice) ? "text-blue-700" : "text-gray-600"
                    )}>
                      {percentage}%
                    </span>
                                        <span className="text-xs text-gray-500">
                      ({votes})
                    </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 투표 관리 버튼들 */}
            {canVote && (
                <div className="mt-4 flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                        {hasVoted ? "다른 선택지를 클릭하여 투표를 변경할 수 있습니다" : "선택지를 클릭하여 투표하세요"}
                    </div>

                    {hasVoted && (
                        <button
                            onClick={handleCancelVote}
                            disabled={isVoting}
                            className="flex items-center space-x-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded"
                        >
                            <FaTimes size={10} />
                            <span>투표 취소</span>
                        </button>
                    )}
                </div>
            )}

            {/* 로딩 상태 */}
            {isVoting && (
                <div className="text-center mt-3 text-sm text-gray-500">
                    {hasVoted ? "투표 변경 중..." : "투표 중..."}
                </div>
            )}
        </div>
    {/* 투표 삭제 확인 모달 */}
    <CommonModal
        isOpen={isDeleteModalOpen}
        title="투표 삭제 확인"
        onConfirm={confirmDeletePoll}
        onClose={cancelDeletePoll}
        showCancel={true}
        > 투표를 삭제 하시겠습니까? </CommonModal>
</>
    );
};

export default PollComponent;
