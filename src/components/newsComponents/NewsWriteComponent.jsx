import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { newsService } from '../../api/newsAPI.js';
import { editorService } from '../../api/editorAPI.js';
import { toast } from 'react-toastify';
import MDEditor from '@uiw/react-md-editor';

const NewsWriteComponent = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: '공지사항',
        isImportant: false
    });
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef(null);
    const editorRef = useRef(null);

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

    // 이미지 업로드 후 커서 위치에 삽입하는 함수
    const insertImageAtCursor = useCallback(async (file) => {
        if (!file || !file.type.startsWith('image/')) {
            toast.error('이미지 파일만 업로드 가능합니다.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('이미지 파일은 5MB 이하만 업로드 가능합니다.');
            return;
        }

        try {
            setUploadingImage(true);
            const response = await editorService.uploadEditorImage(file);
            
            if (response.success) {
                const imageUrl = `${import.meta.env.VITE_API_HOST}${response.data.url}`;
                const markdownImage = `![${response.data.originalName}](${imageUrl})`;
                
                // 현재 커서 위치 가져오기
                const textarea = document.querySelector('.w-md-editor-text-textarea');
                if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const currentContent = formData.content;
                    
                    // 커서 위치에 이미지 삽입
                    const newContent = currentContent.slice(0, start) + 
                                     '\n' + markdownImage + '\n' + 
                                     currentContent.slice(end);
                    
                    setFormData(prev => ({
                        ...prev,
                        content: newContent
                    }));
                    
                    // 커서 위치 복원
                    setTimeout(() => {
                        const newCursorPos = start + markdownImage.length + 2;
                        textarea.focus();
                        textarea.setSelectionRange(newCursorPos, newCursorPos);
                    }, 100);
                } else {
                    // 폴백: 내용 끝에 추가
                    setFormData(prev => ({
                        ...prev,
                        content: prev.content + '\n' + markdownImage + '\n'
                    }));
                }
                
                toast.success('이미지가 삽입되었습니다!');
            }
        } catch (error) {
            console.error('이미지 업로드 오류:', error);
            toast.error('이미지 업로드에 실패했습니다.');
        } finally {
            setUploadingImage(false);
        }
    }, [formData.content]);

    // 드래그 앤 드롭 핸들러
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length > 0) {
            imageFiles.forEach(file => insertImageAtCursor(file));
        }
    }, [insertImageAtCursor]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
    }, []);

    // 클립보드 붙여넣기 핸들러
    const handlePaste = useCallback((e) => {
        const items = Array.from(e.clipboardData.items);
        const imageItems = items.filter(item => item.type.startsWith('image/'));
        
        if (imageItems.length > 0) {
            e.preventDefault();
            imageItems.forEach(item => {
                const file = item.getAsFile();
                if (file) {
                    insertImageAtCursor(file);
                }
            });
        }
    }, [insertImageAtCursor]);

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

                {/* 내용 입력 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        내용 (마크다운 지원)
                    </label>
                    
                    {/* 사용법 안내 */}
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">💡 이미지 삽입 방법</h4>
                        <ul className="text-xs text-blue-700 space-y-1">
                            <li>• <strong>드래그 앤 드롭</strong>: 이미지를 에디터에 끌어다 놓기</li>
                            <li>• <strong>붙여넣기</strong>: 복사한 이미지를 Ctrl+V로 붙여넣기</li>
                            <li>• <strong>직접 업로드</strong>: 아래 첨부 이미지 섹션 이용</li>
                        </ul>
                    </div>
                    
                    {uploadingImage && (
                        <div className="mb-3 text-center">
                            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                                이미지 업로드 중...
                            </div>
                        </div>
                    )}
                    
                    {/* 마크다운 에디터 */}
                    <div 
                        data-color-mode="light"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onPaste={handlePaste}
                        className="border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
                    >
                        <MDEditor
                            ref={editorRef}
                            value={formData.content}
                            onChange={handleContentChange}
                            height={400}
                            placeholder="내용을 입력해주세요. 이미지를 드래그하거나 붙여넣기하여 삽입할 수 있습니다."
                        />
                    </div>
                    
                    {/* 마크다운 도움말 */}
                    <div className="mt-2 text-xs text-gray-500">
                        <details>
                            <summary className="cursor-pointer hover:text-gray-700">마크다운 도움말</summary>
                            <div className="mt-2 p-3 bg-gray-50 rounded">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <div><code># 제목 1</code> → <strong>큰 제목</strong></div>
                                    <div><code>## 제목 2</code> → <strong>중간 제목</strong></div>
                                    <div><code>**굵게**</code> → <strong>굵게</strong></div>
                                    <div><code>*기울임*</code> → <em>기울임</em></div>
                                    <div><code>- 목록</code> → • 목록</div>
                                    <div><code>[링크](URL)</code> → 링크</div>
                                    <div><code>![이미지](URL)</code> → 이미지</div>
                                    <div><code>드래그 & 드롭</code> → 자동 삽입</div>
                                </div>
                            </div>
                        </details>
                    </div>
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
                        disabled={loading || uploadingImage}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? '작성 중...' : '게시글 작성'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewsWriteComponent;
