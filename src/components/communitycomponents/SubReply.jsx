// src/components/communitycomponents/SubReply.jsx
import ProfileButton from '../MyPageComponent/ProfileButton.jsx';

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
                                profile={{ _id: subReply.userId }}
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
                                subReply.userId === community.userId ? 'text-blue-600' : ''
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
                        {subReply.userId === currentUserId || isAdmin ? (
                            <button
                                onClick={() => openSubReplyDeleteModal(community._id, commentId, replyId, subReply._id)}
                                className="text-gray-400 hover:text-red-500 text-xs transition-colors p-1"
                            >
                                삭제
                            </button>
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
                    <p className="text-gray-800 break-words whitespace-pre-wrap text-sm md:text-base leading-relaxed" id={`subReply-${subReply._id}`}>
                        {subReply.commentContents}
                    </p>

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
