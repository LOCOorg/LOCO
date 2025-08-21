import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { newsService } from '../../api/newsAPI.js';
import { editorService } from '../../api/editorAPI.js';
import { toast } from 'react-toastify';
import NovelEditor from '../editor/NovelEditor.jsx';
import ImageUploadTest from '../editor/ImageUploadTest.jsx';

const NewsWriteComponent = () => {
    const navigate = useNavigate();
    const editorRef = useRef(null);
    
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: '공지사항',
        isImportant: false
    });
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleContentChange = (content) => {
        setFormData(prev => ({
            ...prev,
            content: content
        }));
    };

    // 커스텀 이미지 업로드 핸들러 (에디터에서 사용)
    const handleImageUpload = async (file) => {
        try {
            console.log('이미지 업로드 시도:', file.name, file.size);
            
            // 서버 업로드 시도
            const response = await editorService.uploadEditorImage(file);
            
            console.log('서버 응답:', response);
            
            // 서버 업로드 성공 시
            if (response && response.success) {
                const imageUrl = `${import.meta.env.VITE_API_HOST}${response.data.url}`;
                console.log('서버 업로드 성공:', imageUrl);
                return imageUrl;
            } else {
                // 서버 업로드 실패 시 Base64로 폴백
                console.warn('서버 업로드 실패, Base64로 폴백:', response?.message || '알 수 없는 오류');
                
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        console.log('Base64 변환 완료');
                        resolve(e.target.result);
                    };
                    reader.readAsDataURL(file);
                });
            }
        } catch (error) {
            console.error('이미지 업로드 오류:', error);
            
            // 예외 발생 시도 Base64로 폴백
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        }
    };

    // 기존 첨부 이미지 관리
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + images.length > 10) {
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
            const response = await newsService.createNews(formData, images);
            
            if (response.success) {
                toast.success('게시글이 성공적으로 작성되었습니다.');
                navigate('/news');
            } else {
                toast.error(response.message || '게시글 작성에 실패했습니다.');
            }
        } catch (error) {
            console.error('게시글 작성 오류:', error);
            toast.error('게시글 작성에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">새소식 작성</h1>
                <p className="text-gray-600">공지사항과 이벤트를 작성할 수 있습니다.</p>
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

                {/* 중요 공지 체크박스 */}
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

                {/* 내용 입력 - Novel Editor */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        내용
                    </label>
                    
                    {/* 사용법 안내 */}
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Novel Editor 사용법</h4>
                        <ul className="text-xs text-blue-700 space-y-1">
                            <li>• <strong>슬래시 명령어</strong>: <code>/</code> 입력 후 원하는 기능 선택 (제목, 목록, 이미지 등)</li>
                            <li>• <strong>이미지 삽입</strong>: <code>/image</code> 또는 드래그앤드롭</li>
                            <li>• <strong>서식</strong>: 텍스트 선택 후 팝업 메뉴로 굵게, 기울임 등 적용</li>
                            <li>• <strong>제목</strong>: <code>/h1</code>, <code>/h2</code>, <code>/h3</code></li>
                            <li>• <strong>목록</strong>: <code>/ul</code> (불릿), <code>/ol</code> (번호)</li>
                            <li>• <strong>인용</strong>: <code>/quote</code></li>
                            <li>• <strong>코드</strong>: <code>/code</code></li>
                        </ul>
                    </div>
                    
                    {/* Novel Editor 컴포넌트 사용 */}
                    <NovelEditor
                        ref={editorRef}
                        value={formData.content}
                        onChange={handleContentChange}
                        onImageUpload={handleImageUpload}
                        placeholder="/ 를 입력하여 명령어를 사용하거나 바로 내용을 입력하세요..."
                        className="min-h-[400px]"
                    />
                </div>

                {/* 추가 첨부 이미지 (하단 표시용) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        추가 첨부 이미지 (게시글 하단 표시, 최대 10개)
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
                        onClick={() => navigate('/news')}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? '작성 중...' : '게시글 작성'}
                    </button>
                </div>

                {/* 테스트용 이미지 업로드 컴포넌트 (개발용) */}
                {import.meta.env.DEV && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="text-sm font-medium text-yellow-800 mb-3">🛠️ 개발자 도구 - 이미지 업로드 테스트</h4>
                        <ImageUploadTest />
                    </div>
                )}

                {/* 테스트용 도구 (개발용) */}
                {import.meta.env.DEV && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="text-sm font-medium text-yellow-800 mb-2">🔧 개발자 도구</h4>
                        <div className="space-x-2">
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        const response = await fetch(`${import.meta.env.VITE_API_HOST}/api/debug/editor-uploads`);
                                        const data = await response.json();
                                        console.log('📂 에디터 업로드 파일 목록:', data);
                                        toast.info(`에디터 파일 ${data.fileCount}개 확인됨`);
                                    } catch (error) {
                                        console.error('파일 목록 확인 실패:', error);
                                    }
                                }}
                                className="px-3 py-1 text-xs bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
                            >
                                업로드 파일 확인
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const editor = editorRef.current;
                                    if (editor) {
                                        const testImageUrl = `${import.meta.env.VITE_API_HOST}/uploads/news/editor/editor-1755707385705-313828660.jpg`;
                                        editor.insertImage(testImageUrl, '테스트 이미지');
                                        toast.info('테스트 이미지 삽입됨');
                                    }
                                }}
                                className="px-3 py-1 text-xs bg-blue-200 text-blue-800 rounded hover:bg-blue-300"
                            >
                                테스트 이미지 삽입
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const editor = editorRef.current;
                                    if (editor) {
                                        console.log('📝 에디터 HTML:', editor.getHTML());
                                        console.log('📝 현재 content state:', formData.content);
                                    }
                                }}
                                className="px-3 py-1 text-xs bg-green-200 text-green-800 rounded hover:bg-green-300"
                            >
                                내용 확인
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default NewsWriteComponent;