import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { bannerService } from '../../api/bannerAPI.js';
import { toast } from 'react-toastify';

const BannerEditComponent = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        linkUrl: '',
        order: 0,
        isActive: true
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [currentImage, setCurrentImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingBanner, setLoadingBanner] = useState(true);
    const fileInputRef = useRef(null);

    useEffect(() => {
        loadBanner();
    }, [id]);

    const loadBanner = async () => {
        try {
            setLoadingBanner(true);
            const response = await bannerService.getBannerDetail(id);
            
            if (response.success) {
                const banner = response.data;
                setFormData({
                    title: banner.title,
                    description: banner.description || '',
                    linkUrl: banner.linkUrl || '',
                    order: banner.order,
                    isActive: banner.isActive
                });
                setCurrentImage(banner.image);
            } else {
                toast.error('배너를 불러오는데 실패했습니다.');
                navigate('/admin/banners');
            }
        } catch (error) {
            console.error('배너 로딩 오류:', error);
            toast.error('배너를 불러오는데 실패했습니다.');
            navigate('/admin/banners');
        } finally {
            setLoadingBanner(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 파일 크기 검증 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('이미지 파일은 10MB 이하만 업로드 가능합니다.');
            return;
        }

        // 이미지 파일 검증
        if (!file.type.startsWith('image/')) {
            toast.error('이미지 파일만 업로드 가능합니다.');
            return;
        }

        setImageFile(file);

        // 미리보기 생성
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    const removeNewImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 필수 필드 검증
        if (!formData.title.trim()) {
            toast.error('제목을 입력해주세요.');
            return;
        }

        try {
            setLoading(true);
            const response = await bannerService.updateBanner(id, formData, imageFile);

            if (response.success) {
                toast.success('배너가 성공적으로 수정되었습니다.');
                navigate('/admin/banners');
            } else {
                toast.error(response.message || '배너 수정에 실패했습니다.');
            }
        } catch (error) {
            console.error('배너 수정 오류:', error);
            if (error.response?.status === 403) {
                toast.error('관리자 권한이 필요합니다.');
            } else {
                toast.error('배너 수정에 실패했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loadingBanner) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">배너를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">배너 수정</h1>
                <p className="text-gray-600">배너 정보를 수정해주세요.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 제목 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        제목 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="배너 제목을 입력해주세요"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        maxLength={100}
                        required
                    />
                </div>

                {/* 설명 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        설명
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="배너에 대한 간단한 설명을 입력해주세요"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        maxLength={500}
                    />
                </div>

                {/* 링크 URL */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        링크 URL (선택사항)
                    </label>
                    <input
                        type="url"
                        name="linkUrl"
                        value={formData.linkUrl}
                        onChange={handleInputChange}
                        placeholder="https://example.com (클릭 시 이동할 주소)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* 순서 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        표시 순서
                    </label>
                    <input
                        type="number"
                        name="order"
                        value={formData.order}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* 활성 상태 */}
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="isActive"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                        배너 활성화
                    </label>
                </div>

                {/* 현재 이미지 및 새 이미지 업로드 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        배너 이미지
                    </label>
                    
                    {/* 현재 이미지 */}
                    {currentImage && !imagePreview && (
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">현재 이미지:</p>
                            <img
                                src={`${import.meta.env.VITE_API_HOST}/${currentImage.path}`}
                                alt="현재 배너"
                                className="w-full max-w-2xl h-64 object-cover rounded-lg border"
                            />
                        </div>
                    )}
                    
                    <div className="space-y-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        
                        <p className="text-xs text-gray-500">
                            새 이미지를 선택하면 기존 이미지가 교체됩니다.
                        </p>
                        
                        {/* 새 이미지 미리보기 */}
                        {imagePreview && (
                            <div className="relative">
                                <p className="text-sm text-gray-600 mb-2">새 이미지 미리보기:</p>
                                <img
                                    src={imagePreview}
                                    alt="새 배너 미리보기"
                                    className="w-full max-w-2xl h-64 object-cover rounded-lg border"
                                />
                                <button
                                    type="button"
                                    onClick={removeNewImage}
                                    className="absolute top-8 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 버튼 그룹 */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/banners')}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? '수정 중...' : '배너 수정'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BannerEditComponent;
