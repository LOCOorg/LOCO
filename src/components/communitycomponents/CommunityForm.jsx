// src/components/communitycomponents/CommunityForm.jsx
import {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import {createCommunity, fetchTopCommented, fetchTopViewed} from '../../api/communityAPI.js';
import useAuthStore from '../../stores/authStore.js';
import LeftSidebar from "../../layout/CommunityLayout/LeftSidebar.jsx";
import RightSidebar from "../../layout/CommunityLayout/RightSidebar.jsx";
import CommunityLayout from "../../layout/CommunityLayout/CommunityLayout.jsx";  // 추가

const CommunityForm = () => {
    const [title, setTitle] = useState('');
    const [contents, setContents] = useState('');
    const [category, setCategory] = useState('자유');
    const [uploadMethod, setUploadMethod] = useState('file'); // 'url' 또는 'file'
    const [imageUrl, setImageUrl] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [previewImage, setPreviewImage] = useState(null);
    const currentUser = useAuthStore((state) => state.user);  // 추가
    const userId = currentUser?._id;
    const [selectedCategory, setSelectedCategory] = useState('전체');
    const handleCategoryClick = (cat) => {
        setSelectedCategory(cat);
        navigate(cat === '전체' ? '/community'
            : `/community?category=${cat}`);
    };

    const [sideTab, setSideTab] = useState('viewed');
    const [topViewed, setTopViewed] = useState([]);
    const [topCommented, setTopCommented] = useState([]);

    // 선택된 파일로부터 객체 URL을 생성하고 cleanup
    useEffect(() => {
        if (!imageFile) {
            setPreviewImage(null);
            return;
        }
        const objectUrl = URL.createObjectURL(imageFile);
        setPreviewImage(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [imageFile]);

    useEffect(() => {
        const fetchGlobalTop = async () => {
            try {
                const viewedData = await fetchTopViewed(); // 커뮤니티 리스트와 동일 API
                setTopViewed(viewedData);
            } catch (error) {
                setTopViewed([]);
                console.log(error);
            }
            try {
                const commentedData = await fetchTopCommented();
                setTopCommented(commentedData);
            } catch (error) {
                setTopCommented([]);
                console.log(error);
            }
        };
        fetchGlobalTop();
    }, []);

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
        <CommunityLayout
            leftSidebar={
                <LeftSidebar
                    selectedCategory={selectedCategory}
                    handleCategoryClick={handleCategoryClick}
                />
            }
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
                    {error && <p className="text-center text-red-500 font-medium">{error}</p>}

                    {/* 1. 제목 + 카테고리 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-800 font-medium mb-2">제목</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="w-full border border-gray-300 rounded-lg px-4 py-2
                         focus:outline-none focus:ring-2 focus:ring-green-300 transition"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-800 font-medium mb-2">카테고리</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white
                         focus:outline-none focus:ring-2 focus:ring-green-300 transition"
                            >
                                <option value="자유">자유</option>
                                <option value="유머">유머</option>
                                <option value="질문">질문</option>
                                <option value="사건사고">사건사고</option>
                                <option value="전적인증">전적인증</option>
                            </select>
                        </div>
                    </div>

                    {/* 2. 내용 */}
                    <div>
                        <label className="block text-gray-800 font-medium mb-2">내용</label>
                        <textarea
                            value={contents}
                            onChange={(e) => setContents(e.target.value)}
                            required
                            rows={6}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2
                       focus:outline-none focus:ring-2 focus:ring-green-300 transition resize-none"
                        />
                    </div>

                    {/* 3. 업로드 방식 선택 */}
                    <div>
          <span className="block text-gray-800 font-medium mb-2">
            이미지 업로드 방식
          </span>
                        <div className="flex items-center space-x-8">
                            {['url', 'file'].map((method) => (
                                <label
                                    key={method}
                                    className={`flex items-center cursor-pointer ${
                                        uploadMethod === method
                                            ? 'text-green-600 font-semibold'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="uploadMethod"
                                        value={method}
                                        checked={uploadMethod === method}
                                        onChange={() => setUploadMethod(method)}
                                        className="form-radio h-5 w-5 text-green-500"
                                    />
                                    <span className="ml-2 capitalize">
                  {method === 'url' ? 'URL' : '파일 업로드'}
                </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 4. URL or File 입력 */}
                    {uploadMethod === 'url' ? (
                        <div>
                            <label className="block text-gray-800 font-medium mb-2">
                                이미지 URL
                            </label>
                            <input
                                type="text"
                                value={imageUrl || ''}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2
                         focus:outline-none focus:ring-2 focus:ring-green-300 transition"
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-gray-800 font-medium mb-2">
                                이미지 파일
                            </label>
                            <label
                                className="flex items-center justify-center w-full h-32 border-2 border-dashed
                         border-gray-300 rounded-lg cursor-pointer hover:border-green-400 transition"
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <span className="text-gray-500">여기를 클릭해서 파일 선택</span>
                            </label>
                        </div>
                    )}
                    {/* 미리보기 */}
                    {previewImage && (
                        <div>
                            <p className="text-gray-800 font-medium mb-2">미리보기</p>
                            <img src={previewImage} alt="preview" className="w-32 h-32 object-cover rounded-md shadow-sm" />
                        </div>
                    )}

                    {/* 5. 제출 버튼 */}
                    <div className="text-center">
                        <button
                            type="submit"
                            className="inline-block bg-green-500 text-white font-medium px-8 py-2
                       rounded-lg hover:bg-green-600 transition"
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
