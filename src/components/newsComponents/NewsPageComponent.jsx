import React, {useEffect, useState} from 'react';
import { Link, useSearchParams } from 'react-router-dom';
//import { newsService } from '../../api/newsAPI.js';
import { toast } from 'react-toastify';
import useAuthStore from '../../stores/authStore.js';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import { useNews } from '../../hooks/queries/useNewsQueries';

const NewsPageComponent = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuthStore();

    const [activeTab, setActiveTab] = useState(searchParams.get('category') || 'all');
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);


    const {
        data,
        isLoading: loading,
        error,
    } = useNews({
        page: currentPage,
        limit: 10,
        category: activeTab,
    });

    // ✅ 데이터 추출
    const news = data?.news || [];
    const pagination = data?.pagination || {};
    const isAdmin = data?.isAdmin || false;

    useEffect(() => {
        if (error) {
            toast.error('뉴스를 불러오는데 실패했습니다.');
        }
    }, [error]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setCurrentPage(1);
        setSearchParams({ 
            ...(tab !== 'all' && { category: tab }), 
            page: '1' 
        });
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        setSearchParams({ 
            ...(activeTab !== 'all' && { category: activeTab }), 
            page: page.toString() 
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return date.toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else if (diffDays < 7) {
            return `${diffDays}일 전`;
        } else {
            return date.toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric'
            });
        }
    };

    const adminButtonsVisible = isAdmin;

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* 헤더 */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">새소식</h1>
                    <p className="text-gray-600">최신 공지사항과 이벤트를 확인해보세요</p>
                </div>
                
                {adminButtonsVisible && (
                    <Link
                        to="/news/write"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        글 작성
                    </Link>
                )}
            </div>

            {/* 탭 메뉴 */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { key: 'all', label: '전체', count: pagination.totalItems },
                        { key: '공지사항', label: '공지사항' },
                        { key: '이벤트', label: '이벤트' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabChange(tab.key)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tab.key
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab.label}
                            {tab.count && (
                                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* 뉴스 목록 */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">로딩 중...</p>
                </div>
            ) : news.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-600">등록된 게시글이 없습니다.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {news.map((item) => (
                        <Link
                            key={item._id}
                            to={`/news/${item._id}`}
                            className={`block bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow ${
                                !item.isActive ? 'opacity-75 bg-gray-50' : ''
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        {!item.isActive && isAdmin && (
                                            <LockClosedIcon className="h-4 w-4 text-gray-500" />
                                        )}
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            item.category === '공지사항'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {item.category}
                                        </span>
                                        {item.isImportant && (
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                                중요
                                            </span>
                                        )}
                                        {!item.isActive && isAdmin && (
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                                숨김
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-500">
                                            {formatDate(item.createdAt)}
                                        </span>
                                    </div>
                                    
                                    <h3 className={`text-lg font-semibold mb-2 hover:text-blue-600 ${
                                        !item.isActive ? 'text-gray-600' : 'text-gray-900'
                                    }`}>
                                        {item.title}
                                    </h3>
                                    
                                    <div className="flex items-center text-sm text-gray-600">
                                        <span>작성자: {item.authorNickname}</span>
                                        <span className="mx-2">·</span>
                                        <span>조회수: {item.views}</span>
                                    </div>
                                </div>
                                
                                { (item.contentThumbnailUrl || (item.images && item.images.length > 0)) && (
                                    <div className="ml-4">
                                        <img
                                            src={item.contentThumbnailUrl ? item.contentThumbnailUrl : `${import.meta.env.VITE_API_HOST}/${item.images[0].path}`}
                                            alt="썸네일"
                                            className="w-16 h-16 object-cover rounded"
                                        />
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* 페이지네이션 */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8">
                    <nav className="flex items-center space-x-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={!pagination.hasPrevPage}
                            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            이전
                        </button>
                        
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-2 text-sm rounded ${
                                    page === currentPage
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={!pagination.hasNextPage}
                            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            다음
                        </button>
                    </nav>
                </div>
            )}
        </div>
    );
};

export default NewsPageComponent;
