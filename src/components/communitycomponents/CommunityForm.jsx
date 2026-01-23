// src/components/communitycomponents/CommunityForm.jsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    fetchTopCommented,
    fetchTopViewed,
} from '../../api/communityAPI.js';
import useAuthStore from '../../stores/authStore.js';
import { useCreateCommunity } from '../../hooks/queries/useCommunityQueries';
import LeftSidebar from '../../layout/CommunityLayout/LeftSidebar.jsx';
import RightSidebar from '../../layout/CommunityLayout/RightSidebar.jsx';
import CommunityLayout from '../../layout/CommunityLayout/CommunityLayout.jsx';

const MAX_URL_COUNT = 5;

const CommunityForm = () => {
    /* ───────── 기본 입력 ───────── */
    const [title, setTitle] = useState('');
    const [contents, setContents] = useState('');
    const [category, setCategory] = useState('자유');
    const [isAnonymous, setIsAnonymous] = useState(false);

    /* ───────── 이미지 입력 방식 ───────── */
    const [uploadMethod, setUploadMethod] = useState('file'); // 'url' | 'file'

    // URL 방식
    const [imageUrls, setImageUrls] = useState(['']);
    const handleUrlChange = (idx, v) =>
        setImageUrls((prev) => prev.map((u, i) => (i === idx ? v : u)));
    const addUrlInput = () =>
        setImageUrls((prev) =>
            prev.length < MAX_URL_COUNT ? [...prev, ''] : prev,
        );
    const removeUrlInput = (idx) =>
        setImageUrls((prev) => prev.filter((_, i) => i !== idx));

    // 통합 이미지 관리 - CommunityEdit과 동일한 구조
    const [images, setImages] = useState([]);

    // 새 파일 추가 - CommunityEdit과 동일
    const handleNewFiles = (e) => {
        const files = Array.from(e.target.files);
        const newImageItems = files.map((file, index) => ({
            type: 'file',
            src: URL.createObjectURL(file),
            file: file,
            id: `file-${Date.now()}-${index}`
        }));
        setImages(prev => [...prev, ...newImageItems]);
    };

    // 이미지 제거 - CommunityEdit과 동일
    const removeImage = (imageId) => {
        setImages(prev => {
            const imageToRemove = prev.find(img => img.id === imageId);
            // blob URL인 경우 메모리에서 해제
            if (imageToRemove && imageToRemove.src.startsWith('blob:')) {
                URL.revokeObjectURL(imageToRemove.src);
            }
            return prev.filter(img => img.id !== imageId);
        });
    };

    /* ───────── 사이드바 데이터 ───────── */
    const [sideTab, setSideTab] = useState('viewed');
    const [topViewed, setTopViewed] = useState([]);
    const [topCommented, setTopCommented] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('전체');

    useEffect(() => {
        (async () => {
            try {
                setTopViewed(await fetchTopViewed());
                setTopCommented(await fetchTopCommented());
            } catch (err) {
                console.error(err);
            }
        })();
    }, []);

    /* ───────── 기타 UI 상태 ───────── */
    const [error, setError] = useState('');
    const navigate = useNavigate();

    /* ───────── 작성 제출 ───────── */
    const currentUser = useAuthStore((s) => s.user);
    const userId = currentUser?._id;

    // 🆕 게시글 작성 Mutation Hook
    const createMutation = useCreateCommunity();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('userId', userId);
        fd.append('communityTitle', title);
        fd.append('communityContents', contents);
        fd.append('communityCategory', category);
        fd.append('isAnonymous', isAnonymous);

        // CommunityEdit과 동일한 이미지 처리 로직
        // 1. 새 파일들
        images
            .filter(img => img.type === 'file' && img.file)
            .forEach(img => {
                fd.append('communityImages', img.file);
            });

        // 2. URL 방식 입력 (URL 방식인 경우에만)
        if (uploadMethod === 'url') {
            imageUrls
                .filter(url => url.trim())
                .forEach(url => {
                    fd.append('communityImages', url.trim());
                });
        }

        try {
            await createMutation.mutateAsync(fd);
            // ✅ 이 시점에 자동으로 인기글 캐시 무효화 완료!
            navigate('/community');
        } catch (err) {
            setError(err.response?.data?.message || '게시글 생성에 실패했습니다.');
        }
    };

    // URL을 이미지로 추가 - CommunityEdit과 동일
    const addUrlAsImage = () => {
        const validUrls = imageUrls.filter(url => url.trim());
        const urlImages = validUrls.map((url, index) => ({
            type: 'url',
            src: url.trim(),
            id: `url-${Date.now()}-${index}`
        }));

        // 기존 URL 이미지들 제거하고 새로운 것들 추가
        setImages(prev => [
            ...prev.filter(img => img.type !== 'url'),
            ...urlImages
        ]);
    };

    // 업로드 방식 변경 시 URL 이미지 처리 - CommunityEdit과 동일
    useEffect(() => {
        if (uploadMethod === 'url') {
            addUrlAsImage();
        }
    }, [imageUrls, uploadMethod]);

    // 컴포넌트 언마운트 시 blob URL 정리 - CommunityEdit과 동일
    useEffect(() => {
        return () => {
            images.forEach(image => {
                if (image.src && image.src.startsWith('blob:')) {
                    URL.revokeObjectURL(image.src);
                }
            });
        };
    }, []);

    const handleCategoryNav = (category) => navigate(`/community?category=${category}`);

    /* ───────── 렌더 ───────── */
    return (
        <CommunityLayout
            leftSidebar={<LeftSidebar
                selectedCategory={selectedCategory}
                handleCategoryClick={handleCategoryNav} />}
            rightSidebar={
                <RightSidebar
                    sideTab={sideTab}
                    setSideTab={setSideTab}
                    topViewed={topViewed}
                    topCommented={topCommented}
                />
            }
        >
            <div className="max-w-4xl mx-auto p-4 md:p-6 bg-white rounded-xl shadow-lg">
                {/* 헤더 */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">게시글 작성</h2>
                    <div className="h-1 w-20 bg-blue-500 rounded"></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 제목 입력 */}
                    <div className="space-y-2">
                        <label htmlFor="title" className="block text-lg font-semibold text-gray-900">
                            제목 <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="제목을 입력하세요"
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                            required
                        />
                    </div>

                    {/* 카테고리 & 익명 작성 */}
                    <div className="flex flex-col lg:flex-row gap-6 lg:items-end">
                        <div className="flex-1 space-y-2">
                            <label htmlFor="category" className="block text-lg font-semibold text-gray-900">
                                카테고리
                            </label>
                            <select
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                            >
                                <option value="자유">자유</option>
                                <option value="질문">질문</option>
                                <option value="유머">유머</option>
                                <option value="질문">질뮨</option>
                                <option value="사건사고">사건사고</option>
                                <option value="전적인증">전적인증</option>
                                <option value="개발요청">개발요청</option>
                            </select>
                        </div>

                        <div className="flex items-center">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={isAnonymous}
                                        onChange={(e) => setIsAnonymous(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <div className={`w-6 h-6 rounded border-2 transition-all duration-200 ${
                                        isAnonymous
                                            ? 'bg-blue-500 border-blue-500'
                                            : 'bg-white border-gray-300 hover:border-gray-400'
                                    }`}>
                                        {isAnonymous && (
                                            <svg className="w-4 h-4 text-white absolute top-0.5 left-0.5"
                                                 fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd"
                                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                      clipRule="evenodd"/>
                                            </svg>
                                        )}
                                    </div>
                                </div>
                                <span className="text-lg text-gray-900 select-none">익명으로 작성</span>
                            </label>
                        </div>
                    </div>

                    {/* 내용 입력 */}
                    <div className="space-y-2">
                        <label htmlFor="contents" className="block text-lg font-semibold text-gray-900">
                            내용 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="contents"
                            value={contents}
                            onChange={(e) => setContents(e.target.value)}
                            placeholder="내용을 입력하세요"
                            rows={12}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-lg resize-y focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                            required
                        />
                    </div>


                    {/* 통합 이미지 미리보기 */}
                    {images.length > 0 && (
                        <div className="space-y-3">
                            <label className="block text-lg font-semibold text-gray-900">이미지 미리보기</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {images.map((image) => (
                                    <div key={image.id} className="relative group">
                                        <div
                                            className="relative rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                                            <img
                                                src={image.src}
                                                alt="미리보기"
                                                className="w-full h-40 object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(image.id)}
                                                className="absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-70 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-lg font-bold opacity-0 group-hover:opacity-100 transition-all duration-200"
                                                title="이미지 제거"
                                            >
                                                ×
                                            </button>
                                            <div
                                                className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-70 text-white text-xs font-medium rounded">
                                                {image.type === 'file' ? '파일' : 'URL'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 이미지 업로드 방식 선택 */}
                    <div className="space-y-3">
                        <label className="block text-lg font-semibold text-gray-900">이미지 업로드</label>
                        <div className="flex border-2 border-gray-200 rounded-lg overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setUploadMethod('file')}
                                className={`flex-1 flex items-center justify-center gap-3 py-3 px-4 text-lg font-medium transition-all duration-200 ${
                                    uploadMethod === 'file'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <span className="text-xl">📁</span>
                                파일 업로드
                            </button>
                            <button
                                type="button"
                                onClick={() => setUploadMethod('url')}
                                className={`flex-1 flex items-center justify-center gap-3 py-3 px-4 text-lg font-medium transition-all duration-200 ${
                                    uploadMethod === 'url'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <span className="text-xl">🔗</span>
                                URL 입력
                            </button>
                        </div>
                    </div>

                    {/* 파일 업로드 */}
                    {uploadMethod === 'file' && (
                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    id="imageFiles"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleNewFiles}
                                    className="sr-only"
                                />
                                <label
                                    htmlFor="imageFiles"
                                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 hover:border-blue-400 cursor-pointer transition-all duration-200"
                                >
                                    <div className="text-6xl mb-4 opacity-60">📷</div>
                                    <div className="text-center">
                                        <div className="text-xl font-medium text-gray-900 mb-2">
                                            이미지를 선택하거나 드래그하세요
                                        </div>
                                        <div className="text-gray-600">
                                            JPG, PNG, GIF 파일을 업로드할 수 있습니다
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* URL 입력 */}
                    {uploadMethod === 'url' && (
                        <div className="space-y-4">
                            {imageUrls.map((url, idx) => (
                                <div key={idx} className="flex gap-3 items-center">
                                    <div className="flex-1 relative">
                                        <input
                                            type="url"
                                            value={url}
                                            onChange={(e) => handleUrlChange(idx, e.target.value)}
                                            placeholder="https://example.com/image.jpg"
                                            className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg text-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                                        />
                                        {imageUrls.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeUrlInput(idx)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-red-100 hover:bg-red-500 text-red-600 hover:text-white rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200"
                                                title="URL 제거"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {imageUrls.length < MAX_URL_COUNT && (
                                <button
                                    type="button"
                                    onClick={addUrlInput}
                                    className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all duration-200"
                                >
                                    <span className="text-lg font-bold">+</span>
                                    URL 추가
                                </button>
                            )}
                        </div>
                    )}
                    {/* 에러 메시지 */}
                    {error && (
                        <div
                            className="flex items-center gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            <span className="text-lg">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* 제출 버튼 */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-8 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => navigate('/community')}
                            className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all duration-200 min-w-[120px]"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className={`flex items-center justify-center gap-2 px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg min-w-[140px] ${
                                createMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            {createMutation.isPending ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    작성 중...
                                </>
                            ) : (
                                <>
                                    <span className="text-lg">✏️</span>
                                    게시글 작성
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </CommunityLayout>
    );
};

export default CommunityForm;
