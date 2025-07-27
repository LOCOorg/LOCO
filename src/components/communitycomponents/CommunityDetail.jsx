//src/components/communitycomponents/CommunityDetail.jsx
import {useEffect, useState} from 'react';
import {useParams, useNavigate, useLocation} from 'react-router-dom';
import {
    fetchCommunityById,
    deleteCommunity,
    recommendCommunity,
    addComment,
    addReply,
    addSubReply,
    deleteComment,
    deleteReply,
    deleteSubReply, fetchTopViewed, fetchTopCommented, cancelRecommendCommunity,
} from '../../api/communityApi.js';
import {getUserInfo} from '../../api/userAPI.js';
import CommonModal from '../../common/CommonModal.jsx';
import useAuthStore from '../../stores/authStore.js';
import CommunityLayout from "../../layout/CommunityLayout/CommunityLayout.jsx";
import LeftSidebar from "../../layout/CommunityLayout/LeftSidebar.jsx";
import RightSidebar from "../../layout/CommunityLayout/RightSidebar.jsx";
import ReportForm from "../reportcomponents/ReportForm.jsx";
import ProfileButton from '../../components/MyPageComponent/ProfileButton.jsx';
import { FaThumbsUp } from 'react-icons/fa'
import clsx from 'clsx'

// 상대 시간 포맷 함수
const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    if (diffSeconds < 60) {
        return `${diffSeconds}초 전`;
    } else if (diffSeconds < 3600) {
        const minutes = Math.floor(diffSeconds / 60);
        return `${minutes}분 전`;
    } else if (diffSeconds < 86400) {
        const hours = Math.floor(diffSeconds / 3600);
        return `${hours}시간 전`;
    } else {
        const days = Math.floor(diffSeconds / 86400);
        return `${days}일 전`;
    }
};

const CommunityDetail = () => {
    const {id} = useParams();
    const navigate = useNavigate();

    const [isRecommended, setIsRecommended] = useState(false)

    const [postProfile, setPostProfile] = useState(null);
    const [profileMap, setProfileMap] = useState({});

    // 커뮤니티 데이터 및 로딩, 에러 상태
    const [community, setCommunity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 현재 사용자
    const currentUser = useAuthStore((state) => state.user);
    const currentUserId = currentUser?._id;
    const isAdmin = currentUser?.userLv >= 2;   // 🔑 Lv 2 이상 여부

    // 모달 상태 (게시글 삭제, 추천)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [recommendModalOpen, setRecommendModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalContent, setModalContent] = useState('');

    // 삭제 확인 모달 상태 및 대상 정보
    const [commentDeleteModalOpen, setCommentDeleteModalOpen] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState(null);

    const [replyDeleteModalOpen, setReplyDeleteModalOpen] = useState(false);
    const [replyToDelete, setReplyToDelete] = useState({commentId: null, replyId: null});

    const [subReplyDeleteModalOpen, setSubReplyDeleteModalOpen] = useState(false);
    const [subReplyToDelete, setSubReplyToDelete] = useState({commentId: null, replyId: null, subReplyId: null});

    // 댓글 및 답글 작성 상태
    const [newComment, setNewComment] = useState('');
    const [commentFile, setCommentFile] = useState(null);
    const [commentError, setCommentError] = useState('');
    const [replyState, setReplyState] = useState({});
    const [subReplyState, setSubReplyState] = useState({});

    // 사용자 정보 맵
    const [userMap, setUserMap] = useState({});

    // Detail 페이지에서도 사이드바 기능을 위해 필요한 상태 추가
    const [selectedCategory, setSelectedCategory] = useState('전체');
    const handleCategoryClick = (category) => setSelectedCategory(category);

    const [sideTab, setSideTab] = useState('viewed');
    const [topViewed, setTopViewed] = useState([]);
    const [topCommented, setTopCommented] = useState([]);

    // 신고 모달 상태 및 신고 대상
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportTarget, setReportTarget] = useState({ nickname:'', anchor:null });

    useEffect(() => {
        if (community && community.userId) {
            getUserInfo(community.userId)
                .then((data) => setPostProfile(data))
                .catch((error) => console.error("프로필 불러오기 실패", error));
        }
    }, [community]);

    useEffect(() => {
        const fetchUserProfiles = async () => {
            if (!community) return;
            const userIds = new Set();
            userIds.add(community.userId);
            if (community.comments) {
                community.comments.forEach((comment) => {
                    userIds.add(comment.userId);
                    if (comment.replies) {
                        comment.replies.forEach((reply) => {
                            userIds.add(reply.userId);
                            if (reply.subReplies) {
                                reply.subReplies.forEach((subReply) => userIds.add(subReply.userId));
                            }
                        });
                    }
                });
            }
            const newProfileMap = {};
            await Promise.all(
                Array.from(userIds).map(async (uid) => {
                    try {
                        const userInfo = await getUserInfo(uid);
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


    // 커뮤니티 데이터 로드
    useEffect(() => {
        const loadCommunity = async () => {
            try {
                const data = await fetchCommunityById(id);
                setCommunity(data);
            } catch (err) {
                setError('게시글을 불러오는 데 실패했습니다.');
                console.log(err);
            } finally {
                setLoading(false);
            }
        };
        loadCommunity();
    }, [id]);

    // 작성자 및 댓글/답글 작성자 닉네임 로드
    useEffect(() => {
        const fetchUserNames = async () => {
            if (!community) return;
            const userIds = new Set();
            userIds.add(community.userId);
            if (community.comments) {
                community.comments.forEach((cmt) => {
                    userIds.add(cmt.userId);
                    if (cmt.replies) {
                        cmt.replies.forEach((r) => {
                            userIds.add(r.userId);
                            if (r.subReplies) {
                                r.subReplies.forEach((sr) => userIds.add(sr.userId));
                            }
                        });
                    }
                });
            }
            const newUserMap = {...userMap};
            const promises = Array.from(userIds).map(async (uid) => {
                if (!newUserMap[uid]) {
                    try {
                        const userInfo = await getUserInfo(uid);
                        newUserMap[uid] = userInfo.nickname || userInfo.name || uid;
                    } catch (error) {
                        newUserMap[uid] = uid;
                        console.log(error);
                    }
                }
            });
            await Promise.all(promises);
            setUserMap(newUserMap);
        };
        fetchUserNames();
    }, [community]);

    // 1) 커뮤니티 데이터 로드 후, 내가 추천했는지 초기 상태 설정
    useEffect(() => {
        if (community && community.recommendedUsers) {
            setIsRecommended(community.recommendedUsers.includes(currentUserId))
        }
    }, [community, currentUserId])

    // 2) 클릭 시 추천·추천취소 API 호출 및 토글
    const handleToggleRecommend = async () => {
        if (!community) return;

        // 1) 화면을 즉시 반영
        const updatedRecommendedUsers = isRecommended
            ? community.recommendedUsers.filter(uid => uid !== currentUserId) // 취소
            : [...community.recommendedUsers, currentUserId];                 // 추천

        setCommunity({ ...community, recommendedUsers: updatedRecommendedUsers });
        setIsRecommended(!isRecommended);

        try {
            // 2) API 호출
            if (isRecommended) {
                await cancelRecommendCommunity(community._id, currentUserId);
            } else {
                await recommendCommunity(community._id, currentUserId);
            }
        } catch (err) {
            console.error('추천 처리 에러', err);

            // 3) 실패 시 롤백
            setCommunity(community);            // 이전 값으로 되돌림
            setIsRecommended(isRecommended);    // 이전 값으로 되돌림
        }
    };


    // 커뮤니티 삭제 (게시글 자체)
    const handleDelete = () => {
        setModalTitle('삭제 확인');
        setModalContent('정말 삭제하시겠습니까?');
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirmed = async () => {
        try {
            await deleteCommunity(community._id);
            setDeleteModalOpen(false);
            navigate('/community');
        } catch (err) {
            setDeleteModalOpen(false);
            setModalTitle('삭제 실패');
            setModalContent('게시글 삭제에 실패했습니다.');
            setRecommendModalOpen(true);
            console.log(err);
        }
    };

    // 댓글 작성
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) {
            setCommentError('댓글 내용을 입력해주세요.');
            return;
        }
        try {
            const formData = new FormData();
            formData.append('userId', currentUserId);
            formData.append('commentContents', newComment.trim());
            if (commentFile) {
                formData.append('commentImage', commentFile);
            }
            const updated = await addComment(community._id, formData);
            setCommunity(updated);
            setNewComment('');
            setCommentFile(null);
            setCommentError('');
        } catch (err) {
            setCommentError('댓글 작성에 실패했습니다.');
            console.log(err);
        }
    };

    // 대댓글 작성
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
            [commentId]: {
                ...prev[commentId],
                text,
            },
        }));
    };

    const handleReplyFileChange = (commentId, file) => {
        setReplyState((prev) => ({
            ...prev,
            [commentId]: {
                ...prev[commentId],
                file,
            },
        }));
    };

    const handleAddReply = async (commentId) => {
        const state = replyState[commentId] || {text: '', file: null};
        const text = state.text.trim();
        if (!text) return;
        try {
            const formData = new FormData();
            formData.append('userId', currentUserId);
            formData.append('commentContents', text);
            if (state.file) {
                formData.append('replyImage', state.file);
            }
            const updated = await addReply(community._id, commentId, formData);
            setCommunity(updated);
            setReplyState((prev) => ({
                ...prev,
                [commentId]: {open: false, text: '', file: null},
            }));
        } catch (err) {
            console.log(err);
        }
    };

    // 대대댓글 작성
    const toggleSubReplyForm = (replyId, mentionNickname = '') => {
        setSubReplyState((prev) => ({
            ...prev,
            [replyId]: {
                open: !prev[replyId]?.open,
                text: !prev[replyId]?.open ? `@${mentionNickname} ` : '',
                file: null,
            },
        }));
    };

    const handleAddSubReply = async (commentId, replyId) => {
        const state = subReplyState[replyId] || {text: '', file: null};
        const text = state.text.trim();
        if (!text) return;
        try {
            const formData = new FormData();
            formData.append('userId', currentUserId);
            formData.append('commentContents', text);
            if (state.file) {
                formData.append('subReplyImage', state.file);
            }
            const updated = await addSubReply(community._id, commentId, replyId, formData);
            setCommunity(updated);
            setSubReplyState((prev) => ({
                ...prev,
                [replyId]: {open: false, text: '', file: null},
            }));
        } catch (err) {
            console.log(err);
        }
    };

    // 댓글 삭제 모달 관련 함수
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

    // 대댓글 삭제 모달 관련 함수
    const openReplyDeleteModal = (commentId, replyId) => {
        setReplyToDelete({commentId, replyId});
        setReplyDeleteModalOpen(true);
    };

    const confirmDeleteReply = async () => {
        try {
            const updated = await deleteReply(community._id, replyToDelete.commentId, replyToDelete.replyId);
            setCommunity(updated);
            setReplyDeleteModalOpen(false);
            setReplyToDelete({commentId: null, replyId: null});
        } catch (err) {
            console.log(err);
            setReplyDeleteModalOpen(false);
        }
    };

    // 대대댓글 삭제 모달 관련 함수
    const openSubReplyDeleteModal = (commentId, replyId, subReplyId) => {
        setSubReplyToDelete({commentId, replyId, subReplyId});
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
            setSubReplyToDelete({commentId: null, replyId: null, subReplyId: null});
        } catch (err) {
            console.log(err);
            setSubReplyDeleteModalOpen(false);
        }
    };

    // 예시: API 호출로 최다 조회, 최다 댓글 데이터 fetch
    useEffect(() => {
        const fetchGlobalTop = async () => {
            try {
                const viewedData = await fetchTopViewed(); // 커뮤니티 리스트와 동일 API
                setTopViewed(viewedData);
            } catch (error) {
                setTopViewed([]);
                console.log(error);
            }
            try {
                const commentedData = await fetchTopCommented();
                setTopCommented(commentedData);
            } catch (error) {
                setTopCommented([]);
                console.log(error);
            }
        };
        fetchGlobalTop();
    }, []);

    // 게시글 신고 핸들러
    const handlePostReport = () => {
        // 게시글 신고 시 신고 대상은 게시글 작성자
        setReportTarget({
            nickname : userMap[community.userId] || community.userId,
            anchor   : { type:'post', parentId: community._id, targetId: community._id }
        });
        setReportModalOpen(true);
    };

    // 댓글 신고 핸들러
    const handleCommentReport = (comment) => {
        // 댓글 신고 시 신고 대상은 댓글 작성자
        setReportTarget({
            nickname : userMap[comment.userId] || comment.userId,
            anchor   : { type:'comment', parentId: community._id, targetId: comment._id }
        });
        setReportModalOpen(true);
    };

    // 대댓글 신고 핸들러
    const handleReplyReport = (reply) => {
        setReportTarget({
            nickname : userMap[reply.userId] || reply.userId,
            anchor   : { type:'reply', parentId: community._id, targetId: reply._id }
        });
        setReportModalOpen(true);
    };

    // 대대댓글 신고 핸들러
    const handleSubReplyReport = (subReply) => {
        setReportTarget({
            nickname : userMap[subReply.userId] || subReply.userId,
            anchor   : { type:'subReply', parentId: community._id, targetId: subReply._id }
        });
        setReportModalOpen(true);
    };


    const handleCategoryNav = (category) => {
        navigate(`/community?category=${category}`);
    };

    const { hash } = useLocation();
    useEffect(() => {
        if (!hash) return;                       // e.g. #comment-64fd…
        const el = document.getElementById(hash.slice(1));
        if (el) {
            el.scrollIntoView({ behavior:'smooth', block:'center' });
            el.classList.add('highlight');
            setTimeout(() => el.classList.remove('highlight'), 3000);
        }
    }, [hash, community]);                      // community 렌더 완료 후 실행


    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen text-gray-700">
                로딩중...
            </div>
        );
    }
    if (error) {
        return <div className="text-red-500 text-center mt-4">{error}</div>;
    }
    if (!community) {
        return (
            <div className="text-gray-700 text-center mt-4">
                게시글을 찾을 수 없습니다.
            </div>
        );
    }

    const postWriterNickname = userMap[community.userId] || community.userId;

    return (
        <CommunityLayout
            leftSidebar={
                <LeftSidebar
                    selectedCategory={selectedCategory}
                    handleCategoryClick={handleCategoryNav}
                />
            }
            rightSidebar={
                <RightSidebar
                    sideTab={sideTab}
                    setSideTab={setSideTab}
                    topViewed={topViewed}
                    topCommented={topCommented}
                />
            }
        >
            <div className="container mx-auto p-6">
                {/* 게시글 삭제 확인 모달 */}
                <CommonModal
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    title="삭제 확인"
                    onConfirm={handleDeleteConfirmed}
                >
                    {modalContent}
                </CommonModal>
                {/* 댓글 삭제 확인 모달 */}
                <CommonModal
                    isOpen={commentDeleteModalOpen}
                    onClose={() => setCommentDeleteModalOpen(false)}
                    title="댓글 삭제 확인"
                    onConfirm={confirmDeleteComment}
                >
                    댓글을 삭제하시겠습니까?
                </CommonModal>
                {/* 대댓글 삭제 확인 모달 */}
                <CommonModal
                    isOpen={replyDeleteModalOpen}
                    onClose={() => setReplyDeleteModalOpen(false)}
                    title="대댓글 삭제 확인"
                    onConfirm={confirmDeleteReply}
                >
                    대댓글을 삭제하시겠습니까?
                </CommonModal>
                {/* 대대댓글 삭제 확인 모달 */}
                <CommonModal
                    isOpen={subReplyDeleteModalOpen}
                    onClose={() => setSubReplyDeleteModalOpen(false)}
                    title="답글 삭제 확인"
                    onConfirm={confirmDeleteSubReply}
                >
                    답글을 삭제하시겠습니까?
                </CommonModal>

                {/* 신고 모달 (커스텀 오버레이 사용) */}
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
                                anchor={reportTarget.anchor}          // 🔑 추가
                                defaultArea="커뮤니티"
                            />
                        </div>
                    </div>
                )}


                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-3xl font-bold mb-2">{community.communityTitle}</h1>
                    <div className="text-sm text-gray-600 mb-4 space-x-2">
          <span>
              <ProfileButton profile={postProfile} area="커뮤니티"
                             anchor={{               // 🔑 추가
                                 type: 'post',
                                 parentId: community._id,
                                 targetId: community._id,
                             }}/>
            작성자:{' '}
              <span className="font-semibold text-red-500">{postWriterNickname}</span>
          </span>
                        <span>
            카테고리:{' '}
                            <span className="font-semibold">{community.communityCategory}</span>
          </span>
                        <span>
            작성일:{' '}
                            <span className="font-medium">
              {formatRelativeTime(community.communityRegDate)}
            </span>
          </span>
                        <span>
            조회수:{' '}
                            <span className="font-medium">{community.communityViews}</span>
          </span>
                        <span>
            추천:{' '}
                            <span className="font-medium">{community.recommendedUsers.length}</span>
          </span>
                    </div>
                    {community.communityImage && (
                        <img
                            src={
                                community.communityImage.startsWith('http') ||
                                community.communityImage.startsWith('data:')
                                    ? community.communityImage
                                    : `${import.meta.env.VITE_API_HOST}${community.communityImage}`
                            }
                            alt="커뮤니티 이미지"
                            className="w-full h-auto mb-4"
                        />
                    )}
                    <p className="text-gray-800 mb-4" id={`post-${community._id}`}>{community.communityContents}</p>
                    <div className="mt-4 flex items-center gap-2">
                            <button
                                onClick={handleToggleRecommend}
                                aria-label="추천하기"
                                className={clsx(
                                    'w-10 h-10 rounded-full border flex items-center justify-center transition-colors',
                                    {
                                        'bg-blue-500 border-blue-500 text-white': isRecommended,
                                        'bg-transparent border-gray-300 text-gray-500 hover:bg-gray-100': !isRecommended,
                                    }
                                )}
                            >
                                <FaThumbsUp size={20} />
                            </button>

                        {community.userId !== currentUserId && (
                            <button
                                onClick={handlePostReport}
                                type="button"
                                className="
                                      p-0 m-0
                                      bg-transparent border-none shadow-none
                                      text-sm font-medium text-gray-500
                                      hover:text-rose-600 hover:underline
                                      focus:outline-none focus:underline
                                      cursor-pointer
                                    "
                            >
                                신고
                            </button>
                        )}
                    </div>
                    <div className="mt-6">
                        <h3 className="text-xl font-semibold mb-3">댓글</h3>
                        {community.comments && community.comments.length > 0 ? (
                            <ul className="space-y-3">
                                {community.comments.map((comment) => {
                                    const state = replyState[comment._id] || {open: false, text: '', file: null};
                                    const nickname = userMap[comment.userId] || comment.userId;
                                    return (
                                        <li
                                            key={comment._id}
                                            className="flex space-x-3 p-3 border border-gray-200 rounded hover:bg-gray-50 transition duration-200"
                                        >
                                            <ProfileButton profile={profileMap[comment.userId]} area="커뮤니티"
                                                           anchor={{
                                                               type: 'comment',
                                                               parentId: community._id,
                                                               targetId: comment._id,
                                                           }}/>

                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                        <span
                            className={`text-sm font-semibold ${comment.userId === community.userId ? 'text-red-500' : ''}`}>
                          {nickname}
                        </span>
                                                    <span className="text-xs text-gray-500">
                          {formatRelativeTime(comment.commentRegDate)}
                        </span>
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
                                                </div>
                                                <p className="text-gray-800" id={`comment-${comment._id}`}>{comment.commentContents}</p>
                                                {comment.commentImage && (
                                                    <img
                                                        src={
                                                            comment.commentImage.startsWith('http') ||
                                                            comment.commentImage.startsWith('data:')
                                                                ? comment.commentImage
                                                                : `${import.meta.env.VITE_API_HOST}${comment.commentImage}`
                                                        }
                                                        alt="댓글 이미지"
                                                        className="w-32 h-auto mt-2"
                                                    />
                                                )}
                                                {comment.replies && comment.replies.length > 0 && (
                                                    <ul className="ml-4 mt-2 space-y-2 border-l pl-2">
                                                        {comment.replies.map((reply) => {
                                                            const replyNickname = userMap[reply.userId] || reply.userId;
                                                            return (
                                                                <li key={reply._id}>
                                                                    <div className="flex items-start space-x-2">
                                                                        {/* 대댓글 작성자 프로필 버튼 */}
                                                                        <ProfileButton
                                                                            profile={profileMap[reply.userId]} area="커뮤니티"
                                                                            anchor={{
                                                                                type: 'reply',
                                                                                parentId: community._id,
                                                                                targetId: reply._id,
                                                                            }}/>
                                                                        <div className="text-xs text-gray-500">
                                    <span
                                        className={`text-sm font-semibold ${reply.userId === community.userId ? 'text-red-500' : ''}`}>
                                      {replyNickname}
                                    </span>
                                                                            <span className="ml-2 text-gray-400">
                                      {formatRelativeTime(reply.commentRegDate)}
                                    </span>
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
                                                                            <div id={`reply-${reply._id}`} className="text-gray-800 mt-1">
                                                                                {reply.commentContents}
                                                                            </div>
                                                                            {reply.replyImage && (
                                                                                <div className="mt-2">
                                                                                    <img
                                                                                        src={
                                                                                            reply.replyImage.startsWith('http') ||
                                                                                            reply.replyImage.startsWith('data:')
                                                                                                ? reply.replyImage
                                                                                                : `${import.meta.env.VITE_API_HOST}${reply.replyImage}`
                                                                                        }
                                                                                        alt="대댓글 이미지"
                                                                                        className="w-full h-auto"
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {reply.subReplies && reply.subReplies.length > 0 && (
                                                                        <ul className="ml-4 mt-1 space-y-2 border-l pl-2">
                                                                            {reply.subReplies.map((subReply) => {
                                                                                const subReplyNickname = userMap[subReply.userId] || subReply.userId;
                                                                                return (
                                                                                    <li key={subReply._id}>
                                                                                        {/* — 헤더: 프로필, 닉네임, 시간, 삭제/신고 버튼 */}
                                                                                        <div
                                                                                            className="flex items-center space-x-2 text-xs text-gray-500">
                                                                                            <ProfileButton
                                                                                                profile={profileMap[subReply.userId]} area="커뮤니티"
                                                                                                anchor={{
                                                                                                    type: 'subReply',
                                                                                                    parentId: community._id,
                                                                                                    targetId: subReply._id,
                                                                                                }}/>
                                                                                            <span
                                                                                                className={`text-sm font-semibold ${
                                                                                                    subReply.userId === community.userId ? 'text-red-500' : ''
                                                                                                }`}
                                                                                            >{subReplyNickname} </span>
                                                                                            <span
                                                                                                className="ml-2 text-gray-400">{formatRelativeTime(subReply.commentRegDate)}</span>
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

                                                                                        {/* — 본문 */}
                                                                                        <div
                                                                                            id={`subReply-${subReply._id}`} className="text-gray-800 text-sm">
                                                                                            {subReply.commentContents}
                                                                                        </div>

                                                                                        {/* — 이미지 */}
                                                                                        {subReply.subReplyImage && (
                                                                                            <div className="mt-1">
                                                                                                <img
                                                                                                    src={
                                                                                                        subReply.subReplyImage.startsWith('http') ||
                                                                                                        subReply.subReplyImage.startsWith('data:')
                                                                                                            ? subReply.subReplyImage
                                                                                                            : `${import.meta.env.VITE_API_HOST}${subReply.subReplyImage}`
                                                                                                    }
                                                                                                    alt="대대댓글 이미지"
                                                                                                    className="w-20 h-auto"
                                                                                                />
                                                                                            </div>
                                                                                        )}
                                                                                    </li>
                                                                                );
                                                                            })}
                                                                        </ul>
                                                                    )}

                                                                    <button
                                                                        onClick={() => toggleSubReplyForm(reply._id, replyNickname)}
                                                                        className="text-blue-500 text-xs mt-1 hover:underline"
                                                                    >
                                                                        답글 쓰기
                                                                    </button>
                                                                    {subReplyState[reply._id]?.open && (
                                                                        <div className="mt-2 ml-4 border-l pl-2">
                                                                            {/* 대대댓글 작성 폼 */}
                                                                            <div
                                                                                className="border border-gray-300 rounded p-2">
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
                                                                                <div
                                                                                    className="flex items-center justify-between mt-2">
                                                                                    <label
                                                                                        className="flex items-center text-sm text-blue-600 border border-gray-300 px-2 py-1 rounded cursor-pointer">
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
                                                                                    <span
                                                                                        className="text-xs text-gray-400">
                                          {(subReplyState[reply._id]?.text || '').length}/1000
                                        </span>
                                                                                </div>
                                                                                {subReplyState[reply._id]?.file && (
                                                                                    <div
                                                                                        className="mt-2 flex items-center space-x-2">
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
                                                <button
                                                    onClick={() => toggleReplyForm(comment._id)}
                                                    className="text-blue-500 text-xs mt-2 hover:underline"
                                                >
                                                    답글 쓰기
                                                </button>
                                                {state.open && (
                                                    <div className="mt-2 ml-4 border-l pl-2">
                                                        {/* 대댓글 작성 폼 */}
                                                        <div className="border border-gray-300 rounded p-2">
                            <textarea
                                className="w-full border-none outline-none focus:ring-0 text-sm"
                                rows={2}
                                value={state.text}
                                onChange={(e) => handleReplyTextChange(comment._id, e.target.value)}
                                placeholder="대댓글을 입력하세요 (최대 1000자)"
                            />
                                                            <div className="flex items-center justify-between mt-2">
                                                                <label
                                                                    className="flex items-center text-sm text-blue-600 border border-gray-300 px-2 py-1 rounded cursor-pointer">
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
                    <div className="mt-6">
                        <h3 className="text-xl font-semibold mb-2">댓글 작성</h3>
                        {commentError && <p className="text-red-500 mb-2">{commentError}</p>}
                        <form onSubmit={handleAddComment} className="flex flex-col space-y-2">
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
                                    <label
                                        className="flex items-center text-sm text-blue-600 border border-gray-300 px-2 py-1 rounded cursor-pointer">
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
                  <span className="text-xs text-gray-600">
                    {commentFile.name}
                  </span>
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

                    {(community.userId === currentUserId || isAdmin) && (
                        <div className="mt-6 flex space-x-4">
                            <button
                                onClick={() => navigate(`/community/edit/${community._id}`)}
                                className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 transition duration-200"
                            >
                                수정
                            </button>
                            <button
                                onClick={handleDelete}
                                className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition duration-200"
                            >
                                삭제
                            </button>
                        </div>
                    )}
                    <div className="mt-6">
                        <button
                            onClick={() => navigate('/community')}
                            className="inline-block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200"
                        >
                            목록으로
                        </button>
                    </div>
                </div>
            </div>
        </CommunityLayout>
    );
};

export default CommunityDetail;
