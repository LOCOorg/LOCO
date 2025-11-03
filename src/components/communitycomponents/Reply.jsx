// src/components/communitycomponents/Reply.jsx
import { useState, useEffect } from 'react';
import ProfileButton from '../MyPageComponent/ProfileButton.jsx';
import SubReply from './SubReply.jsx';
import { fetchSubRepliesByReplyId } from '../../api/communityApi.js';

const Reply = ({
                   reply,
                   postId,
                   commentId,
                   community,
                   currentUserId,
                   isAdmin,
                   getDisplayNickname,
                   formatRelativeTime,
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
                   handleSubReplyReport,
                   API_HOST
               }) => {
    const [subReplies, setSubReplies] = useState([]);
    const [subReplyPage, setSubReplyPage] = useState(1);
    const [hasMoreSubReplies, setHasMoreSubReplies] = useState(false);

    useEffect(() => {
        if (reply.subReplies) {
            setSubReplies(reply.subReplies);
            setHasMoreSubReplies(reply.subReplies.length < reply.totalSubReplies);
        }
    }, [reply.subReplies]);

    const loadMoreSubReplies = async () => {
        const nextPage = subReplyPage + 1;
        try {
            const response = await fetchSubRepliesByReplyId(reply._id, nextPage);
            setSubReplies(prevSubReplies => [...prevSubReplies, ...response.subReplies]);
            setSubReplyPage(nextPage);
            setHasMoreSubReplies(response.subReplies.length > 0 && response.subReplies.length % 5 === 0);
        } catch (error) {
            console.error("Error loading more sub-replies:", error);
        }
    };

    const isReplyDeleted = reply.isDeleted;
    const hasActiveSubReplies = subReplies && subReplies.some(sub => !sub.isDeleted);

    if (isReplyDeleted && !hasActiveSubReplies) {
        return null;
    }

    const subState = subReplyState[reply._id] || { open: false, text: '', file: null };

    return (
        <li className="flex space-x-3 p-2 bg-white rounded">
            {/* 프로필 버튼 */}
            {!isReplyDeleted && !reply.isAnonymous ? (
                <ProfileButton
                    profile={{ _id: reply.userId }}
                    area="프로필"
                />
            ) : (
                <div className="w-6 h-6 bg-gray-300 rounded-full flex-shrink-0"></div>
            )}

            <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
          <span className={`text-xs font-semibold ${
              !isReplyDeleted && reply.userId === community.userId ? 'text-gray-500' :
                  isReplyDeleted ? 'text-gray-500' : ''
          }`}>
            {isReplyDeleted ? "삭제된 사용자" : getDisplayNickname(reply)}
          </span>
                    <span className="text-xs text-gray-500">
            {formatRelativeTime(reply.createdAt)}
          </span>

                    {/* 액션 버튼들 */}
                    {!isReplyDeleted && (
                        <>
                            {reply.userId === currentUserId || isAdmin ? (
                                <button
                                    onClick={() => openReplyDeleteModal(community._id, commentId, reply._id)}
                                    className="text-red-500 text-xs ml-2 hover:underline"
                                >
                                    삭제
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleReplyReport(reply, postId)}
                                    className="text-gray-500 text-xs ml-2 hover:text-rose-600 hover:underline"
                                >
                                    신고
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* 대댓글 내용 */}
                <p className="text-sm text-gray-800" id={`reply-${reply._id}`}>
                    {isReplyDeleted ? (
                        <span className="text-gray-500 italic">삭제된 답글입니다.</span>
                    ) : (
                        reply.commentContents
                    )}
                </p>

                {/* 대댓글 이미지 */}
                {!isReplyDeleted && reply.replyImage && (
                    <img
                        src={
                            reply.replyImage.startsWith('http') ||
                            reply.replyImage.startsWith('data:')
                                ? reply.replyImage
                                : `${API_HOST}/uploads${reply.replyImage}`
                        }
                        alt="답글 이미지"
                        className="w-24 h-auto mt-2"
                    />
                )}

                {/* 답글 버튼 */}
                {!isReplyDeleted && (
                    <button
                        onClick={() => toggleSubReplyForm(reply._id)}
                        className="text-blue-500 text-xs mt-1 hover:underline"
                    >
                        답글
                    </button>
                )}

                {/* 대대댓글 입력 폼 */}
                {subState.open && (
                    <div className="mt-2 p-2 bg-gray-50 rounded">
            <textarea
                value={subState.text}
                onChange={(e) => handleSubReplyTextChange(reply._id, e.target.value)}
                placeholder="답글을 입력하세요 (최대 1000자)"
                className="w-full p-2 border border-gray-300 rounded resize-none text-sm"
                rows="2"
                maxLength={1000}
            />
                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleSubReplyFileChange(reply._id, e.target.files[0])}
                                    className="text-xs"
                                />
                                {subState.file && (
                                    <span className="text-xs text-gray-600">{subState.file.name}</span>
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                <label className="flex items-center text-xs">
                                    <input
                                        type="checkbox"
                                        checked={subReplyIsAnonymous[reply._id] || false}
                                        onChange={(e) =>
                                            setSubReplyIsAnonymous((prev) => ({
                                                ...prev,
                                                [reply._id]: e.target.checked,
                                            }))
                                        }
                                        className="mr-1"
                                    />
                                    익명
                                </label>
                                <button
                                    onClick={() => handleAddSubReply(community._id, commentId, reply._id)}
                                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                                >
                                    등록
                                </button>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {subState.text.length} / 1000
                        </div>
                    </div>
                )}

                {/* 대대댓글 목록 */}
                {subReplies && subReplies.length > 0 && (
                    <ul className="mt-2 space-y-2 border-l-2 border-gray-100 pl-3">
                        {subReplies.map((subReply) => (
                            <SubReply
                                key={subReply._id}
                                subReply={subReply}
                                postId={postId}
                                replyId={reply._id}
                                commentId={commentId}
                                community={community}
                                currentUserId={currentUserId}
                                isAdmin={isAdmin}
                                getDisplayNickname={getDisplayNickname}
                                formatRelativeTime={formatRelativeTime}
                                setSubReplies={setSubReplies}
                                openSubReplyDeleteModal={openSubReplyDeleteModal}
                                handleSubReplyReport={handleSubReplyReport}
                                API_HOST={API_HOST}
                            />
                        ))}
                        {hasMoreSubReplies && (
                            <button onClick={loadMoreSubReplies} className="text-blue-500 text-xs mt-2 hover:underline">
                                답글 더보기
                            </button>
                        )}
                    </ul>
                )}
            </div>
        </li>
    );
};

export default Reply;
