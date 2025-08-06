// src/components/communitycomponents/CommunityEdit.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    fetchCommunityById,
    fetchTopCommented,
    fetchTopViewed,
    updateCommunity,
} from '../../api/communityApi.js';
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
    const [category, setCategory] = useState('자유');

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

    // 파일·기존 썸네일
    const [existingImages, setExistingImages] = useState([]); // 프리뷰 URL
    const [newFiles, setNewFiles] = useState([]);
    const handleNewFiles = (e) => {
        const files = Array.from(e.target.files);
        setNewFiles((prev) => [...prev, ...files]);
        setExistingImages((prev) => [
            ...prev,
            ...files.map((f) => URL.createObjectURL(f)),
        ]);
    };
    const removeImage = (src, idx) => {
        // blob URL → revoke
        if (src.startsWith('blob:')) URL.revokeObjectURL(src);
        setExistingImages((prev) => prev.filter((_, i) => i !== idx));
        setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    };

    /* ───────── 사이드바 데이터 ───────── */
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

    /* ───────── 초기 게시글 로드 ───────── */
    const [error, setError] = useState('');
    useEffect(() => {
        (async () => {
            try {
                const data = await fetchCommunityById(id);
                setTitle(data.communityTitle);
                setContents(data.communityContents);
                setCategory(data.communityCategory);

                // 기존 이미지 → 절대경로 프리뷰
                if (data.communityImages?.length) {
                    setExistingImages(data.communityImages.map((u) => `${API_HOST}${u}`));
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

        /* ① 기존 이미지 중 blob 아닌 것 → 상대경로로 변환 */
        existingImages
            .filter((u) => !u.startsWith('blob:'))
            .map((u) => u.replace(API_HOST, ''))
            .forEach((rel) => fd.append('communityImages', rel));

        /* ② 새 파일들 */
        newFiles.forEach((f) => fd.append('communityImages', f));

        /* ③ URL 방식 입력 */
        if (uploadMethod === 'url') {
            imageUrls
                .filter((u) => u.trim())
                .forEach((u) => fd.append('communityImages', u.trim()));
        }

        try {
            await updateCommunity(id, fd);
            navigate(`/community/${id}`);
        } catch {
            setError('게시글 수정에 실패했습니다.');
        }
    };

    /* ───────── 렌더 ───────── */
    return (
        <CommunityLayout
            leftSidebar={<LeftSidebar />}
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
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
                        <h1 className="text-2xl font-semibold text-white">게시글 수정</h1>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        encType="multipart/form-data"
                        className="px-6 py-8 space-y-8"
                    >
                        {error && (
                            <p className="text-center text-red-500 font-medium">{error}</p>
                        )}

                        {/* 제목·카테고리 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-400 w-full"
                            />
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-400 w-full"
                            >
                                {['자유', '유머', '질문', '사건사고', '전적인증'].map((c) => (
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
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-400 resize-none"
                        />

                        {/* 업로드 방식 라디오 */}
                        <div>
                            <span className="block font-medium mb-2">이미지 업로드 방식</span>
                            {['url', 'file'].map((m) => (
                                <label
                                    key={m}
                                    className={`mr-8 cursor-pointer ${
                                        uploadMethod === m ? 'text-blue-600 font-semibold' : ''
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
                                            value={url}
                                            onChange={(e) => handleUrlChange(idx, e.target.value)}
                                            placeholder="https://example.com/image.jpg"
                                            className="flex-grow border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-400"
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
                                        className="text-blue-600 font-semibold"
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

                        {/* 파일 입력 + 썸네일 */}
                        {uploadMethod === 'file' && (
                            <>
                                <label className="block font-medium mb-2">이미지 파일</label>

                                {/* 썸네일 */}
                                <div className="flex gap-2 flex-wrap mb-2">
                                    {existingImages.map((src, idx) => (
                                        <div key={src} className="relative">
                                            <img
                                                src={src}
                                                alt={`미리보기 ${idx + 1}`}
                                                className="h-24 w-auto rounded object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(src, idx)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleNewFiles}
                                        className="hidden"
                                        multiple
                                    />
                                    <span className="text-gray-500">여기를 클릭해서 파일 선택</span>
                                </label>
                            </>
                        )}

                        {/* 제출 */}
                        <div className="text-center">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white font-medium px-8 py-2 rounded-lg hover:bg-blue-700"
                            >
                                수정하기
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </CommunityLayout>
    );
};

export default CommunityEdit;
