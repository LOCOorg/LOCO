// src/components/CommunityEdit.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCommunityById, updateCommunity } from '../../api/communityApi.js';

const CommunityEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [community, setCommunity] = useState(null);
    const [title, setTitle] = useState('');
    const [contents, setContents] = useState('');
    const [category, setCategory] = useState('자유');
    const [uploadMethod, setUploadMethod] = useState('url'); // 'url' 또는 'file'
    const [imageUrl, setImageUrl] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadCommunity = async () => {
            try {
                const data = await fetchCommunityById(id);
                setCommunity(data);
                setTitle(data.communityTitle);
                setContents(data.communityContents);
                setCategory(data.communityCategory);
                // 기본적으로 기존 이미지가 있으면 URL 방식으로 처리
                if (data.communityImage) {
                    setUploadMethod('url');
                    setImageUrl(data.communityImage);
                }
                // eslint-disable-next-line no-unused-vars
            } catch (err) {
                setError('게시글 정보를 불러오는 데 실패했습니다.');
            }
        };

        loadCommunity();
    }, [id]);

    const handleFileChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('communityTitle', title);
        formData.append('communityContents', contents);
        formData.append('communityCategory', category);

        if (uploadMethod === 'file' && imageFile) {
            formData.append('communityImage', imageFile);
        } else if (uploadMethod === 'url' && imageUrl.trim()) {
            formData.append('communityImage', imageUrl.trim());
        } else {
            formData.append('communityImage', '');
        }

        try {
            await updateCommunity(id, formData);
            navigate(`/community/${id}`);
            // eslint-disable-next-line no-unused-vars
        } catch (err) {
            setError('게시글 수정에 실패했습니다.');
        }
    };

    if (!community) {
        return (
            <div className="flex justify-center items-center h-screen">
                로딩중...
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="bg-white shadow-md rounded-lg p-6">
                <h1 className="text-2xl font-bold mb-4">게시글 수정</h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-4">
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">제목:</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">내용:</label>
                        <textarea
                            value={contents}
                            onChange={(e) => setContents(e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">카테고리:</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                        >
                            <option value="자유">자유</option>
                            <option value="유머">유머</option>
                            <option value="질문">질문</option>
                            <option value="사건사고">사건사고</option>
                            <option value="전적인증">전적인증</option>
                        </select>
                    </div>
                    {/* 이미지 업로드 방식 선택 */}
                    <div>
            <span className="block text-gray-700 font-medium mb-2">
              이미지 업로드 방식:
            </span>
                        <div className="flex items-center space-x-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    value="url"
                                    checked={uploadMethod === 'url'}
                                    onChange={(e) => setUploadMethod(e.target.value)}
                                    className="form-radio"
                                />
                                <span className="ml-2">URL</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    value="file"
                                    checked={uploadMethod === 'file'}
                                    onChange={(e) => setUploadMethod(e.target.value)}
                                    className="form-radio"
                                />
                                <span className="ml-2">파일</span>
                            </label>
                        </div>
                    </div>
                    {uploadMethod === 'url' ? (
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">
                                이미지 URL:
                            </label>
                            <input
                                type="text"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="이미지 URL을 입력하세요"
                                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-gray-700 font-medium mb-2">
                                이미지 파일:
                            </label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept="image/*"
                                className="w-full"
                            />
                        </div>
                    )}
                    <button
                        type="submit"
                        className="bg-blue-500 text-white font-semibold py-2 px-4 rounded hover:bg-blue-600 transition duration-200"
                    >
                        수정하기
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CommunityEdit;
