// src/components/communitycomponents/CommunityForm.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    createCommunity,
    fetchTopCommented,
    fetchTopViewed,
} from '../../api/communityAPI.js';
import useAuthStore from '../../stores/authStore.js';
import LeftSidebar from '../../layout/CommunityLayout/LeftSidebar.jsx';
import RightSidebar from '../../layout/CommunityLayout/RightSidebar.jsx';
import CommunityLayout from '../../layout/CommunityLayout/CommunityLayout.jsx';

const MAX_URL_COUNT = 5;

const CommunityForm = () => {
    /* ─────────────────── 기본 입력 ─────────────────── */
    const [title, setTitle] = useState('');
    const [contents, setContents] = useState('');
    const [category, setCategory] = useState('자유');
    // ✅ 익명 작성 여부 상태 추가
    const [isAnonymous, setIsAnonymous] = useState(false);

    /* ─────────────────── 업로드 방식 ─────────────────── */
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

    // 파일 방식
    const [imageFiles, setImageFiles] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        /* 기존 URL 해제 후 새로 생성 */
        previewImages.forEach(URL.revokeObjectURL);
        setImageFiles(files);
        setPreviewImages(files.map((f) => URL.createObjectURL(f)));
    };

    const removeFile = (idx) => {
        URL.revokeObjectURL(previewImages[idx]);
        setImageFiles((prev) => prev.filter((_, i) => i !== idx));
        setPreviewImages((prev) => prev.filter((_, i) => i !== idx));
    };

    /* ─────────────────── 기타 UI 상태 ─────────────────── */
    const [error, setError] = useState('');
    const navigate = useNavigate();

    /* ─────────────────── 사이드바 데이터 ─────────────────── */
    const [sideTab, setSideTab] = useState('viewed');
    const [topViewed, setTopViewed] = useState([]);
    const [topCommented, setTopCommented] = useState([]);

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

    /* ─────────────────── 작성 제출 ─────────────────── */
    const currentUser = useAuthStore((s) => s.user);
    const userId = currentUser?._id;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('userId', userId);
        fd.append('communityTitle', title);
        fd.append('communityContents', contents);
        fd.append('communityCategory', category);
        // ✅ 익명 여부 추가
        fd.append('isAnonymous', isAnonymous);

        if (uploadMethod === 'file') {
            imageFiles.forEach((f) => fd.append('communityImages', f));
        } else {
            imageUrls
                .filter((u) => u.trim())
                .forEach((u) => fd.append('communityImages', u.trim()));
        }

        try {
            await createCommunity(fd);
            navigate('/community');
        } catch {
            setError('게시글 생성에 실패했습니다.');
        }
    };
    const handleCategoryNav = (category) => navigate(`/community?category=${category}`);

    /* ─────────────────── 렌더 ─────────────────── */
    return (
        <CommunityLayout
            leftSidebar={        <LeftSidebar
                selectedCategory={category}
                handleCategoryClick={handleCategoryNav}
            />}
            rightSidebar={
                <RightSidebar
                    sideTab={sideTab}
                    setSideTab={setSideTab}
                    topViewed={topViewed}
                    topCommented={topCommented}
                />
            }
        >
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                    {/* 헤더 */}
                    <div className="bg-gradient-to-r from-green-400 to-blue-500 px-6 py-4">
                        <h1 className="text-2xl font-semibold text-white">새 게시글 작성</h1>
                    </div>

                    {/* 작성 폼 */}
                    <form
                        onSubmit={handleSubmit}
                        encType="multipart/form-data"
                        className="px-6 py-8 space-y-8"
                    >
                        {error && (
                            <p className="text-center text-red-500 font-medium">{error}</p>
                        )}

                        {/* ✅ 익명 작성 체크박스 추가 */}
                        <div>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={isAnonymous}
                                    onChange={(e) => setIsAnonymous(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">익명으로 작성</span>
                            </label>
                        </div>

                        {/* 제목·카테고리 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                placeholder="제목"
                                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-green-300 w-full"
                            />
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-green-300 w-full"
                            >
                                {['자유', '유머', '질문', '사건사고', '전적인증', '개발요청'].map((c) => (
                                    <option key={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* 내용 */}
                        <textarea
                            value={contents}
                            onChange={(e) => setContents(e.target.value)}
                            rows={6}
                            required
                            placeholder="내용을 입력하세요"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-green-300 resize-none"
                        />

                        {/* 업로드 방식 라디오 */}
                        <div>
                            <span className="block font-medium mb-2">이미지 업로드 방식</span>
                            {['url', 'file'].map((m) => (
                                <label
                                    key={m}
                                    className={`mr-8 cursor-pointer ${
                                        uploadMethod === m ? 'text-green-600 font-semibold' : ''
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="uploadMethod"
                                        value={m}
                                        checked={uploadMethod === m}
                                        onChange={() => setUploadMethod(m)}
                                        className="mr-2"
                                    />
                                    {m === 'url' ? 'URL' : '파일 업로드'}
                                </label>
                            ))}
                        </div>

                        {/* URL 입력 */}
                        {uploadMethod === 'url' && (
                            <div>
                                <label className="block font-medium mb-2">
                                    이미지 URL (최대 {MAX_URL_COUNT}개)
                                </label>

                                {imageUrls.map((url, idx) => (
                                    <div key={idx} className="flex items-center mb-2 space-x-2">
                                        <input
                                            type="text"
                                            value={url}
                                            onChange={(e) => handleUrlChange(idx, e.target.value)}
                                            placeholder="https://example.com/image.jpg"
                                            className="flex-grow border border-gray-300 rounded-lg px-4 py-2 focus:ring-green-300"
                                        />
                                        {imageUrls.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeUrlInput(idx)}
                                                className="text-red-500 font-semibold"
                                            >
                                                삭제
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {imageUrls.length < MAX_URL_COUNT && (
                                    <button
                                        type="button"
                                        onClick={addUrlInput}
                                        className="text-green-600 font-semibold"
                                    >
                                        URL 추가
                                    </button>
                                )}

                                {/* URL 미리보기 */}
                                <div className="flex gap-2 flex-wrap mt-2">
                                    {imageUrls
                                        .filter((u) => u.trim())
                                        .map((u, i) => (
                                            <img
                                                key={i}
                                                src={u}
                                                alt={`미리보기 ${i + 1}`}
                                                className="h-24 w-auto rounded"
                                            />
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* 파일 입력 */}
                        {uploadMethod === 'file' && (
                            <>
                                <label className="block font-medium mb-2">이미지 파일</label>
                                <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        multiple
                                    />
                                    <span className="text-gray-500">여기를 클릭해서 파일 선택</span>
                                </label>

                                {/* 파일 미리보기 */}
                                <div className="flex gap-2 flex-wrap mt-2">
                                    {previewImages.map((src, idx) => (
                                        <div key={src} className="relative">
                                            <img
                                                src={src}
                                                alt={`미리보기 ${idx + 1}`}
                                                className="h-24 w-auto rounded"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeFile(idx)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* 제출 */}
                        <div className="text-center">
                            <button
                                type="submit"
                                className="bg-green-500 text-white font-medium px-8 py-2 rounded-lg hover:bg-green-600"
                            >
                                작성하기
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </CommunityLayout>
    );
};

export default CommunityForm;
