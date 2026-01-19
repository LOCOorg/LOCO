// src/components/communitycomponents/Comment.jsx
import { useState, useEffect } from 'react';
import ProfileButton from '../MyPageComponent/ProfileButton.jsx';
import CommentPollManager from "./CommentPollManager.jsx";
import Reply from './Reply.jsx';
import { fetchRepliesByCommentId } from '../../api/communityApi.js';

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
    const [replies, setReplies] = useState([]);
    const [replyPage, setReplyPage] = useState(1);
    const [hasMoreReplies, setHasMoreReplies] = useState(false);

    useEffect(() => {
        if (comment.replies) {
            setReplies(comment.replies);
            setHasMoreReplies(comment.replies.length < comment.totalReplies);
        }
    }, [comment.replies]);

    const loadMoreReplies = async () => {
        const nextPage = replyPage + 1;
        try {
            const response = await fetchRepliesByCommentId(comment._id, nextPage);
            setReplies(prevReplies => [...prevReplies, ...response.replies]);
            setReplyPage(nextPage);
            setHasMoreReplies(response.replies.length > 0 && response.replies.length % 5 === 0);
        } catch (error) {
            console.error("Error loading more replies:", error);
        }
    };

    const isCommentDeleted = comment.isDeleted;
    const hasActiveReplies = replies && replies.some(reply =>
        !reply.isDeleted || (reply.subReplies && reply.subReplies.some(sub => !sub.isDeleted))
    );

    if (isCommentDeleted && !hasActiveReplies) {
        return null;
    }

    const state = replyState[comment._id] || { open: false, text: '', file: null };


    return (
        <li className="list-none">
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-3 shadow-sm hover:shadow-md transition-shadow duration-200">
                {/* 헤더: 프로필 + 정보 + 액션버튼 */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* 프로필 버튼 */}
                        {!isCommentDeleted && !comment.isAnonymous ? (
                            <ProfileButton
                                profile={{ _id: comment.userId }}
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
                                !isCommentDeleted && comment.userId === community.userId ? 'text-blue-600' : ''
                            }`}>
                                {isCommentDeleted ? "삭제된 사용자" : getDisplayNickname(comment)}
                            </span>
                            <span className="text-xs text-gray-500">
                                {formatRelativeTime(comment.createdAt)}
                            </span>
                        </div>
                    </div>

                    {/* 액션 버튼들 */}
                    {!isCommentDeleted && (
                        <div className="flex items-center gap-2">
                            {comment.userId === currentUserId || isAdmin ? (
                                <button
                                    onClick={() => openCommentDeleteModal(community._id, comment._id)}
                                    className="text-gray-400 hover:text-red-500 text-xs transition-colors p-1"
                                    title="삭제"
                                >
                                    삭제
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleCommentReport(comment)}
                                    className="text-gray-400 hover:text-red-500 text-xs transition-colors p-1"
                                    title="신고"
                                >
                                    신고
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* 댓글 내용 */}
                <div className="pl-1 sm:pl-0">
                    <p className="text-gray-800 break-words whitespace-pre-wrap text-sm md:text-base leading-relaxed" id={`comment-${comment._id}`}>
                        {isCommentDeleted ? (
                            <span className="text-gray-500 italic">삭제된 댓글입니다.</span>
                        ) : (
                            comment.commentContents
                        )}
                    </p>

                    {/* 댓글 이미지 */}
                    {!isCommentDeleted && comment.commentImage && (
                        <div className="mt-3">
                            <img
                                src={
                                    comment.commentImage.startsWith('http') ||
                                    comment.commentImage.startsWith('data:')
                                        ? comment.commentImage
                                        : `${API_HOST}/uploads${comment.commentImage}`
                                }
                                alt="댓글 이미지"
                                className="w-full max-w-sm h-auto rounded-lg border border-gray-100"
                            />
                        </div>
                    )}

                    {/* 댓글 투표 관리자 */}
                    {!isCommentDeleted && (
                        <div className="mt-2">
                            <CommentPollManager
                                comment={comment}
                                community={community}
                                currentUserId={currentUserId}
                                setComments={setComments}
                                isAdmin={isAdmin}
                            />
                        </div>
                    )}

                    {/* 답글 버튼 */}
                    {!isCommentDeleted && (
                        <div className="mt-2">
                            <button
                                onClick={() => toggleReplyForm(comment._id)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1 py-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                답글 달기
                            </button>
                        </div>
                    )}
                </div>

                {/* 답글 입력 폼 */}
                {state.open && (
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-100 rounded-lg">
            <textarea
                value={state.text}
                onChange={(e) => handleReplyTextChange(comment._id, e.target.value)}
                placeholder="답글을 입력하세요 (최대 1000자)"
                className="w-full p-2 border border-gray-300 rounded-lg resize-none text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                rows="3"
                maxLength={1000}
            />
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-3">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-2">
                                <label className="cursor-pointer inline-flex items-center gap-2 text-xs text-gray-600 hover:text-blue-600 transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleReplyFileChange(comment._id, e.target.files[0])}
                                        className="hidden"
                                    />
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    이미지 추가
                                </label>
                                {state.file && (
                                    <span className="text-xs text-gray-600 truncate max-w-[150px] bg-white px-2 py-1 rounded border border-gray-200">
                                        {state.file.name}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-end space-x-3 w-full sm:w-auto">
                                <label className="flex items-center text-xs cursor-pointer select-none text-gray-600 hover:text-gray-900">
                                    <input
                                        type="checkbox"
                                        checked={replyIsAnonymous[comment._id] || false}
                                        onChange={(e) =>
                                            setReplyIsAnonymous((prev) => ({
                                                ...prev,
                                                [comment._id]: e.target.checked,
                                            }))
                                        }
                                        className="mr-1 rounded text-blue-500 focus:ring-blue-500"
                                    />
                                    익명
                                </label>
                                <button
                                    onClick={() => handleAddReply(community._id, comment._id)}
                                    className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors whitespace-nowrap shadow-sm"
                                >
                                    등록
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 대댓글 목록 */}
            {replies && replies.length > 0 && (
                <ul className="pl-2 sm:pl-6 space-y-2 mt-2 border-l-2 border-gray-100 ml-1">
                    {replies.map((reply) => (
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
                            setReplies={setReplies}
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
                    {hasMoreReplies && (
                        <button onClick={loadMoreReplies} className="text-blue-500 text-xs mt-2 ml-2 hover:underline">
                            답글 더보기
                        </button>
                    )}
                </ul>
            )}
        </li>
    );
};

export default Comment;
