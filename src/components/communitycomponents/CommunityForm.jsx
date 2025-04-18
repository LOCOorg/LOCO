// src/components/communitycomponents/CommunityForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCommunity } from '../../api/communityAPI.js';
import useAuthStore from '../../stores/authStore.js';  // 추가

const CommunityForm = () => {
    const [title, setTitle] = useState('');
    const [contents, setContents] = useState('');
    const [category, setCategory] = useState('자유');
    const [uploadMethod, setUploadMethod] = useState('url'); // 'url' 또는 'file'
    const [imageUrl, setImageUrl] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const currentUser = useAuthStore((state) => state.user);  // 추가
    const userId = currentUser?._id;

    const handleFileChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('userId', userId); // useAuthStore에서 받아온 값 사용
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
            await createCommunity(formData);
            navigate('/community');
        } catch (err) {
            setError('게시글 생성에 실패했습니다.');
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="bg-white shadow-md rounded-lg p-6">
                <h1 className="text-2xl font-bold mb-4">새 게시글 작성</h1>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                    encType="multipart/form-data"
                >
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">
                            제목:
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">
                            내용:
                        </label>
                        <textarea
                            value={contents}
                            onChange={(e) => setContents(e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">
                            카테고리:
                        </label>
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
                        작성하기
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CommunityForm;
