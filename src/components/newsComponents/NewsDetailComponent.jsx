import React, { useState, useEffect } from 'react';
import {useParams, Link, useNavigate} from 'react-router-dom';
import { newsService } from '../../api/newsAPI.js';
import { toast } from 'react-toastify';
import useAuthStore from '../../stores/authStore.js';
import LoadingSpinner from '../common/LoadingSpinner.jsx';
import { LockClosedIcon } from '@heroicons/react/24/solid';

const NewsDetailComponent = () => {
    const { id } = useParams();
    const { user } = useAuthStore();
    const [news, setNews] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadNewsDetail();
    }, [id]);

    const loadNewsDetail = async () => {
        try {
            setLoading(true);
            const response = await newsService.getNewsDetail(id);
            if (response.success) {
                setNews(response.data);
                setIsAdmin(response.data.isAdmin || false);
            } else {
                toast.error('게시글을 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('뉴스 상세 조회 오류:', error);
            toast.error('게시글을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('정말로 삭제하시겠습니까?')) {
            return;
        }

        try {
            const response = await newsService.deleteNews(id);
            if (response.success) {
                toast.success('게시글이 삭제되었습니다.');
                window.location.href = '/news';
            } else {
                toast.error(response.message || '게시글 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('게시글 삭제 오류:', error);
            toast.error('게시글 삭제에 실패했습니다.');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const adminButtonsVisible = isAdmin;

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!news) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">게시글을 찾을 수 없습니다</h2>
                    <p className="text-gray-600">요청하신 게시글이 존재하지 않거나 삭제되었습니다.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* 헤더 */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    {!news.isActive && isAdmin && (
                        <LockClosedIcon className="h-5 w-5 text-gray-500" />
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        news.category === '공지사항' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                    }`}>
                        {news.category}
                    </span>
                    {news.isImportant && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            중요
                        </span>
                    )}
                    {!news.isActive && isAdmin && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                            숨김 상태
                        </span>
                    )}
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {news.title}
                </h1>
                
                <div className="flex items-center justify-between text-sm text-gray-600 border-b pb-4">
                    <div className="flex items-center gap-4">
                        <span>작성자: {news.authorNickname}</span>
                        <span>작성일: {formatDate(news.createdAt)}</span>
                        {news.updatedAt !== news.createdAt && (
                            <span>수정일: {formatDate(news.updatedAt)}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <span>조회수: {news.views}</span>
                        {adminButtonsVisible && (
                            <div className="flex gap-2">
                                <Link
                                    to={`/news/${id}/edit`}
                                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                >
                                    수정
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                >
                                    삭제
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 내용 */}
            <div className="prose max-w-none mb-8">
                <div 
                    className="text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: news.content }}
                />
            </div>

            {/* 첨부 이미지 */}
            {news.images && news.images.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">첨부 이미지</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {news.images.map((image, index) => (
                            <div key={index} className="border rounded-lg overflow-hidden">
                                <img
                                    src={`${import.meta.env.VITE_API_HOST}/${image.path}`}
                                    alt={image.originalName}
                                    className="w-full h-48 object-cover"
                                />
                                <div className="p-2">
                                    <p className="text-sm text-gray-600 truncate">
                                        {image.originalName}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 뒤로가기 버튼 */}
            <div className="mt-8 pt-6 border-t">
                <button
                    onClick={() => navigate('/news')}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                    목록으로 돌아가기
                </button>
            </div>
        </div>
    );
};

export default NewsDetailComponent;
