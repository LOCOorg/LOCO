// src/components/communitycomponents/Reply.jsx
import { useState, useEffect } from 'react';
import ProfileButton from '../MyPageComponent/ProfileButton.jsx';
import SubReply from './SubReply.jsx';
import { fetchSubRepliesByReplyId } from '../../api/communityApi.js';
import { useUpdateReply } from '../../hooks/queries/useCommunityQueries';

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

    // 수정 관련 상태
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(reply.commentContents);
    const updateReplyMutation = useUpdateReply();

    useEffect(() => {
        if (reply.subReplies) {
            setSubReplies(reply.subReplies);
            setHasMoreSubReplies(reply.subReplies.length < reply.totalSubReplies);
        }
    }, [reply.subReplies]);

    const handleUpdate = () => {
        if (!editValue.trim()) return;
        updateReplyMutation.mutate({
            postId: community._id,
            replyId: reply._id,
            updateData: { commentContents: editValue }
        }, {
            onSuccess: () => setIsEditing(false)
        });
    };

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
        <li className="list-none mb-2">
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 sm:p-4 hover:bg-gray-100 transition-colors duration-200">
                {/* 헤더: 프로필 + 정보 + 액션버튼 */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* 프로필 버튼 */}
                        {!isReplyDeleted && !reply.isAnonymous ? (
                            <ProfileButton
                                profile={{ _id: typeof reply.userId === 'object' ? reply.userId._id : reply.userId }}
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
                                !isReplyDeleted && (typeof reply.userId === 'object' ? reply.userId._id : reply.userId) === (typeof community.userId === 'object' ? community.userId._id : community.userId) ? 'text-blue-600' : ''
                            }`}>
                                {isReplyDeleted ? "삭제된 사용자" : getDisplayNickname(reply)}
                            </span>
                            <span className="text-xs text-gray-500">
                                {formatRelativeTime(reply.createdAt)}
                            </span>
                        </div>
                    </div>

                    {/* 액션 버튼들 */}
                    {!isReplyDeleted && (
                        <div className="flex items-center gap-2">
                            {(typeof reply.userId === 'object' ? reply.userId._id : reply.userId) === currentUserId || isAdmin ? (
                                <>
                                    {(typeof reply.userId === 'object' ? reply.userId._id : reply.userId) === currentUserId && (
                                        <button
                                            onClick={() => setIsEditing(!isEditing)}
                                            className="text-gray-400 hover:text-blue-500 text-xs transition-colors p-1"
                                        >
                                            {isEditing ? '취소' : '수정'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => openReplyDeleteModal(community._id, commentId, reply._id)}
                                        className="text-gray-400 hover:text-red-500 text-xs transition-colors p-1"
                                    >
                                        삭제
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => handleReplyReport(reply, postId)}
                                    className="text-gray-400 hover:text-red-500 text-xs transition-colors p-1"
                                >
                                    신고
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* 대댓글 내용 */}
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
                        <p className="text-gray-800 break-words whitespace-pre-wrap text-sm md:text-base leading-relaxed" id={`reply-${reply._id}`}>
                            {isReplyDeleted ? (
                                <span className="text-gray-500 italic">삭제된 답글입니다.</span>
                            ) : (
                                reply.commentContents
                            )}
                        </p>
                    )}

                    {/* 대댓글 이미지 */}
                    {!isReplyDeleted && reply.replyImage && (
                        <div className="mt-3">
                            <img
                                src={
                                    reply.replyImage.startsWith('http') ||
                                    reply.replyImage.startsWith('data:')
                                        ? reply.replyImage
                                        : `${API_HOST}/uploads${reply.replyImage}`
                                }
                                alt="답글 이미지"
                                className="w-full max-w-sm h-auto rounded-lg border border-gray-200"
                            />
                        </div>
                    )}

                    {/* 답글 버튼 */}
                    {!isReplyDeleted && (
                        <div className="mt-2">
                            <button
                                onClick={() => toggleSubReplyForm(reply._id)}
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

                {/* 대대댓글 입력 폼 */}
                {subState.open && (
                    <div className="mt-3 p-3 bg-white border border-blue-100 rounded-lg shadow-sm">
            <textarea
                value={subState.text}
                onChange={(e) => handleSubReplyTextChange(reply._id, e.target.value)}
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
                                        onChange={(e) => handleSubReplyFileChange(reply._id, e.target.files[0])}
                                        className="hidden"
                                    />
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    이미지 추가
                                </label>
                                {subState.file && (
                                    <span className="text-xs text-gray-600 truncate max-w-[150px] bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                        {subState.file.name}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-end space-x-3 w-full sm:w-auto">
                                <label className="flex items-center text-xs cursor-pointer select-none text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={subReplyIsAnonymous[reply._id] || false}
                                        onChange={(e) =>
                                            setSubReplyIsAnonymous((prev) => ({
                                                ...prev,
                                                [reply._id]: e.target.checked,
                                            }))
                                        }
                                        className="mr-1 rounded text-blue-500 focus:ring-blue-500"
                                    />
                                    익명
                                </label>
                                <button
                                    onClick={() => handleAddSubReply(community._id, commentId, reply._id)}
                                    className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors whitespace-nowrap shadow-sm"
                                >
                                    등록
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 대대댓글 목록 */}
            {subReplies && subReplies.length > 0 && (
                <ul className="pl-2 sm:pl-4 space-y-2 mt-2 border-l-2 border-gray-100 ml-1">
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
                        <button onClick={loadMoreSubReplies} className="text-blue-500 text-xs mt-2 ml-2 hover:underline">
                            답글 더보기
                        </button>
                    )}
                </ul>
            )}
        </li>
    );
};

export default Reply;
