// src/components/communitycomponents/CommentSection.jsx
import { useState, useEffect } from 'react';
import { addReply, addSubReply, deleteComment, deleteReply, deleteSubReply } from '../../api/communityApi.js';
import { getUserMinimal } from '../../api/userProfileLightAPI.js'; // 댓글용 경량 API: nickname, profilePhoto만 필요
import CommonModal from '../../common/CommonModal.jsx';
import ProfileButton from '../MyPageComponent/ProfileButton.jsx';
import ReportForm from '../reportcomponents/ReportForm.jsx';
import CommentPollManager from "./CommentPollManager.jsx";

const CommentSection = ({
                            community,
                            setCommunity,
                            currentUserId,
                            isAdmin,
                            userMap,
                            getDisplayNickname,
                            formatRelativeTime,
                            newComment,
                            setNewComment,
                            commentFile,
                            setCommentFile,
                            commentError,
                            setCommentError,
                            commentIsAnonymous,
                            setCommentIsAnonymous,
                            onAddComment
                        }) => {
    // 댓글 관련 상태
    const [replyState, setReplyState] = useState({});
    const [subReplyState, setSubReplyState] = useState({});
    const [replyIsAnonymous, setReplyIsAnonymous] = useState({});
    const [subReplyIsAnonymous, setSubReplyIsAnonymous] = useState({});
    const [profileMap, setProfileMap] = useState({});

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

    // 프로필 정보 로드
    useEffect(() => {
        const fetchUserProfiles = async () => {
            if (!community) return;

            const userIds = new Set();

            community.comments?.forEach((comment) => {
                if (comment.userId && !comment.isAnonymous) {
                    userIds.add(comment.userId);
                }
                comment.replies?.forEach((reply) => {
                    if (reply.userId && !reply.isAnonymous) {
                        userIds.add(reply.userId);
                    }
                    reply.subReplies?.forEach((subReply) => {
                        if (subReply.userId && !subReply.isAnonymous) {
                            userIds.add(subReply.userId);
                        }
                    });
                });
            });

            const newProfileMap = {};
            await Promise.all(
                Array.from(userIds).map(async (uid) => {
                    try {
                        const userInfo = await getUserMinimal(uid);
                        newProfileMap[uid] = userInfo;
                    } catch (error) {
                        console.error(error);
                    }
                })
            );
            setProfileMap(newProfileMap);
        };
        fetchUserProfiles();
    }, [community]);

    // 총 댓글 수 계산
    const getTotalCommentCount = () => {
        if (!community?.comments) return 0;

        let totalCount = 0;
        community.comments.forEach((comment) => {
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

    const handleAddReply = async (commentId) => {
        const state = replyState[commentId] || { text: '', file: null };
        const text = state.text.trim();
        if (!text) return;

        try {
            const formData = new FormData();
            formData.append('userId', currentUserId);
            formData.append('commentContents', text);
            formData.append('isAnonymous', replyIsAnonymous[commentId] || false);
            if (state.file) formData.append('replyImage', state.file);

            const updated = await addReply(community._id, commentId, formData);
            setCommunity(updated);
            setReplyState((prev) => ({
                ...prev,
                [commentId]: { open: false, text: '', file: null },
            }));
            setReplyIsAnonymous((prev) => ({ ...prev, [commentId]: false }));
        } catch (err) {
            console.log(err);
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

    const handleAddSubReply = async (commentId, replyId) => {
        const state = subReplyState[replyId] || { text: '', file: null };
        const text = state.text.trim();
        if (!text) return;

        try {
            const formData = new FormData();
            formData.append('userId', currentUserId);
            formData.append('commentContents', text);
            formData.append('isAnonymous', subReplyIsAnonymous[replyId] || false);
            if (state.file) formData.append('subReplyImage', state.file);

            const updated = await addSubReply(community._id, commentId, replyId, formData);
            setCommunity(updated);
            setSubReplyState((prev) => ({
                ...prev,
                [replyId]: { open: false, text: '', file: null },
            }));
            setSubReplyIsAnonymous((prev) => ({ ...prev, [replyId]: false }));
        } catch (err) {
            console.log(err);
        }
    };

    // 삭제 관련 함수들
    const openCommentDeleteModal = (commentId) => {
        setCommentToDelete(commentId);
        setCommentDeleteModalOpen(true);
    };

    const confirmDeleteComment = async () => {
        try {
            const updated = await deleteComment(community._id, commentToDelete);
            setCommunity(updated);
            setCommentDeleteModalOpen(false);
            setCommentToDelete(null);
        } catch (err) {
            console.log(err);
            setCommentDeleteModalOpen(false);
        }
    };

    const openReplyDeleteModal = (commentId, replyId) => {
        setReplyToDelete({ commentId, replyId });
        setReplyDeleteModalOpen(true);
    };

    const confirmDeleteReply = async () => {
        try {
            const updated = await deleteReply(community._id, replyToDelete.commentId, replyToDelete.replyId);
            setCommunity(updated);
            setReplyDeleteModalOpen(false);
            setReplyToDelete({ commentId: null, replyId: null });
        } catch (err) {
            console.log(err);
            setReplyDeleteModalOpen(false);
        }
    };

    const openSubReplyDeleteModal = (commentId, replyId, subReplyId) => {
        setSubReplyToDelete({ commentId, replyId, subReplyId });
        setSubReplyDeleteModalOpen(true);
    };

    const confirmDeleteSubReply = async () => {
        try {
            const updated = await deleteSubReply(
                community._id,
                subReplyToDelete.commentId,
                subReplyToDelete.replyId,
                subReplyToDelete.subReplyId
            );
            setCommunity(updated);
            setSubReplyDeleteModalOpen(false);
            setSubReplyToDelete({ commentId: null, replyId: null, subReplyId: null });
        } catch (err) {
            console.log(err);
            setSubReplyDeleteModalOpen(false);
        }
    };

    // 신고 관련 함수들
    const handleCommentReport = (comment) => {
        setReportTarget({
            nickname: getDisplayNickname(comment),
            anchor: { type: 'comment', parentId: community._id, targetId: comment._id }
        });
        setReportModalOpen(true);
    };

    const handleReplyReport = (reply) => {
        setReportTarget({
            nickname: getDisplayNickname(reply),
            anchor: { type: 'reply', parentId: community._id, targetId: reply._id }
        });
        setReportModalOpen(true);
    };

    const handleSubReplyReport = (subReply) => {
        setReportTarget({
            nickname: getDisplayNickname(subReply),
            anchor: { type: 'subReply', parentId: community._id, targetId: subReply._id }
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
                {community.comments && community.comments.length > 0 ? (
                    <ul className="space-y-3">
                        {community.comments.map((comment) => {
                            // 삭제된 댓글인지 확인
                            const isCommentDeleted = comment.isDeleted;

                            // 자식 댓글(대댓글, 대대댓글)이 있는지 확인
                            const hasActiveReplies = comment.replies && comment.replies.some(reply =>
                                !reply.isDeleted || (reply.subReplies && reply.subReplies.some(sub => !sub.isDeleted))
                            );

                            // 삭제된 댓글이지만 자식 댓글이 없으면 렌더링하지 않음
                            if (isCommentDeleted && !hasActiveReplies) {
                                return null;
                            }

                            const state = replyState[comment._id] || { open: false, text: '', file: null };

                            return (
                                <li
                                    key={comment._id}
                                    className="flex space-x-3 p-3 border border-gray-200 rounded hover:bg-gray-50 transition duration-200"
                                >
                                    {/* 프로필 버튼 - 삭제된 댓글 또는 익명 댓글은 기본 프로필 */}
                                    {!isCommentDeleted && !comment.isAnonymous ? (
                                        <ProfileButton
                                            profile={profileMap[comment.userId]}
                                            area="프로필"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
                                    )}

                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span
                                                className={`text-sm font-semibold ${
                                                    !isCommentDeleted && comment.userId === community.userId ? 'text-gray-500' :
                                                        isCommentDeleted ? 'text-gray-500' : ''
                                                }`}
                                            >
                                                {isCommentDeleted ? "삭제된 사용자" : getDisplayNickname(comment)}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {formatRelativeTime(comment.commentRegDate)}
                                            </span>

                                            {/* 액션 버튼들 - 삭제된 댓글은 표시하지 않음 */}
                                            {!isCommentDeleted && (
                                                <>
                                                    {comment.userId === currentUserId || isAdmin ? (
                                                        <button
                                                            onClick={() => openCommentDeleteModal(comment._id)}
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

                                        {/* 댓글 이미지 - 삭제된 댓글은 이미지 숨김 */}
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

                                        {/* 댓글 투표 관리자 - 여기가 핵심! */}
                                        {!isCommentDeleted && (
                                            <CommentPollManager
                                                comment={comment}
                                                community={community}
                                                setCommunity={setCommunity}
                                                currentUserId={currentUserId}
                                                isAdmin={isAdmin}
                                            />
                                        )}

                                        {/* 대댓글 목록 */}
                                        {comment.replies && comment.replies.length > 0 && (
                                            <ul className="ml-4 mt-2 space-y-2 border-l pl-2">
                                                {comment.replies.map((reply) => {
                                                    // 삭제된 대댓글인지 확인
                                                    const isReplyDeleted = reply.isDeleted;

                                                    // 자식 댓글(대대댓글)이 있는지 확인
                                                    const hasActiveSubReplies = reply.subReplies && reply.subReplies.some(subReply => !subReply.isDeleted);

                                                    // 삭제된 대댓글이지만 자식 댓글이 없으면 렌더링하지 않음
                                                    if (isReplyDeleted && !hasActiveSubReplies) {
                                                        return null;
                                                    }

                                                    return (
                                                        <li key={reply._id}>
                                                            <div className="flex items-start space-x-2">
                                                                {/* 대댓글 작성자 프로필 버튼 */}
                                                                {!isReplyDeleted && !reply.isAnonymous ? (
                                                                    <ProfileButton
                                                                        profile={profileMap[reply.userId]}
                                                                        area="프로필"
                                                                    />
                                                                ) : (
                                                                    <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
                                                                )}

                                                                <div className="text-xs text-gray-500">
                                                                    <span className={`text-sm font-semibold ${
                                                                        !isReplyDeleted && reply.userId === community.userId ? 'text-gray-500' :
                                                                            isReplyDeleted ? 'text-gray-500' : ''
                                                                    }`}>
                                                                        {isReplyDeleted ? "삭제된 사용자" : getDisplayNickname(reply)}
                                                                    </span>
                                                                    <span className="ml-2 text-gray-400">
                                                                        {formatRelativeTime(reply.commentRegDate)}
                                                                    </span>

                                                                    {/* 액션 버튼들 - 삭제된 대댓글은 표시하지 않음 */}
                                                                    {!isReplyDeleted && (
                                                                        <>
                                                                            {reply.userId === currentUserId || isAdmin ? (
                                                                                <button
                                                                                    onClick={() => openReplyDeleteModal(comment._id, reply._id)}
                                                                                    className="text-red-500 text-xs ml-2 hover:underline"
                                                                                >
                                                                                    삭제
                                                                                </button>
                                                                            ) : (
                                                                                <button
                                                                                    onClick={() => handleReplyReport(reply)}
                                                                                    className="text-purple-500 text-xs ml-2 hover:underline"
                                                                                >
                                                                                    신고
                                                                                </button>
                                                                            )}
                                                                        </>
                                                                    )}

                                                                    {/* 대댓글 내용 */}
                                                                    <div id={`reply-${reply._id}`} className="text-gray-800 mt-1">
                                                                        {isReplyDeleted ? (
                                                                            <span className="text-gray-500 italic">삭제된 댓글입니다.</span>
                                                                        ) : (
                                                                            reply.commentContents
                                                                        )}
                                                                    </div>

                                                                    {/* 대댓글 이미지 - 삭제된 대댓글은 이미지 숨김 */}
                                                                    {!isReplyDeleted && reply.replyImage && (
                                                                        <div className="mt-2">
                                                                            <img
                                                                                src={
                                                                                    reply.replyImage.startsWith('http') ||
                                                                                    reply.replyImage.startsWith('data:')
                                                                                        ? reply.replyImage
                                                                                        : `${API_HOST}/uploads${reply.replyImage}`
                                                                                }
                                                                                alt="대댓글 이미지"
                                                                                className="w-32 h-auto"
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* 대대댓글 목록 */}
                                                            {reply.subReplies && reply.subReplies.filter(subReply => !subReply.isDeleted).length > 0 && (
                                                                <ul className="ml-4 mt-1 space-y-2 border-l pl-2">
                                                                    {reply.subReplies.filter(subReply => !subReply.isDeleted).map((subReply) => {
                                                                        return (
                                                                            <li key={subReply._id}>
                                                                                {/* 헤더: 프로필, 닉네임, 시간, 삭제/신고 버튼 */}
                                                                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                                                    {!subReply.isAnonymous ? (
                                                                                        <ProfileButton
                                                                                            profile={profileMap[subReply.userId]}
                                                                                            area="프로필"
                                                                                        />
                                                                                    ) : (
                                                                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
                                                                                    )}
                                                                                    <span
                                                                                        className={`text-sm font-semibold ${
                                                                                            subReply.userId === community.userId ? 'text-gray-500' : ''
                                                                                        }`}
                                                                                    >
                                                                                        {getDisplayNickname(subReply)}
                                                                                    </span>
                                                                                    <span className="ml-2 text-gray-400">
                                                                                        {formatRelativeTime(subReply.commentRegDate)}
                                                                                    </span>
                                                                                    {subReply.userId === currentUserId || isAdmin ? (
                                                                                        <button
                                                                                            onClick={() =>
                                                                                                openSubReplyDeleteModal(comment._id, reply._id, subReply._id)
                                                                                            }
                                                                                            className="text-red-500 text-xs ml-2 hover:underline"
                                                                                        >
                                                                                            삭제
                                                                                        </button>
                                                                                    ) : (
                                                                                        <button
                                                                                            onClick={() => handleSubReplyReport(subReply)}
                                                                                            className="hover:underline"
                                                                                        >
                                                                                            신고
                                                                                        </button>
                                                                                    )}
                                                                                </div>

                                                                                {/* 본문 */}
                                                                                <div id={`subReply-${subReply._id}`} className="text-gray-800 text-sm">
                                                                                    {subReply.commentContents}
                                                                                </div>

                                                                                {/* 이미지 */}
                                                                                {subReply.subReplyImage && (
                                                                                    <div className="mt-1">
                                                                                        <img
                                                                                            src={
                                                                                                subReply.subReplyImage.startsWith('http') ||
                                                                                                subReply.subReplyImage.startsWith('data:')
                                                                                                    ? subReply.subReplyImage
                                                                                                    : `${API_HOST}/uploads${subReply.subReplyImage}`
                                                                                            }
                                                                                            alt="대대댓글 이미지"
                                                                                            className="w-32 h-auto"
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                            </li>
                                                                        );
                                                                    })}
                                                                </ul>
                                                            )}

                                                            {/* 대대댓글 작성 버튼 */}
                                                            <button
                                                                onClick={() => toggleSubReplyForm(reply._id)}
                                                                className="text-blue-500 text-xs mt-1 hover:underline"
                                                            >
                                                                답글 쓰기
                                                            </button>

                                                            {/* 대대댓글 작성 폼 */}
                                                            {subReplyState[reply._id]?.open && (
                                                                <div className="mt-2 ml-4 border-l pl-2">
                                                                    {/* 대대댓글 익명 체크박스 */}
                                                                    <div className="mb-2">
                                                                        <label className="flex items-center space-x-2">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={subReplyIsAnonymous[reply._id] || false}
                                                                                onChange={(e) => setSubReplyIsAnonymous(prev => ({
                                                                                    ...prev,
                                                                                    [reply._id]: e.target.checked
                                                                                }))}
                                                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                                            />
                                                                            <span className="text-sm text-gray-700">익명으로 작성</span>
                                                                        </label>
                                                                    </div>

                                                                    <div className="border border-gray-300 rounded p-2">
                                                                        <textarea
                                                                            className="w-full border-none outline-none focus:ring-0 text-sm"
                                                                            rows={2}
                                                                            value={subReplyState[reply._id]?.text || ''}
                                                                            onChange={(e) =>
                                                                                setSubReplyState((prev) => ({
                                                                                    ...prev,
                                                                                    [reply._id]: {
                                                                                        ...prev[reply._id],
                                                                                        text: e.target.value.slice(0, 1000),
                                                                                    },
                                                                                }))
                                                                            }
                                                                            placeholder="답글을 입력하세요 (최대 1000자)"
                                                                        />
                                                                        <div className="flex items-center justify-between mt-2">
                                                                            <label className="flex items-center text-sm text-blue-600 border border-gray-300 px-2 py-1 rounded cursor-pointer">
                                                                                사진
                                                                                <input
                                                                                    type="file"
                                                                                    className="hidden"
                                                                                    accept="image/*"
                                                                                    onChange={(e) => {
                                                                                        if (e.target.files?.[0]) {
                                                                                            setSubReplyState((prev) => ({
                                                                                                ...prev,
                                                                                                [reply._id]: {
                                                                                                    ...prev[reply._id],
                                                                                                    file: e.target.files[0],
                                                                                                },
                                                                                            }));
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            </label>
                                                                            <span className="text-xs text-gray-400">
                                                                                {(subReplyState[reply._id]?.text || '').length}/1000
                                                                            </span>
                                                                        </div>
                                                                        {subReplyState[reply._id]?.file && (
                                                                            <div className="mt-2 flex items-center space-x-2">
                                                                                <span className="text-xs text-gray-600">
                                                                                    {subReplyState[reply._id]?.file.name}
                                                                                </span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        setSubReplyState((prev) => ({
                                                                                            ...prev,
                                                                                            [reply._id]: {
                                                                                                ...prev[reply._id],
                                                                                                file: null,
                                                                                            },
                                                                                        }))
                                                                                    }
                                                                                    className="text-xs text-red-500 hover:underline"
                                                                                >
                                                                                    X
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-right mt-2">
                                                                        <button
                                                                            onClick={() => handleAddSubReply(comment._id, reply._id)}
                                                                            className="bg-blue-500 text-white text-sm px-3 py-1 rounded hover:bg-blue-600 transition duration-200"
                                                                        >
                                                                            작성
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}

                                        {/* 대댓글 작성 버튼 - 삭제된 댓글은 표시하지 않음 */}
                                        {!isCommentDeleted && (
                                            <button
                                                onClick={() => toggleReplyForm(comment._id)}
                                                className="text-blue-500 text-xs mt-2 hover:underline"
                                            >
                                                답글 쓰기
                                            </button>
                                        )}

                                        {/* 대댓글 작성 폼 - 삭제된 댓글은 표시하지 않음 */}
                                        {!isCommentDeleted && state.open && (
                                            <div className="mt-2 ml-4 border-l pl-2">
                                                {/* 대댓글 익명 체크박스 */}
                                                <div className="mb-2">
                                                    <label className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={replyIsAnonymous[comment._id] || false}
                                                            onChange={(e) => setReplyIsAnonymous(prev => ({
                                                                ...prev,
                                                                [comment._id]: e.target.checked
                                                            }))}
                                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-gray-700">익명으로 작성</span>
                                                    </label>
                                                </div>

                                                <div className="border border-gray-300 rounded p-2">
                                                    <textarea
                                                        className="w-full border-none outline-none focus:ring-0 text-sm"
                                                        rows={2}
                                                        value={state.text}
                                                        onChange={(e) => handleReplyTextChange(comment._id, e.target.value)}
                                                        placeholder="대댓글을 입력하세요 (최대 1000자)"
                                                    />
                                                    <div className="flex items-center justify-between mt-2">
                                                        <label className="flex items-center text-sm text-blue-600 border border-gray-300 px-2 py-1 rounded cursor-pointer">
                                                            사진
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    if (e.target.files?.[0]) {
                                                                        handleReplyFileChange(comment._id, e.target.files[0]);
                                                                    }
                                                                }}
                                                            />
                                                        </label>
                                                        <span className="text-xs text-gray-400">
                                                            {state.text.length}/1000
                                                        </span>
                                                    </div>
                                                    {state.file && (
                                                        <div className="mt-2 flex items-center space-x-2">
                                                            <span className="text-xs text-gray-600">
                                                                {state.file.name}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setReplyState((prev) => ({
                                                                        ...prev,
                                                                        [comment._id]: {
                                                                            ...prev[comment._id],
                                                                            file: null,
                                                                        },
                                                                    }))
                                                                }
                                                                className="text-xs text-red-500 hover:underline"
                                                            >
                                                                X
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right mt-2">
                                                    <button
                                                        onClick={() => handleAddReply(comment._id)}
                                                        className="bg-blue-500 text-white text-sm px-3 py-1 rounded hover:bg-blue-600 transition duration-200"
                                                    >
                                                        작성
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-gray-600">댓글이 없습니다.</p>
                )}
            </div>

            {/* 댓글 작성 폼 */}
            <div className="mt-6">
                <h3 className="text-xl font-semibold mb-2">댓글 작성</h3>
                {commentError && <p className="text-red-500 mb-2">{commentError}</p>}

                <div className="mb-3">
                    <label className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={commentIsAnonymous}
                            onChange={(e) => setCommentIsAnonymous(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">익명으로 작성</span>
                    </label>
                </div>

                <form onSubmit={onAddComment} className="flex flex-col space-y-2">
                    <div className="border border-gray-300 rounded p-2">
                        <textarea
                            value={newComment}
                            onChange={(e) => {
                                if (e.target.value.length <= 1000) {
                                    setNewComment(e.target.value);
                                }
                            }}
                            placeholder="댓글을 입력하세요 (최대 1000자)"
                            className="w-full border-none outline-none focus:ring-0 text-sm"
                            rows={3}
                        />
                        <div className="flex items-center justify-between mt-2">
                            <label className="flex items-center text-sm text-blue-600 border border-gray-300 px-2 py-1 rounded cursor-pointer">
                                사진
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            setCommentFile(e.target.files[0]);
                                        }
                                    }}
                                />
                            </label>
                            <span className="text-xs text-gray-400">
                                {newComment.length}/1000
                            </span>
                        </div>
                        {commentFile && (
                            <div className="mt-2 flex items-center space-x-2">
                                <span className="text-xs text-gray-600">{commentFile.name}</span>
                                <button
                                    type="button"
                                    onClick={() => setCommentFile(null)}
                                    className="text-xs text-red-500 hover:underline"
                                >
                                    X
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="self-end bg-blue-500 text-white font-semibold px-4 py-2 rounded hover:bg-blue-600 transition duration-200"
                    >
                        작성
                    </button>
                </form>
            </div>
        </>
    );
};

export default CommentSection;
