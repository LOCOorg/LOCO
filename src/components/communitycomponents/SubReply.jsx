// src/components/communitycomponents/SubReply.jsx
import { useState } from 'react';
import ProfileButton from '../MyPageComponent/ProfileButton.jsx';
import { useUpdateSubReply } from '../../hooks/queries/useCommunityQueries';

const SubReply = ({
                      subReply,
                      postId,
                      replyId,
                      commentId,
                      community,
                      currentUserId,
                      isAdmin,
                      getDisplayNickname,
                      formatRelativeTime,
                      openSubReplyDeleteModal,
                      handleSubReplyReport,
                      API_HOST
                  }) => {
    // 수정 관련 상태
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(subReply.commentContents);
    const updateSubReplyMutation = useUpdateSubReply();

    const handleUpdate = () => {
        if (!editValue.trim()) return;
        updateSubReplyMutation.mutate({
            postId: community._id,
            subReplyId: subReply._id,
            updateData: { commentContents: editValue }
        }, {
            onSuccess: () => setIsEditing(false)
        });
    };

    if (subReply.isDeleted) {
        return null;
    }

    return (
        <li className="list-none mb-1">
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 sm:p-4 hover:bg-gray-100 transition-colors duration-200">
                {/* 헤더: 프로필 + 정보 + 액션버튼 */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* 프로필 버튼 */}
                        {!subReply.isAnonymous ? (
                            <ProfileButton
                                profile={{ _id: typeof subReply.userId === 'object' ? subReply.userId._id : subReply.userId }}
                                area="프로필"
                                size="w-8 h-8 sm:w-10 sm:h-10"
                            />
                        ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">
                                익명
                            </div>
                        )}

                        <div className="flex flex-col">
                            <span className={`text-sm font-bold text-gray-900 ${
                                (typeof subReply.userId === 'object' ? subReply.userId._id : subReply.userId) === (typeof community.userId === 'object' ? community.userId._id : community.userId) ? 'text-blue-600' : ''
                            }`}>
                                {getDisplayNickname(subReply)}
                            </span>
                            <span className="text-xs text-gray-500">
                                {formatRelativeTime(subReply.createdAt)}
                            </span>
                        </div>
                    </div>

                    {/* 액션 버튼들 */}
                    <div className="flex items-center gap-2">
                        {(typeof subReply.userId === 'object' ? subReply.userId._id : subReply.userId) === currentUserId || isAdmin ? (
                            <>
                                {(typeof subReply.userId === 'object' ? subReply.userId._id : subReply.userId) === currentUserId && (
                                    <button
                                        onClick={() => setIsEditing(!isEditing)}
                                        className="text-gray-400 hover:text-blue-500 text-xs transition-colors p-1"
                                    >
                                        {isEditing ? '취소' : '수정'}
                                    </button>
                                )}
                                <button
                                    onClick={() => openSubReplyDeleteModal(community._id, commentId, replyId, subReply._id)}
                                    className="text-gray-400 hover:text-red-500 text-xs transition-colors p-1"
                                >
                                    삭제
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => handleSubReplyReport(subReply, postId)}
                                className="text-gray-400 hover:text-red-500 text-xs transition-colors p-1"
                            >
                                신고
                            </button>
                        )}
                    </div>
                </div>

                {/* 대대댓글 내용 */}
                <div className="pl-1 sm:pl-0">
                    {isEditing ? (
                        <div className="mt-2 space-y-2">
                            <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg resize-none text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                rows="3"
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={handleUpdate}
                                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                                >
                                    수정완료
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-800 break-words whitespace-pre-wrap text-sm md:text-base leading-relaxed" id={`subReply-${subReply._id}`}>
                            {subReply.commentContents}
                        </p>
                    )}

                    {/* 대대댓글 이미지 */}
                    {subReply.subReplyImage && (
                        <div className="mt-3">
                            <img
                                src={
                                    subReply.subReplyImage.startsWith('http') ||
                                    subReply.subReplyImage.startsWith('data:')
                                        ? subReply.subReplyImage
                                        : `${API_HOST}/uploads${subReply.subReplyImage}`
                                }
                                alt="답글 이미지"
                                className="w-full max-w-sm h-auto rounded-lg border border-gray-200"
                            />
                        </div>
                    )}
                </div>
            </div>
        </li>
    );
};

export default SubReply;
