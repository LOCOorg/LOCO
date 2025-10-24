// src/components/communitycomponents/Comment.jsx
import ProfileButton from '../MyPageComponent/ProfileButton.jsx';
import CommentPollManager from "./CommentPollManager.jsx";
import Reply from './Reply.jsx';

const Comment = ({
                     comment,
                     community,
                     currentUserId,
                     isAdmin,
                     getDisplayNickname,
                     formatRelativeTime,
                     replyState,
                     replyIsAnonymous,
                     setReplyIsAnonymous,
                     toggleReplyForm,
                     handleReplyTextChange,
                     handleReplyFileChange,
                     handleAddReply,
                     openCommentDeleteModal,
                     handleCommentReport,
                     setComments,
                     API_HOST,
                     subReplyState,
                     subReplyIsAnonymous,
                     setSubReplyIsAnonymous,
                     toggleSubReplyForm,
                     handleSubReplyTextChange,
                     handleSubReplyFileChange,
                     handleAddSubReply,
                     openReplyDeleteModal,
                     handleReplyReport,
                     openSubReplyDeleteModal,
                     handleSubReplyReport
                 }) => {
    const isCommentDeleted = comment.isDeleted;
    const hasActiveReplies = comment.replies && comment.replies.some(reply =>
        !reply.isDeleted || (reply.subReplies && reply.subReplies.some(sub => !sub.isDeleted))
    );

    if (isCommentDeleted && !hasActiveReplies) {
        return null;
    }

    const state = replyState[comment._id] || { open: false, text: '', file: null };


    return (
        <li className="flex space-x-3 p-3 border border-gray-200 rounded hover:bg-gray-50 transition duration-200">
            {/* 프로필 버튼 */}
            {!isCommentDeleted && !comment.isAnonymous ? (
                <ProfileButton
                    profile={{ _id: comment.userId }}
                    area="프로필"
                />
            ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
            )}

            <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
          <span className={`text-sm font-semibold`}>
            {isCommentDeleted ? "삭제된 사용자" : getDisplayNickname(comment)}
          </span>
                    <span className="text-xs text-gray-500">
            {formatRelativeTime(comment.createdAt)}
          </span>

                    {/* 액션 버튼들 */}
                    {!isCommentDeleted && (
                        <>
                            {comment.userId === currentUserId || isAdmin ? (
                                <button
                                    onClick={() => openCommentDeleteModal(community._id, comment._id)}
                                    className="text-red-500 text-xs ml-2 hover:underline"
                                >
                                    삭제
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleCommentReport(comment)}
                                    className="text-gray-500 text-xs ml-2 hover:text-rose-600 hover:underline"
                                >
                                    신고
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* 댓글 내용 */}
                <p className="text-gray-800" id={`comment-${comment._id}`}>
                    {isCommentDeleted ? (
                        <span className="text-gray-500 italic">삭제된 댓글입니다.</span>
                    ) : (
                        comment.commentContents
                    )}
                </p>

                {/* 댓글 이미지 */}
                {!isCommentDeleted && comment.commentImage && (
                    <img
                        src={
                            comment.commentImage.startsWith('http') ||
                            comment.commentImage.startsWith('data:')
                                ? comment.commentImage
                                : `${API_HOST}/uploads${comment.commentImage}`
                        }
                        alt="댓글 이미지"
                        className="w-32 h-auto mt-2"
                    />
                )}

                {/* 댓글 투표 관리자 */}
                {!isCommentDeleted && (
                    <CommentPollManager
                        comment={comment}
                        community={community}
                        currentUserId={currentUserId}
                        setComments={setComments}
                        isAdmin={isAdmin}
                    />
                )}

                {/* 답글 버튼 */}
                {!isCommentDeleted && (
                    <button
                        onClick={() => toggleReplyForm(comment._id)}
                        className="text-blue-500 text-xs mt-2 hover:underline"
                    >
                        답글
                    </button>
                )}

                {/* 답글 입력 폼 */}
                {state.open && (
                    <div className="mt-3 p-3 bg-gray-100 rounded">
            <textarea
                value={state.text}
                onChange={(e) => handleReplyTextChange(comment._id, e.target.value)}
                placeholder="답글을 입력하세요 (최대 1000자)"
                className="w-full p-2 border border-gray-300 rounded resize-none"
                rows="3"
                maxLength={1000}
            />
                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleReplyFileChange(comment._id, e.target.files[0])}
                                    className="text-xs"
                                />
                                {state.file && (
                                    <span className="text-xs text-gray-600">{state.file.name}</span>
                                )}
                            </div>
                            <div className="flex items-center space-x-3">
                                <label className="flex items-center text-xs">
                                    <input
                                        type="checkbox"
                                        checked={replyIsAnonymous[comment._id] || false}
                                        onChange={(e) =>
                                            setReplyIsAnonymous((prev) => ({
                                                ...prev,
                                                [comment._id]: e.target.checked,
                                            }))
                                        }
                                        className="mr-1"
                                    />
                                    익명
                                </label>
                                <button
                                    onClick={() => handleAddReply(community._id, comment._id)}
                                    className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                                >
                                    등록
                                </button>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {state.text.length} / 1000
                        </div>
                    </div>
                )}

                {/* 대댓글 목록 */}
                {comment.replies && comment.replies.length > 0 && (
                    <ul className="mt-3 space-y-2 border-l-2 border-gray-200 pl-4">
                        {comment.replies.map((reply) => (
                            <Reply
                                key={reply._id}
                                reply={reply}
                                postId={comment.postId}
                                commentId={comment._id}
                                community={community}
                                currentUserId={currentUserId}
                                isAdmin={isAdmin}
                                getDisplayNickname={getDisplayNickname}
                                formatRelativeTime={formatRelativeTime}

                                subReplyState={subReplyState}
                                subReplyIsAnonymous={subReplyIsAnonymous}
                                setSubReplyIsAnonymous={setSubReplyIsAnonymous}
                                toggleSubReplyForm={toggleSubReplyForm}
                                handleSubReplyTextChange={handleSubReplyTextChange}
                                handleSubReplyFileChange={handleSubReplyFileChange}
                                handleAddSubReply={handleAddSubReply}
                                openReplyDeleteModal={openReplyDeleteModal}
                                handleReplyReport={handleReplyReport}
                                openSubReplyDeleteModal={openSubReplyDeleteModal}
                                handleSubReplyReport={handleSubReplyReport}
                                API_HOST={API_HOST}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </li>
    );
};

export default Comment;
