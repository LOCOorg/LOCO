import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bannerService } from '../../api/bannerAPI.js';
import { toast } from 'react-toastify';

const BannerListComponent = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        loadBanners();
    }, [currentPage]);

    const loadBanners = async () => {
        try {
            setLoading(true);
            const response = await bannerService.getAllBanners({
                page: currentPage,
                limit: 10
            });
            
            if (response.success) {
                setBanners(response.data.banners);
                setPagination(response.data.pagination);
            } else {
                toast.error('배너 목록을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('배너 로딩 오류:', error);
            toast.error('배너 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('정말로 이 배너를 삭제하시겠습니까?')) {
            return;
        }

        try {
            const response = await bannerService.deleteBanner(id);
            if (response.success) {
                toast.success('배너가 삭제되었습니다.');
                loadBanners();
            } else {
                toast.error(response.message || '배너 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('배너 삭제 오류:', error);
            toast.error('배너 삭제에 실패했습니다.');
        }
    };

    const handleToggleActive = async (id, currentStatus) => {
        try {
            const response = await bannerService.updateBanner(id, {
                isActive: !currentStatus
            });
            
            if (response.success) {
                toast.success(`배너가 ${!currentStatus ? '활성화' : '비활성화'}되었습니다.`);
                loadBanners();
            } else {
                toast.error('상태 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('배너 상태 변경 오류:', error);
            toast.error('상태 변경에 실패했습니다.');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* 헤더 */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">배너 관리</h1>
                    <p className="text-gray-600">메인페이지에 표시될 배너를 관리할 수 있습니다</p>
                </div>
                
                <Link
                    to="/admin/banners/create"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    새 배너 등록
                </Link>
            </div>

            {/* 배너 목록 */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">로딩 중...</p>
                </div>
            ) : banners.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-600">등록된 배너가 없습니다.</p>
                    <Link
                        to="/admin/banners/create"
                        className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        첫 번째 배너 등록하기
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {banners.map((banner) => (
                        <div
                            key={banner._id}
                            className={`bg-white border rounded-lg p-6 shadow-sm ${
                                !banner.isActive ? 'opacity-75 bg-gray-50' : ''
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex space-x-4 flex-1">
                                    {/* 배너 이미지 */}
                                    <div className="flex-shrink-0">
                                        <img
                                            src={`${import.meta.env.VITE_API_HOST}/${banner.image.path}`}
                                            alt={banner.title}
                                            className="w-32 h-20 object-cover rounded border"
                                        />
                                    </div>
                                    
                                    {/* 배너 정보 */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                {banner.title}
                                            </h3>
                                            
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                banner.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {banner.isActive ? '활성' : '비활성'}
                                            </span>
                                            
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                순서: {banner.order}
                                            </span>
                                        </div>
                                        
                                        {banner.description && (
                                            <p className="text-gray-600 mb-2 line-clamp-2">
                                                {banner.description}
                                            </p>
                                        )}
                                        
                                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                                            <span>작성자: {banner.author?.nickname}</span>
                                            <span>생성일: {formatDate(banner.createdAt)}</span>
                                            <span>클릭수: {banner.views}회</span>
                                            {banner.linkUrl && (
                                                <span className="text-blue-600">
                                                    링크: {banner.linkUrl.length > 30 
                                                        ? `${banner.linkUrl.substring(0, 30)}...` 
                                                        : banner.linkUrl
                                                    }
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* 액션 버튼들 */}
                                <div className="flex items-center space-x-2 ml-4">
                                    <button
                                        onClick={() => handleToggleActive(banner._id, banner.isActive)}
                                        className={`px-3 py-1 text-sm rounded transition-colors ${
                                            banner.isActive
                                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                                        }`}
                                    >
                                        {banner.isActive ? '비활성화' : '활성화'}
                                    </button>
                                    
                                    <Link
                                        to={`/admin/banners/edit/${banner._id}`}
                                        className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                                    >
                                        수정
                                    </Link>
                                    
                                    <button
                                        onClick={() => handleDelete(banner._id)}
                                        className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 페이지네이션 */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8">
                    <nav className="flex items-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={!pagination.hasPrevPage}
                            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            이전
                        </button>
                        
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
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
                            onClick={() => setCurrentPage(currentPage + 1)}
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

export default BannerListComponent;
