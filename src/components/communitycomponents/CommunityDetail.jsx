import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDeleteCommunity, useCommunity, useComments, useRecommendCommunity, useAddComment} from '../../hooks/queries/useCommunityQueries';
import { useQueryClient } from '@tanstack/react-query';
import useSidebarData from '../../hooks/useSidebarData.js';
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

    // const [comments, setComments] = useState([]);
    // const [commentsPage, setCommentsPage] = useState(1);
    // const [hasMoreComments, setHasMoreComments] = useState(false);

    // 프로필 관련 상태
    const [postProfile, setPostProfile] = useState(null);
    const [isRecommended, setIsRecommended] = useState(false);
    const [isRecommending, setIsRecommending] = useState(false); // ✅ 추천 로딩 상태
    
    // ✅ 댓글 수 로컬 관리 (파생 상태)
    const [localCommentCount, setLocalCommentCount] = useState(0);


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
    
    //  사이드바 데이터 Hook
    const { sideTab, setSideTab, topViewed, topCommented } = useSidebarData();

    //  게시글 상세 Query Hook
    const {
        data: community,
        isLoading: loading,
        error,
    } = useCommunity(id);

    //  댓글 목록 Query Hook (무한 스크롤)
    const {
        data: commentsData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: commentsLoading,
    } = useComments(id);

    //  queryClient 선언
    const queryClient = useQueryClient();

    //  게시글 삭제 Mutation Hook
    const deleteMutation = useDeleteCommunity();

    // 추천 Mutation Hook
    const recommendMutation = useRecommendCommunity();

    // 댓글 작성 Mutation Hook
    const addCommentMutation = useAddComment();

    //  댓글 배열 추출
    const comments = commentsData?.pages.flatMap(page => page.comments) || [];

    // 닉네임 표시 함수
    const getDisplayNickname = (item) => {
        if (item.isAnonymous) return '익명';

        // userNickname이 있으면 사용
        if (item.userNickname) return item.userNickname;

        // userId가 객체(populated)인 경우 처리
        if (typeof item.userId === 'object' && item.userId !== null) {
            return item.userId.nickname || '알 수 없음';
        }

        return item.userId || '알 수 없음';
    };

    // // ✅ 댓글 로드 (useEffect 유지 - 나중에 useComments Hook으로 이동 예정)
    // useEffect(() => {
    //     const loadComments = async () => {
    //         if (!id) return;
    //         try {
    //             const commentsData = await fetchCommentsByPostId(id, 1, 20);
    //             setComments(commentsData.comments);
    //             setHasMoreComments(commentsData.currentPage < commentsData.totalPages);
    //         } catch (err) {
    //             console.error('댓글 로드 실패:', err);
    //         }
    //     };
    //     loadComments();
    // }, [id]);
    
    // ✅ 초기 commentCount 동기화
    useEffect(() => {
        if (community?.commentCount !== undefined) {
            setLocalCommentCount(community.commentCount);
        }
    }, [community?.commentCount]);


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

    const loadMoreComments = () => {
        if (hasNextPage) {
            fetchNextPage();
        }
    };

    // ✅ 추천 관련 함수 (내곤적 업데이트 - 나중에 Mutation으로 개선 예정)
    const handleToggleRecommend = async () => {
        if (!community) return;

        recommendMutation.mutate({
            postId: community._id,
            userId: currentUserId,
            isRecommend: !isRecommended,
        });
    };

    // 게시글 삭제 관련 함수
    const handleDelete = () => {
        setModalTitle('삭제 확인');
        setModalContent('정말 삭제하시겠습니까?');
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirmed = async () => {
        try {
            await deleteMutation.mutateAsync(community._id);
            //  이 시점에 자동으로 인기글 캐시 무효화 완료!
            setDeleteModalOpen(false);
            navigate('/community');
        } catch (err) {
            setDeleteModalOpen(false);
            setModalTitle('삭제 실패');
            setModalContent('게시글 삭제에 실패했습니다.');
            console.log(err);
        }
    };

    // ✅ 댓글 작성 관련 함수
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) {
            setCommentError('댓글 내용을 입력해주세요.');
            return;
        }

            // FormData 생성
            const formData = new FormData();
            formData.append('userId', currentUserId);
            formData.append('commentContents', newComment.trim());
            formData.append('isAnonymous', commentIsAnonymous);
            if (commentFile) formData.append('commentImage', commentFile);

        // Mutation 실행
        addCommentMutation.mutate(
            {
                postId: community._id,
                formData
            },
            {
                onSuccess: () => {
                    // 입력 폼 초기화
                    setNewComment('');
                    setCommentFile(null);
                    setCommentError('');
                    setCommentIsAnonymous(false);

                    // 댓글 수 증가
                    setLocalCommentCount(prev => prev + 1);
                },
                onError: (error) => {
                    setCommentError('댓글 작성에 실패했습니다.');
                    console.error('댓글 작성 오류:', error);
                }
            }
        );
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

    // ✅ 로딩 및 에러 상태 처리
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen text-gray-700">
                로딩중...
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 text-center mt-4">
                {error.message || '게시글을 불러오는 데 실패했습니다.'}
            </div>
        );
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
                        isDeleting={deleteMutation.isPending}
                        isRecommending={recommendMutation.isPending}
                    />

                    {/* 투표 관리자 컴포넌트 */}
                    <PollManager
                        community={community}
                        setCommunity={() => {}} // ⚠️ 임시: 투표는 commentCount 영향 없음
                        currentUserId={currentUserId}
                        isAdmin={isAdmin}
                    />

                    {/* 댓글 섹션 - 별도 컴포넌트로 분리 */}
                    <CommentSection
                        community={{ ...community, commentCount: localCommentCount }} // ✅ 로컬 commentCount 사용
                        comments={comments}
                        currentUserId={currentUserId}
                        isAdmin={isAdmin}
                        setCommunity={(updatedCommunity) => {
                            // ✅ commentCount 업데이트만 처리
                            if (updatedCommunity.commentCount !== undefined) {
                                setLocalCommentCount(updatedCommunity.commentCount);
                            }
                        }}
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
                        isAddingComment={addCommentMutation.isPending}
                        loadMoreComments={loadMoreComments}
                        hasMoreComments={hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
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
