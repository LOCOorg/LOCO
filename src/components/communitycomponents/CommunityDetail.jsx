import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    fetchCommunityById,
    fetchCommentsByPostId,
    deleteCommunity,
    recommendCommunity,
    addComment,
    fetchTopViewed,
    fetchTopCommented,
    cancelRecommendCommunity
} from '../../api/communityApi.js';
import CommonModal from '../../common/CommonModal.jsx';
import useAuthStore from '../../stores/authStore.js';
import CommunityLayout from "../../layout/CommunityLayout/CommunityLayout.jsx";
import LeftSidebar from "../../layout/CommunityLayout/LeftSidebar.jsx";
import RightSidebar from "../../layout/CommunityLayout/RightSidebar.jsx";
import ReportForm from "../reportcomponents/ReportForm.jsx";
import CommentSection from './CommentSection.jsx'; // 새로 분리할 컴포넌트
import PollManager from "./PollManager.jsx";
import PostHeader from "./PostHeader.jsx";
import PostBody from "./PostBody.jsx";
import PostActions from "./PostActions.jsx";

// 유틸리티 함수
const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}초 전`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}분 전`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}시간 전`;
    return `${Math.floor(diffSeconds / 86400)}일 전`;
};

const CommunityDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hash } = useLocation();

    // 현재 사용자 정보
    const currentUser = useAuthStore((state) => state.user);
    const currentUserId = currentUser?._id;
    const isAdmin = currentUser?.userLv >= 2;
    const API_HOST = import.meta.env.VITE_API_HOST;

    const [comments, setComments] = useState([]);
    const [commentsPage, setCommentsPage] = useState(1);
    const [hasMoreComments, setHasMoreComments] = useState(false);

    // 커뮤니티 관련 상태
    const [community, setCommunity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isRecommended, setIsRecommended] = useState(false);

    // 프로필 관련 상태
    const [postProfile, setPostProfile] = useState(null);


    // 모달 상태
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalContent, setModalContent] = useState('');
    const [reportTarget, setReportTarget] = useState({ nickname: '', anchor: null });

    // 댓글 작성 관련 상태
    const [newComment, setNewComment] = useState('');
    const [commentFile, setCommentFile] = useState(null);
    const [commentError, setCommentError] = useState('');
    const [commentIsAnonymous, setCommentIsAnonymous] = useState(false);

    // 사이드바 관련 상태
    const [selectedCategory, setSelectedCategory] = useState('전체');
    const [sideTab, setSideTab] = useState('viewed');
    const [topViewed, setTopViewed] = useState([]);
    const [topCommented, setTopCommented] = useState([]);

    // 닉네임 표시 함수
    const getDisplayNickname = (item) => {
        if (item.isAnonymous) return '익명';
        return item.userNickname || item.userId; // ✅ userNickname 사용
    };

    // 데이터 로딩 Effects
    useEffect(() => {
        const loadCommunity = async () => {
            try {
                const data = await fetchCommunityById(id);
                setCommunity(data);
                const commentsData = await fetchCommentsByPostId(id, 1, 20); // Fetch first page
                setComments(commentsData.comments);
                setHasMoreComments(commentsData.currentPage < commentsData.totalPages);
            } catch (err) {
                setError('게시글을 불러오는 데 실패했습니다.');
                console.log(err);
            }
            finally {
                setLoading(false);
            }
        };
        loadCommunity();
    }, [id]);

    useEffect(() => {
        const fetchGlobalTop = async () => {
            try {
                const [viewedData, commentedData] = await Promise.all([
                    fetchTopViewed(),
                    fetchTopCommented()
                ]);
                setTopViewed(viewedData);
                setTopCommented(commentedData);
            } catch (error) {
                console.log(error);
                setTopViewed([]);
                setTopCommented([]);
            }
        };
        fetchGlobalTop();
    }, []);


    // 추천 관련 Effects
    useEffect(() => {
        if (community?.recommendedUsers) {
            setIsRecommended(community.recommendedUsers.includes(currentUserId));
        }
    }, [community, currentUserId]);

    // 해시 스크롤 Effect
    useEffect(() => {
        if (!hash) return;
        const el = document.getElementById(hash.slice(1));
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('highlight');
            setTimeout(() => el.classList.remove('highlight'), 3000);
        }
    }, [hash, community]);

    const loadMoreComments = async () => {
        const nextPage = commentsPage + 1;
        try {
            const newCommentsData = await fetchCommentsByPostId(id, nextPage, 20);
            setComments(prevComments => [...prevComments, ...newCommentsData.comments]);
            setCommentsPage(nextPage);
            setHasMoreComments(newCommentsData.currentPage < newCommentsData.totalPages);
        } catch (error) {
            console.error('Failed to load more comments:', error);
        }
    };

    // 추천 관련 함수
    const handleToggleRecommend = async () => {
        if (!community) return;

        const updatedRecommendedUsers = isRecommended
            ? community.recommendedUsers.filter(uid => uid !== currentUserId)
            : [...community.recommendedUsers, currentUserId];

        setCommunity({ ...community, recommendedUsers: updatedRecommendedUsers });
        setIsRecommended(!isRecommended);

        try {
            if (isRecommended) {
                await cancelRecommendCommunity(community._id, currentUserId);
            } else {
                await recommendCommunity(community._id, currentUserId);
            }
        } catch (err) {
            console.error('추천 처리 에러', err);
            setCommunity(community);
            setIsRecommended(isRecommended);
        }
    };

    // 게시글 삭제 관련 함수
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
            console.log(err);
        }
    };

    // 댓글 작성 관련 함수
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
            formData.append('isAnonymous', commentIsAnonymous);
            if (commentFile) formData.append('commentImage', commentFile);

            const newCommentData = await addComment(community._id, formData);
            setComments([newCommentData, ...comments]);
            setNewComment('');
            setCommentFile(null);
            setCommentError('');
            setCommentIsAnonymous(false);
        } catch (err) {
            setCommentError('댓글 작성에 실패했습니다.');
            console.log(err);
        }
    };

    // 신고 관련 함수
    const handlePostReport = () => {
        setReportTarget({
            nickname: getDisplayNickname(community),
            anchor: { type: 'post', parentId: community._id, targetId: community._id }
        });
        setReportModalOpen(true);
    };

    // 기타 핸들러
    const handleCategoryNav = (category) => navigate(`/community?category=${category}`);

    // 로딩 및 에러 상태 처리
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
            <div className="container mx-auto p-4 md:p-6">
                {/* 모달들 */}
                <CommonModal
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    title="삭제 확인"
                    onConfirm={handleDeleteConfirmed}
                >
                    {modalContent}
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

                {/* 메인 콘텐츠 */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <PostHeader
                        community={community}
                        postProfile={postProfile}
                        getDisplayNickname={getDisplayNickname}
                        formatRelativeTime={formatRelativeTime}
                    />

                    <PostBody community={community} API_HOST={API_HOST} />

                    <PostActions
                        community={community}
                        isRecommended={isRecommended}
                        onToggleRecommend={handleToggleRecommend}
                        onReport={handlePostReport}
                        onDelete={handleDelete}
                        currentUserId={currentUserId}
                        isAdmin={isAdmin}
                    />

                    {/* 투표 관리자 컴포넌트 */}
                    <PollManager
                        community={community}
                        setCommunity={setCommunity}
                        currentUserId={currentUserId}
                        isAdmin={isAdmin}
                    />

                    {/* 댓글 섹션 - 별도 컴포넌트로 분리 */}
                    <CommentSection
                        community={community}
                        comments={comments}
                        setComments={setComments}
                        currentUserId={currentUserId}
                        isAdmin={isAdmin}
                        setCommunity={setCommunity}
                        getDisplayNickname={getDisplayNickname}
                        formatRelativeTime={formatRelativeTime}
                        newComment={newComment}
                        setNewComment={setNewComment}
                        commentFile={commentFile}
                        setCommentFile={setCommentFile}
                        commentError={commentError}
                        setCommentError={setCommentError}
                        commentIsAnonymous={commentIsAnonymous}
                        setCommentIsAnonymous={setCommentIsAnonymous}
                        onAddComment={handleAddComment}
                        loadMoreComments={loadMoreComments}
                        hasMoreComments={hasMoreComments}
                    />

                    {/* 목록으로 버튼 */}
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
