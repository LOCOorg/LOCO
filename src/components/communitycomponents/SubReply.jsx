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
        <li className="flex space-x-2 p-2 bg-gray-50 rounded">
            {/* 프로필 버튼 */}
            {!subReply.isAnonymous ? (
                <ProfileButton
                    profile={{ _id: subReply.userId }}
                    area="프로필"
                />
            ) : (
                <div className="w-5 h-5 bg-gray-300 rounded-full flex-shrink-0"></div>
            )}

            <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
          <span className={`text-xs font-semibold ${
              subReply.userId === community.userId ? 'text-gray-500' : ''
          }`}>
            {getDisplayNickname(subReply)}
          </span>
                    <span className="text-xs text-gray-500">
            {formatRelativeTime(subReply.createdAt)}
          </span>

                    {/* 액션 버튼들 */}
                    {subReply.userId === currentUserId || isAdmin ? (
                        <button
                            onClick={() => openSubReplyDeleteModal(community._id, commentId, replyId, subReply._id)}
                            className="text-red-500 text-xs ml-2 hover:underline"
                        >
                            삭제
                        </button>
                    ) : (
                        <button
                            onClick={() => handleSubReplyReport(subReply, postId)}
                            className="text-gray-500 text-xs ml-2 hover:text-rose-600 hover:underline"
                        >
                            신고
                        </button>
                    )}
                </div>

                {/* 대대댓글 내용 */}
                <p className="text-xs text-gray-800" id={`subReply-${subReply._id}`}>
                    {subReply.commentContents}
                </p>

                {/* 대대댓글 이미지 */}
                {subReply.subReplyImage && (
                    <img
                        src={
                            subReply.subReplyImage.startsWith('http') ||
                            subReply.subReplyImage.startsWith('data:')
                                ? subReply.subReplyImage
                                : `${API_HOST}/uploads${subReply.subReplyImage}`
                        }
                        alt="답글 이미지"
                        className="w-20 h-auto mt-1"
                    />
                )}
            </div>
        </li>
    );
};

export default SubReply;
