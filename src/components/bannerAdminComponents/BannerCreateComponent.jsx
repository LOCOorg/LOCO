import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { bannerService } from '../../api/bannerAPI.js';
import { toast } from 'react-toastify';

const BannerCreateComponent = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        linkUrl: '',
        order: 0,
        isActive: true
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

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

    const removeImage = () => {
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

        if (!imageFile) {
            toast.error('배너 이미지를 선택해주세요.');
            return;
        }

        try {
            setLoading(true);
            const response = await bannerService.createBanner(formData, imageFile);

            if (response.success) {
                toast.success('배너가 성공적으로 등록되었습니다.');
                navigate('/admin/banners');
            } else {
                toast.error(response.message || '배너 등록에 실패했습니다.');
            }
        } catch (error) {
            console.error('배너 등록 오류:', error);
            if (error.response?.status === 403) {
                toast.error('관리자 권한이 필요합니다.');
            } else {
                toast.error('배너 등록에 실패했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">새 배너 등록</h1>
                <p className="text-gray-600">메인페이지에 표시될 배너를 등록해주세요.</p>
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
                    <p className="mt-1 text-xs text-gray-500">
                        배너 클릭 시 이동할 URL을 입력하세요. 비워두면 클릭이 동작하지 않습니다.
                    </p>
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
                    <p className="mt-1 text-xs text-gray-500">
                        낮은 숫자일수록 먼저 표시됩니다. (0이 가장 먼저)
                    </p>
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
                        배너 활성화 (체크 해제 시 메인페이지에 표시되지 않습니다)
                    </label>
                </div>

                {/* 이미지 업로드 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        배너 이미지 <span className="text-red-500">*</span>
                    </label>
                    
                    <div className="space-y-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/*"
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            required
                        />
                        
                        <p className="text-xs text-gray-500">
                            권장 크기: 1200x400px, 최대 크기: 10MB, 지원 형식: JPG, PNG, GIF
                        </p>
                        
                        {/* 이미지 미리보기 */}
                        {imagePreview && (
                            <div className="relative">
                                <img
                                    src={imagePreview}
                                    alt="배너 미리보기"
                                    className="w-full max-w-2xl h-64 object-cover rounded-lg border"
                                />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600"
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
                        {loading ? '등록 중...' : '배너 등록'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BannerCreateComponent;
