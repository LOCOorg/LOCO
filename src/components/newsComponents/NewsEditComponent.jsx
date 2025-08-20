import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { newsService } from '../../api/newsAPI.js';
import { editorService } from '../../api/editorAPI.js';
import { toast } from 'react-toastify';
import MDEditor from '@uiw/react-md-editor';

const NewsEditComponent = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: '공지사항',
        isImportant: false,
        isActive: true
    });
    const [images, setImages] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingNews, setLoadingNews] = useState(true);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef(null);
    const editorImageInputRef = useRef(null);

    useEffect(() => {
        loadNews();
    }, [id]);

    const loadNews = async () => {
        try {
            setLoadingNews(true);
            const response = await newsService.getNewsDetail(id);
            if (response.success) {
                const news = response.data;
                setFormData({
                    title: news.title,
                    content: news.content,
                    category: news.category,
                    isImportant: news.isImportant,
                    isActive: news.isActive
                });
                setExistingImages(news.images || []);
            } else {
                toast.error('게시글을 불러올 수 없습니다.');
                navigate('/news');
            }
        } catch (error) {
            console.error('뉴스 로딩 오류:', error);
            toast.error('게시글을 불러오는데 실패했습니다.');
            navigate('/news');
        } finally {
            setLoadingNews(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleContentChange = (val) => {
        setFormData(prev => ({
            ...prev,
            content: val || ''
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + images.length + existingImages.length > 10) {
            toast.error('이미지는 최대 10개까지만 업로드 가능합니다.');
            return;
        }

        const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            toast.error('이미지 파일은 5MB 이하만 업로드 가능합니다.');
            return;
        }

        const validFiles = files.filter(file => file.type.startsWith('image/'));
        if (validFiles.length !== files.length) {
            toast.error('이미지 파일만 업로드 가능합니다.');
        }

        setImages(prev => [...prev, ...validFiles]);
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (index) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title.trim()) {
            toast.error('제목을 입력해주세요.');
            return;
        }
        
        if (!formData.content.trim()) {
            toast.error('내용을 입력해주세요.');
            return;
        }

        try {
            setLoading(true);
            const response = await newsService.updateNews(id, formData, images);
            
            if (response.success) {
                toast.success('게시글이 성공적으로 수정되었습니다.');
                navigate(`/news/${id}`);
            } else {
                toast.error(response.message || '게시글 수정에 실패했습니다.');
            }
        } catch (error) {
            console.error('게시글 수정 오류:', error);
            toast.error('게시글 수정에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (loadingNews) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">게시글을 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">게시글 수정</h1>
                <p className="text-gray-600">게시글을 수정할 수 있습니다.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 카테고리 선택 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        카테고리
                    </label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="공지사항">공지사항</option>
                        <option value="이벤트">이벤트</option>
                    </select>
                </div>

                {/* 제목 입력 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        제목
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="제목을 입력해주세요"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        maxLength={200}
                    />
                </div>

                {/* 옵션들 */}
                <div className="space-y-3">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isImportant"
                            name="isImportant"
                            checked={formData.isImportant}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isImportant" className="ml-2 block text-sm text-gray-700">
                            중요 공지사항으로 설정
                        </label>
                    </div>
                    
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
                            게시글 활성화 (체크 해제 시 일반 사용자에게는 숨김, 관리자에게는 자물쇠 표시)
                        </label>
                    </div>
                </div>

                {/* 내용 입력 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        내용 (마크다운 지원)
                    </label>
                    
                    {/* 마크다운 에디터 */}
                    <div data-color-mode="light">
                        <MDEditor
                            value={formData.content}
                            onChange={handleContentChange}
                            height={400}
                            placeholder="내용을 입력해주세요. 마크다운 문법을 사용할 수 있습니다."
                        />
                    </div>
                </div>

                {/* 기존 이미지 */}
                {existingImages.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            기존 이미지
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {existingImages.map((image, index) => (
                                <div key={index} className="relative">
                                    <img
                                        src={`${import.meta.env.VITE_API_HOST}/${image.path}`}
                                        alt={image.originalName}
                                        className="w-full h-24 object-cover rounded-lg border"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeExistingImage(index)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                    >
                                        ×
                                    </button>
                                    <p className="text-xs text-gray-600 mt-1 truncate">
                                        {image.originalName}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 새 이미지 업로드 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        새 이미지 추가 (총 최대 10개)
                    </label>
                    <div className="space-y-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            multiple
                            accept="image/*"
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        
                        {images.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {images.map((image, index) => (
                                    <div key={index} className="relative">
                                        <img
                                            src={URL.createObjectURL(image)}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-lg border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                        >
                                            ×
                                        </button>
                                        <p className="text-xs text-gray-600 mt-1 truncate">
                                            {image.name}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 버튼 그룹 */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                    <button
                        type="button"
                        onClick={() => navigate(`/news/${id}`)}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? '수정 중...' : '게시글 수정'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewsEditComponent;
