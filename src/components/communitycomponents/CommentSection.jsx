// src/components/communitycomponents/CommentSection.jsx
import { useState } from 'react';
import { addReply, addSubReply, deleteComment, deleteReply, deleteSubReply } from '../../api/communityApi.js';
import CommonModal from '../../common/CommonModal.jsx';
import ReportForm from '../reportcomponents/ReportForm.jsx';
import Comment from './Comment.jsx';

const CommentSection = ({
                            community,
                            comments,
                            setComments,
                            setCommunity,
                            currentUserId,
                            isAdmin,
                            getDisplayNickname,
                            formatRelativeTime,
                            newComment,
                            setNewComment,
                            commentFile,
                            setCommentFile,
                            commentError,
                            commentIsAnonymous,
                            setCommentIsAnonymous,
                            onAddComment,
                            loadMoreComments,
                            hasMoreComments,
                        }) => {
    // 댓글 관련 상태
    const [replyState, setReplyState] = useState({});
    const [subReplyState, setSubReplyState] = useState({});
    const [replyIsAnonymous, setReplyIsAnonymous] = useState({});
    const [subReplyIsAnonymous, setSubReplyIsAnonymous] = useState({});

    // 삭제 모달 상태
    const [commentDeleteModalOpen, setCommentDeleteModalOpen] = useState(false);
    const [replyDeleteModalOpen, setReplyDeleteModalOpen] = useState(false);
    const [subReplyDeleteModalOpen, setSubReplyDeleteModalOpen] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState(null);
    const [replyToDelete, setReplyToDelete] = useState({ commentId: null, replyId: null });
    const [subReplyToDelete, setSubReplyToDelete] = useState({ commentId: null, replyId: null, subReplyId: null });

    // 신고 모달 상태
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportTarget, setReportTarget] = useState({ nickname: '', anchor: null });

    const API_HOST = import.meta.env.VITE_API_HOST;


    // 총 댓글 수 계산
    const getTotalCommentCount = () => {
        if (!comments) return 0;

        let totalCount = 0;
        comments.forEach((comment) => {
            const hasActiveReplies = comment.replies?.some(reply =>
                !reply.isDeleted || (reply.subReplies?.some(sub => !sub.isDeleted))
            );

            if (!comment.isDeleted || hasActiveReplies) {
                if (!comment.isDeleted) totalCount++;

                comment.replies?.forEach((reply) => {
                    const hasActiveSubReplies = reply.subReplies?.some(sub => !sub.isDeleted);

                    if (!reply.isDeleted || hasActiveSubReplies) {
                        if (!reply.isDeleted) totalCount++;

                        reply.subReplies?.forEach((subReply) => {
                            if (!subReply.isDeleted) totalCount++;
                        });
                    }
                });
            }
        });

        return totalCount;
    };

    // 대댓글 관련 함수들
    const toggleReplyForm = (commentId) => {
        setReplyState((prev) => ({
            ...prev,
            [commentId]: {
                open: !prev[commentId]?.open,
                text: prev[commentId]?.text || '',
                file: null,
            },
        }));
    };

    const handleReplyTextChange = (commentId, text) => {
        if (text.length > 1000) return;
        setReplyState((prev) => ({
            ...prev,
            [commentId]: { ...prev[commentId], text },
        }));
    };

    const handleReplyFileChange = (commentId, file) => {
        setReplyState((prev) => ({
            ...prev,
            [commentId]: { ...prev[commentId], file },
        }));
    };

    const handleAddReply = async (communityId, commentId) => {
        const state = replyState[commentId] || { text: '', file: null };
        const text = state.text.trim();
        if (!text) return;

        try {
            const formData = new FormData();
            formData.append('userId', currentUserId);
            formData.append('commentContents', text);
            formData.append('isAnonymous', replyIsAnonymous[commentId] || false);
            if (state.file) formData.append('replyImage', state.file);

            const newReply = await addReply(communityId, commentId, formData);

            setComments(comments.map(c => {
                if (c._id === commentId) {
                    // ✅ replies가 배열인지 확인하고 없으면 빈 배열 사용
                    const existingReplies = Array.isArray(c.replies) ? c.replies : [];
                    return { ...c, replies: [...existingReplies, newReply] };
                }
                return c;
            }));

            setReplyState((prev) => ({
                ...prev,
                [commentId]: { open: false, text: '', file: null },
            }));
            setReplyIsAnonymous((prev) => ({ ...prev, [commentId]: false }));

            // ✅ 댓글 수 증가
            setCommunity({ ...community, commentCount: community.commentCount + 1 });
        } catch (err) {
            console.error('답글 추가 오류:', err);
        }
    };

    // 대대댓글 관련 함수들
    const toggleSubReplyForm = (replyId) => {
        setSubReplyState((prev) => ({
            ...prev,
            [replyId]: {
                open: !prev[replyId]?.open,
                text: '',
                file: null,
            },
        }));
    };

    const handleSubReplyTextChange = (replyId, text) => {
        if (text.length > 1000) return;
        setSubReplyState((prev) => ({
            ...prev,
            [replyId]: { ...prev[replyId], text },
        }));
    };

    const handleSubReplyFileChange = (replyId, file) => {
        setSubReplyState((prev) => ({
            ...prev,
            [replyId]: { ...prev[replyId], file },
        }));
    };

    const handleAddSubReply = async (communityId, commentId, replyId) => {
        const state = subReplyState[replyId] || { text: '', file: null };
        const text = state.text.trim();
        if (!text) return;

        try {
            const formData = new FormData();
            formData.append('userId', currentUserId);
            formData.append('commentContents', text);
            formData.append('isAnonymous', subReplyIsAnonymous[replyId] || false);
            if (state.file) formData.append('subReplyImage', state.file);

            const newSubReply = await addSubReply(communityId, commentId, replyId, formData);

            setComments(comments.map(c => {
                if (c._id === commentId) {
                    // ✅ replies가 배열인지 확인
                    const existingReplies = Array.isArray(c.replies) ? c.replies : [];
                    const newReplies = existingReplies.map(r => {
                        if (r._id === replyId) {
                            // ✅ subReplies가 배열인지 확인하고 없으면 빈 배열 사용
                            const existingSubReplies = Array.isArray(r.subReplies) ? r.subReplies : [];
                            return { ...r, subReplies: [...existingSubReplies, newSubReply] };
                        }
                        return r;
                    });
                    return { ...c, replies: newReplies };
                }
                return c;
            }));

            setSubReplyState((prev) => ({
                ...prev,
                [replyId]: { open: false, text: '', file: null },
            }));
            setSubReplyIsAnonymous((prev) => ({ ...prev, [replyId]: false }));

            // ✅ 댓글 수 증가
            setCommunity({ ...community, commentCount: community.commentCount + 1 });
        } catch (err) {
            console.error('대댓글 추가 오류:', err);
        }
    };

    // 삭제 관련 함수들
    const openCommentDeleteModal = (communityId, commentId) => {
        setCommentToDelete({ communityId, commentId });
        setCommentDeleteModalOpen(true);
    };

// ✅ 댓글 삭제
    const confirmDeleteComment = async () => {
        try {
            await deleteComment(commentToDelete.communityId, commentToDelete.commentId);

            // 프론트에서 isDeleted만 설정 (하위 항목 유지)
            setComments(comments.map(c =>
                c._id === commentToDelete.commentId
                    ? { ...c, isDeleted: true }
                    : c
            ));

            setCommunity({ ...community, commentCount: community.commentCount - 1 });
            setCommentDeleteModalOpen(false);
            setCommentToDelete(null);
        } catch (err) {
            console.error('댓글 삭제 오류:', err);
            setCommentDeleteModalOpen(false);
        }
    };

    const openReplyDeleteModal = (communityId, commentId, replyId) => {
        setReplyToDelete({ communityId, commentId, replyId });
        setReplyDeleteModalOpen(true);
    };

// ✅ 답글 삭제
    const confirmDeleteReply = async () => {
        try {
            await deleteReply(
                replyToDelete.communityId,
                replyToDelete.commentId,
                replyToDelete.replyId
            );

            // 프론트에서 isDeleted만 설정 (하위 대댓글 유지)
            setComments(comments.map(c =>
                c._id === replyToDelete.commentId
                    ? {
                        ...c,
                        replies: c.replies.map(r =>
                            r._id === replyToDelete.replyId
                                ? { ...r, isDeleted: true }
                                : r
                        )
                    }
                    : c
            ));

            setCommunity({ ...community, commentCount: community.commentCount - 1 });
            setReplyDeleteModalOpen(false);
            setReplyToDelete({ communityId: null, commentId: null, replyId: null });
        } catch (err) {
            console.error('답글 삭제 오류:', err);
            setReplyDeleteModalOpen(false);
        }
    };

    const openSubReplyDeleteModal = (communityId, commentId, replyId, subReplyId) => {
        setSubReplyToDelete({ communityId, commentId, replyId, subReplyId });
        setSubReplyDeleteModalOpen(true);
    };

// ✅ 대댓글 삭제
    const confirmDeleteSubReply = async () => {
        try {
            await deleteSubReply(
                subReplyToDelete.communityId,
                subReplyToDelete.commentId,
                subReplyToDelete.replyId,
                subReplyToDelete.subReplyId
            );

            // 프론트에서 isDeleted만 설정
            setComments(comments.map(c =>
                c._id === subReplyToDelete.commentId
                    ? {
                        ...c,
                        replies: c.replies.map(r =>
                            r._id === subReplyToDelete.replyId
                                ? {
                                    ...r,
                                    subReplies: r.subReplies.map(s =>
                                        s._id === subReplyToDelete.subReplyId
                                            ? { ...s, isDeleted: true }
                                            : s
                                    )
                                }
                                : r
                        )
                    }
                    : c
            ));

            setCommunity({ ...community, commentCount: community.commentCount - 1 });
            setSubReplyDeleteModalOpen(false);
            setSubReplyToDelete({ communityId: null, commentId: null, replyId: null, subReplyId: null });
        } catch (err) {
            console.error('대댓글 삭제 오류:', err);
            setSubReplyDeleteModalOpen(false);
        }
    };

    // 신고 관련 함수들
    const handleCommentReport = (comment) => {
        setReportTarget({
            nickname: getDisplayNickname(comment),
            anchor: { type: 'comment', parentId: comment.postId, targetId: comment._id }
        });
        setReportModalOpen(true);
    };

    const handleReplyReport = (reply, postId) => {
        setReportTarget({
            nickname: getDisplayNickname(reply),
            anchor: { type: 'reply', parentId: postId, targetId: reply._id }
        });
        setReportModalOpen(true);
    };

    const handleSubReplyReport = (subReply, postId) => {
        setReportTarget({
            nickname: getDisplayNickname(subReply),
            anchor: { type: 'subReply', parentId: postId, targetId: subReply._id }
        });
        setReportModalOpen(true);
    };

    return (
        <>
            {/* 삭제 확인 모달들 */}
            <CommonModal
                isOpen={commentDeleteModalOpen}
                onClose={() => setCommentDeleteModalOpen(false)}
                title="댓글 삭제 확인"
                onConfirm={confirmDeleteComment}
            >
                댓글을 삭제하시겠습니까?
            </CommonModal>

            <CommonModal
                isOpen={replyDeleteModalOpen}
                onClose={() => setReplyDeleteModalOpen(false)}
                title="대댓글 삭제 확인"
                onConfirm={confirmDeleteReply}
            >
                대댓글을 삭제하시겠습니까?
            </CommonModal>

            <CommonModal
                isOpen={subReplyDeleteModalOpen}
                onClose={() => setSubReplyDeleteModalOpen(false)}
                title="답글 삭제 확인"
                onConfirm={confirmDeleteSubReply}
            >
                답글을 삭제하시겠습니까?
            </CommonModal>

            {/* 신고 모달 */}
            {reportModalOpen && (
                <div className="fixed inset-0 z-50 flex justify-center items-center bg-gray-900 bg-opacity-50">
                    <div className="bg-white p-6 rounded shadow-lg relative">
                        <button
                            className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                            onClick={() => setReportModalOpen(false)}
                        >
                            X
                        </button>
                        <ReportForm
                            onClose={() => setReportModalOpen(false)}
                            reportedUser={{ nickname: reportTarget.nickname }}
                            anchor={reportTarget.anchor}
                            defaultArea="커뮤니티"
                        />
                    </div>
                </div>
            )}

            {/* 댓글 섹션 */}
            <div className="mt-6">
                <h3 className="text-xl font-semibold mb-3">댓글 ({getTotalCommentCount()})</h3>

                {/* 댓글 목록 */}
                {comments && comments.length > 0 ? (
                    <ul className="space-y-3">
                        {comments.map((comment) => (
                            <Comment
                                key={comment._id}
                                comment={comment}
                                community={community}
                                currentUserId={currentUserId}
                                isAdmin={isAdmin}
                                getDisplayNickname={getDisplayNickname}
                                formatRelativeTime={formatRelativeTime}

                                replyState={replyState}
                                replyIsAnonymous={replyIsAnonymous}
                                setReplyIsAnonymous={setReplyIsAnonymous}
                                toggleReplyForm={toggleReplyForm}
                                handleReplyTextChange={handleReplyTextChange}
                                handleReplyFileChange={handleReplyFileChange}
                                handleAddReply={handleAddReply}
                                openCommentDeleteModal={openCommentDeleteModal}
                                handleCommentReport={handleCommentReport}
                                setComments={setComments}
                                setCommunity={setCommunity}
                                API_HOST={API_HOST}
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
                            />
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 text-sm">댓글이 없습니다.</p>
                )}
                {hasMoreComments && (
                    <div className="text-center mt-4">
                        <button
                            onClick={loadMoreComments}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                        >
                            더보기
                        </button>
                    </div>
                )}
            </div>

            {/* 댓글 입력 폼 (기존 위치 유지) */}
            <div className="mt-6 p-4 border border-gray-300 rounded">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="댓글을 입력하세요 (최대 1000자)"
                    className="w-full p-2 border border-gray-300 rounded resize-none"
                    rows="4"
                    maxLength={1000}
                />
                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-3">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setCommentFile(e.target.files[0])}
                            className="text-sm"
                        />
                        {commentFile && (
                            <span className="text-sm text-gray-600">{commentFile.name}</span>
                        )}
                    </div>
                    <div className="flex items-center space-x-3">
                        <label className="flex items-center text-sm">
                            <input
                                type="checkbox"
                                checked={commentIsAnonymous}
                                onChange={(e) => setCommentIsAnonymous(e.target.checked)}
                                className="mr-1"
                            />
                            익명
                        </label>
                        <button
                            onClick={onAddComment}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            등록
                        </button>
                    </div>
                </div>
                <div className="text-sm text-gray-500 mt-2">
                    {newComment.length} / 1000
                </div>
                {commentError && (
                    <div className="text-red-500 text-sm mt-2">{commentError}</div>
                )}
            </div>
        </>
    );
};

export default CommentSection;
