// src/components/communitycomponents/CommunityDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    fetchCommunityById,
    deleteCommunity,
    recommendCommunity,
    addComment,
    fetchTopViewed,
    fetchTopCommented,
    cancelRecommendCommunity
} from '../../api/communityApi.js';
import { getUserInfo } from '../../api/userAPI.js';
import CommonModal from '../../common/CommonModal.jsx';
import useAuthStore from '../../stores/authStore.js';
import CommunityLayout from "../../layout/CommunityLayout/CommunityLayout.jsx";
import LeftSidebar from "../../layout/CommunityLayout/LeftSidebar.jsx";
import RightSidebar from "../../layout/CommunityLayout/RightSidebar.jsx";
import ReportForm from "../reportcomponents/ReportForm.jsx";
import ProfileButton from '../../components/MyPageComponent/ProfileButton.jsx';
import CommentSection from './CommentSection.jsx'; // 새로 분리할 컴포넌트
import {FaThumbsUp} from 'react-icons/fa';
import clsx from 'clsx';
import PollManager from "./PollManager.jsx";

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

    // 커뮤니티 관련 상태
    const [community, setCommunity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isRecommended, setIsRecommended] = useState(false);

    // 프로필 관련 상태
    const [postProfile, setPostProfile] = useState(null);
    const [userMap, setUserMap] = useState({});

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
        return userMap[item.userId] || item.userId;
    };

    // 데이터 로딩 Effects
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

    // 프로필 관련 Effects
    useEffect(() => {
        if (community?.userId && !community.isAnonymous) {
            getUserInfo(community.userId)
                .then((data) => setPostProfile(data))
                .catch((error) => console.error("프로필 불러오기 실패", error));
        }
    }, [community]);

    useEffect(() => {
        const fetchUserNames = async () => {
            if (!community) return;

            const userIds = new Set();

            if (community.userId && !community.isAnonymous) {
                userIds.add(community.userId);
            }

            community.comments?.forEach((cmt) => {
                if (cmt.userId && !cmt.isAnonymous) userIds.add(cmt.userId);
                cmt.replies?.forEach((r) => {
                    if (r.userId && !r.isAnonymous) userIds.add(r.userId);
                    r.subReplies?.forEach((sr) => {
                        if (sr.userId && !sr.isAnonymous) userIds.add(sr.userId);
                    });
                });
            });

            const newUserMap = { ...userMap };
            await Promise.all(
                Array.from(userIds).map(async (uid) => {
                    if (!newUserMap[uid]) {
                        try {
                            const userInfo = await getUserInfo(uid);
                            newUserMap[uid] = userInfo.nickname || userInfo.name || uid;
                        } catch (error) {
                            newUserMap[uid] = uid;
                        }
                    }
                })
            );
            setUserMap(newUserMap);
        };
        fetchUserNames();
    }, [community]);

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

            const updated = await addComment(community._id, formData);
            setCommunity(updated);
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
            <div className="container mx-auto p-6">
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
                    {/* 게시글 헤더 */}
                    <h1 className="text-3xl font-bold mb-2">{community.communityTitle}</h1>
                    <div className="text-sm text-gray-600 mb-4 space-x-2">
                        <span>
                            {!community.isAnonymous && postProfile && (
                                <ProfileButton
                                    profile={postProfile}
                                    area="커뮤니티"
                                    anchor={{
                                        type: 'post',
                                        parentId: community._id,
                                        targetId: community._id,
                                    }}
                                />
                            )}
                            작성자: <span className="font-semibold">{getDisplayNickname(community)}</span>
                        </span>
                        <span>카테고리: <span className="font-semibold">{community.communityCategory}</span></span>
                        <span>작성일: <span className="font-medium">{formatRelativeTime(community.communityRegDate)}</span></span>
                        <span>조회수: <span className="font-medium">{community.communityViews}</span></span>
                        <span>추천: <span className="font-medium">{community.recommendedUsers?.length || 0}</span></span>
                    </div>

                    {/* 게시글 이미지 */}
                    {community.communityImages?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {community.communityImages.map((src) => (
                                <img
                                    key={src}
                                    src={`${API_HOST}${src}`}
                                    alt="본문 이미지"
                                    className="max-h-96 w-auto rounded object-contain"
                                />
                            ))}
                        </div>
                    )}

                    {/* 게시글 내용 */}
                    <p className="text-gray-800 mb-4" id={`post-${community._id}`}>
                        {community.communityContents}
                    </p>

                    {/* 추천 및 신고 버튼 */}
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
                                className="text-sm font-medium text-gray-500 hover:text-rose-600 hover:underline"
                            >
                                신고
                            </button>
                        )}
                    </div>
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
                        setCommunity={setCommunity}
                        currentUserId={currentUserId}
                        isAdmin={isAdmin}
                        userMap={userMap}
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
                        onCancelVote={() => handleCancelVote(poll._id)}
                    />

                    {/* 게시글 관리 버튼 */}
                    {(community.userId === currentUserId || isAdmin) && (
                        <div className="mt-6 flex space-x-4">
                            {community.userId === currentUserId && (
                                <button
                                    onClick={() => navigate(`/community/edit/${community._id}`)}
                                    className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600 transition duration-200"
                                >
                                    수정
                                </button>
                            )}
                            <button
                                onClick={handleDelete}
                                className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition duration-200"
                            >
                                삭제
                            </button>
                        </div>
                    )}

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
