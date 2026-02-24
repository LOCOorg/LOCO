// src/components/communitycomponents/CommunityEdit.jsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCommunityForEdit, fetchTopCommented, fetchTopViewed } from '../../api/communityApi.js';
import { useUpdateCommunity } from '../../hooks/queries/useCommunityQueries';
import LeftSidebar from '../../layout/CommunityLayout/LeftSidebar.jsx';
import RightSidebar from '../../layout/CommunityLayout/RightSidebar.jsx';
import CommunityLayout from '../../layout/CommunityLayout/CommunityLayout.jsx';

const MAX_URL_COUNT = 5;

const CommunityEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const API_HOST = import.meta.env.VITE_API_HOST;

    /* ───────── 기본 입력 ───────── */
    const [title, setTitle] = useState('');
    const [contents, setContents] = useState('');
    const [category, setCategory] = useState('전체');
    const [error, setError] = useState('');
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

    // 통합 이미지 관리 - 기존 이미지와 새 이미지를 구분하여 관리
    const [images, setImages] = useState([]);

    // 새 파일 추가
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

    // 이미지 제거
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

    /* ───────── 초기 게시글 로드 ───────── */
    const updateMutation = useUpdateCommunity();

    useEffect(() => {
        (async () => {
            try {
                const data = await fetchCommunityForEdit(id);
                setTitle(data.communityTitle);
                setContents(data.communityContents);
                setCategory(data.communityCategory);
                setIsAnonymous(data.isAnonymous || false);

                // 기존 이미지 로드
                if (data.communityImages?.length) {
                    const existingImages = data.communityImages.map((imagePath, index) => ({
                        type: 'existing',
                        src: `${API_HOST}/uploads${imagePath}`,
                        originalPath: imagePath,
                        id: `existing-${index}`
                    }));
                    setImages(existingImages);
                    setUploadMethod('file');
                }
            } catch {
                setError('게시글 정보를 불러오지 못했습니다.');
            }
        })();
    }, [id, API_HOST]);

    /* ───────── 제출 ───────── */
    const handleSubmit = async (e) => {
        e.preventDefault();

        const fd = new FormData();
        fd.append('communityTitle', title);
        fd.append('communityContents', contents);
        fd.append('communityCategory', category);
        fd.append('isAnonymous', isAnonymous);

        // ⚠️ 중요: 기존 API 구조 유지 - 모든 이미지를 'communityImages'로 전송

        // 1. 기존 이미지들 (상대경로로 변환)
        images
            .filter(img => img.type === 'existing')
            .forEach(img => {
                fd.append('communityImages', img.originalPath);
            });

        // 2. 새 파일들
        images
            .filter(img => img.type === 'file' && img.file)
            .forEach(img => {
                fd.append('communityImages', img.file);
            });

        // 3. URL 방식 입력 (URL 방식인 경우에만)
        if (uploadMethod === 'url') {
            imageUrls
                .filter(url => url.trim())
                .forEach(url => {
                    fd.append('communityImages', url.trim());
                });
        }

        try {
            await updateMutation.mutateAsync({ postId: id, formData: fd });
            // 이 시점에 자동으로 인기글 캐시 무효화 완료!
            navigate(`/community/${id}`);
        } catch (err) {
            console.error('Update error:', err);
            setError(err.response?.data?.message || '게시글 수정에 실패했습니다.');
        }
    };

    // URL을 이미지로 추가
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

    // 업로드 방식 변경 시 URL 이미지 처리
    useEffect(() => {
        if (uploadMethod === 'url') {
            addUrlAsImage();
        }
    }, [imageUrls, uploadMethod]);

    // 컴포넌트 언마운트 시 blob URL 정리
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
            <div className="max-w-4xl mx-auto p-4 md:p-6 bg-white">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">게시글 수정</h2>
                    <div className="h-1 w-20 bg-blue-500 rounded"></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 카테고리 선택 */}
                    <div className="form-group">
                        <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                            카테고리
                        </label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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

                    {/* 제목 입력 */}
                    <div className="form-group">
                        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                            제목 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="제목을 입력하세요"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                        />
                    </div>

                    {/* 내용 입력 */}
                    <div className="form-group">
                        <label htmlFor="contents" className="block text-sm font-semibold text-gray-700 mb-2">
                            내용 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="contents"
                            value={contents}
                            onChange={(e) => setContents(e.target.value)}
                            required
                            placeholder="내용을 입력하세요"
                            rows={12}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 resize-y"
                        />
                    </div>

                    {/* 익명 작성 체크박스 */}
                    <div className="form-group">
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            <span className="text-sm font-medium text-gray-700">익명으로 작성</span>
                        </label>
                    </div>

                    {/* 이미지 업로드 방식 선택 */}
                    <div className="form-group">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            이미지 업로드 방식
                        </label>
                        <div className="flex space-x-6">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="uploadMethod"
                                    value="file"
                                    checked={uploadMethod === 'file'}
                                    onChange={(e) => setUploadMethod(e.target.value)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">파일 업로드</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="uploadMethod"
                                    value="url"
                                    checked={uploadMethod === 'url'}
                                    onChange={(e) => setUploadMethod(e.target.value)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">URL 입력</span>
                            </label>
                        </div>
                    </div>

                    {/* 현재 이미지들 미리보기 */}
                    {images.length > 0 && (
                        <div className="form-group">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                현재 이미지
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {images.map((image) => (
                                    <div key={image.id} className="relative group">
                                        <div className="aspect-square overflow-hidden rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors">
                                            <img
                                                src={image.src}
                                                alt="이미지 미리보기"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeImage(image.id)}
                                            className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors group-hover:scale-110 transform duration-200"
                                            aria-label="이미지 삭제"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                            </svg>
                                        </button>
                                        <div className="mt-2 text-center">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                          image.type === 'existing'
                              ? 'bg-green-100 text-green-800'
                              : image.type === 'file'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                      }`}>
                        {image.type === 'existing' ? '기존' : image.type === 'file' ? '새파일' : 'URL'}
                      </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 파일 업로드 방식 */}
                    {uploadMethod === 'file' && (
                        <div className="form-group">
                            <label htmlFor="fileInput" className="block text-sm font-semibold text-gray-700 mb-2">
                                이미지 파일 추가
                            </label>
                            <div className="flex items-center justify-center w-full">
                                <label htmlFor="fileInput" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                        </svg>
                                        <p className="mb-2 text-sm text-gray-500">
                                            <span className="font-semibold">클릭하여 업로드</span> 또는 드래그 앤 드롭
                                        </p>
                                        <p className="text-xs text-gray-500">PNG, JPG, GIF (최대 10MB)</p>
                                    </div>
                                    <input
                                        type="file"
                                        id="fileInput"
                                        multiple
                                        accept="image/*"
                                        onChange={handleNewFiles}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                    )}

                    {/* URL 입력 방식 */}
                    {uploadMethod === 'url' && (
                        <div className="form-group">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                이미지 URL
                            </label>
                            <div className="space-y-3">
                                {imageUrls.map((url, idx) => (
                                    <div key={idx} className="flex gap-3">
                                        <input
                                            type="url"
                                            value={url}
                                            onChange={(e) => handleUrlChange(idx, e.target.value)}
                                            placeholder="이미지 URL을 입력하세요"
                                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                                        />
                                        {imageUrls.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeUrlInput(idx)}
                                                className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                </svg>
                                                <span className="ml-2 hidden sm:inline">삭제</span>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {imageUrls.length < MAX_URL_COUNT && (
                                    <button
                                        type="button"
                                        onClick={addUrlInput}
                                        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 hover:border-blue-400 text-gray-600 hover:text-blue-600 rounded-lg font-medium transition-all duration-200 flex items-center justify-center"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                        </svg>
                                        URL 추가
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                                </svg>
                                <span className="text-red-700 font-medium">{error}</span>
                            </div>
                        </div>
                    )}

                    {/* 제출 버튼 */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                        <button
                            type="submit"
                            disabled={updateMutation.isPending}
                            className={`flex-1 sm:flex-initial px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center ${
                                updateMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            {updateMutation.isPending ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    수정 중...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    수정 완료
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(`/community/${id}`)}
                            className="flex-1 sm:flex-initial px-8 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                            취소
                        </button>
                    </div>
                </form>
            </div>
        </CommunityLayout>
    );
};

export default CommunityEdit;
