import React, { forwardRef, useImperativeHandle, useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import ImageResize from 'tiptap-extension-resize-image';
import { Dropcursor } from '@tiptap/extension-dropcursor';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Focus from '@tiptap/extension-focus';
import { toast } from 'react-toastify';

const TipTapAdvancedEditor = forwardRef(({
    value = '',
    onChange,
    placeholder = '내용을 입력해주세요...',
    onImageUpload,
    className = '',
    readOnly = false,
    ...props
}, ref) => {
    
    const [isUploading, setIsUploading] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // 기본 이미지 확장 비활성화 (커스텀 이미지 사용)
                image: false,
            }),
            // 커스텀 이미지 리사이즈 확장
            ImageResize.configure({
                inline: false,  // 블록 레벨 이미지
                allowBase64: true,
                HTMLAttributes: {
                    class: 'custom-image',
                },
            }),
            // 드래그 앤 드롭 커서
            Dropcursor.configure({
                color: '#3b82f6',
                width: 3,
                class: 'drop-cursor',
            }),
            // 링크 지원
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'custom-link',
                },
            }),
            // 플레이스홀더
            Placeholder.configure({
                placeholder,
                showOnlyWhenEditable: true,
                showOnlyCurrent: false,
            }),
            // 포커스 표시
            Focus.configure({
                className: 'has-focus',
                mode: 'all',
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange?.(html);
        },
        editable: !readOnly,
        editorProps: {
            attributes: {
                class: 'prose prose-lg dark:prose-invert prose-headings:font-title font-default focus:outline-none max-w-full min-h-[400px] p-4',
            },
            // 이미지 드래그 앤 드롭 핸들링
            handleDrop: (view, event, slice, moved) => {
                const files = Array.from(event.dataTransfer?.files || []);
                if (files.length > 0) {
                    const imageFiles = files.filter(file => file.type.startsWith('image/'));
                    if (imageFiles.length > 0) {
                        event.preventDefault();
                        imageFiles.forEach(file => handleImageUpload(file));
                        return true;
                    }
                }
                return false;
            },
            // 이미지 붙여넣기 핸들링
            handlePaste: (view, event, slice) => {
                const files = Array.from(event.clipboardData?.files || []);
                if (files.length > 0) {
                    const imageFiles = files.filter(file => file.type.startsWith('image/'));
                    if (imageFiles.length > 0) {
                        event.preventDefault();
                        imageFiles.forEach(file => handleImageUpload(file));
                        return true;
                    }
                }
                return false;
            },
        },
    });

    // 외부에서 에디터 인스턴스에 접근할 수 있도록 ref 노출
    useImperativeHandle(ref, () => ({
        getEditor: () => editor,
        focus: () => editor?.commands.focus(),
        insertText: (text) => {
            editor?.commands.insertContent(text);
        },
        insertImage: (url, alt = '', width = null, height = null) => {
            const attrs = { src: url, alt };
            if (width) attrs.width = width;
            if (height) attrs.height = height;
            editor?.commands.setImage(attrs);
        },
        getHTML: () => {
            return editor?.getHTML() || '';
        },
        clear: () => {
            editor?.commands.clearContent();
        },
        setContent: (content) => {
            editor?.commands.setContent(content);
        },
    }));

    // 이미지 업로드 핸들러
    const handleImageUpload = useCallback(async (file) => {
        if (!file || !file.type.startsWith('image/')) {
            toast.error('이미지 파일만 업로드 가능합니다.');
            return;
        }

        // 파일 크기 체크 (10MB 제한)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('이미지 크기는 10MB 이하여야 합니다.');
            return;
        }

        setIsUploading(true);
        
        try {
            let imageUrl;
            
            if (onImageUpload) {
                // 커스텀 업로드 함수 사용 (이미 Base64 폴백 처리 포함)
                imageUrl = await onImageUpload(file);
            } else {
                // 기본 처리: Base64로 변환
                imageUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                });
            }

            // 에디터에 이미지 삽입
            editor?.commands.setImage({ 
                src: imageUrl, 
                alt: file.name,
                title: file.name 
            });
            
            // 서버 업로드인지 Base64인지에 따라 다른 메시지
            if (imageUrl.startsWith('data:')) {
                toast.info('이미지가 임시로 삽입되었습니다. (로컬 저장)');
            } else {
                toast.success('이미지가 업로드되었습니다.');
            }
        } catch (error) {
            console.error('이미지 업로드 실패:', error);
            toast.error('이미지 업로드에 실패했습니다.');
        } finally {
            setIsUploading(false);
        }
    }, [editor, onImageUpload]);

    // 이미지 업로드 버튼 클릭 핸들러
    const handleImageButtonClick = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.onchange = async (e) => {
            const files = Array.from(e.target.files || []);
            for (const file of files) {
                await handleImageUpload(file);
            }
        };
        input.click();
    }, [handleImageUpload]);

    // 링크 추가 핸들러
    const handleLinkButtonClick = useCallback(() => {
        const url = window.prompt('링크 URL을 입력하세요:');
        if (url) {
            editor?.commands.setLink({ href: url });
        }
    }, [editor]);

    // 링크 제거 핸들러
    const handleUnlinkButtonClick = useCallback(() => {
        editor?.commands.unsetLink();
    }, [editor]);

    if (!editor) {
        return (
            <div className="flex items-center justify-center h-64 border border-gray-300 rounded-lg">
                <div className="text-gray-500">에디터를 로딩중입니다...</div>
            </div>
        );
    }

    const isLinkActive = editor.isActive('link');

    return (
        <div className={`tiptap-advanced-editor ${className}`}>
            {/* 툴바 */}
            <div className="border border-gray-300 border-b-0 rounded-t-lg p-2 bg-gray-50 flex flex-wrap gap-2 items-center">
                {/* 텍스트 포맷팅 */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        disabled={!editor.can().chain().focus().toggleBold().run()}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                            editor.isActive('bold') 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50'
                        }`}
                    >
                        굵게
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        disabled={!editor.can().chain().focus().toggleItalic().run()}
                        className={`px-3 py-1 rounded text-sm ${
                            editor.isActive('italic') 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50'
                        }`}
                    >
                        기울임
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        disabled={!editor.can().chain().focus().toggleStrike().run()}
                        className={`px-3 py-1 rounded text-sm ${
                            editor.isActive('strike') 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50'
                        }`}
                    >
                        취소선
                    </button>
                </div>

                {/* 제목 */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={`px-3 py-1 rounded text-sm ${
                            editor.isActive('heading', { level: 1 }) 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        H1
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`px-3 py-1 rounded text-sm ${
                            editor.isActive('heading', { level: 2 }) 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        H2
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        className={`px-3 py-1 rounded text-sm ${
                            editor.isActive('heading', { level: 3 }) 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        H3
                    </button>
                </div>

                {/* 목록 */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`px-3 py-1 rounded text-sm ${
                            editor.isActive('bulletList') 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        • 목록
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`px-3 py-1 rounded text-sm ${
                            editor.isActive('orderedList') 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        1. 번호
                    </button>
                </div>

                {/* 인용 */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={`px-3 py-1 rounded text-sm ${
                            editor.isActive('blockquote') 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        인용
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        className={`px-3 py-1 rounded text-sm ${
                            editor.isActive('codeBlock') 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        코드
                    </button>
                </div>

                {/* 미디어 */}
                <div className="flex gap-1 border-r border-gray-300 pr-2">
                    <button
                        type="button"
                        onClick={handleImageButtonClick}
                        disabled={isUploading}
                        className="px-3 py-1 rounded text-sm bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUploading ? '업로드중...' : '📷 이미지'}
                    </button>
                    <button
                        type="button"
                        onClick={isLinkActive ? handleUnlinkButtonClick : handleLinkButtonClick}
                        className={`px-3 py-1 rounded text-sm ${
                            isLinkActive 
                                ? 'bg-red-500 text-white hover:bg-red-600' 
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                    >
                        {isLinkActive ? '링크 해제' : '🔗 링크'}
                    </button>
                </div>

                {/* 실행취소/다시실행 */}
                <div className="flex gap-1">
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().chain().focus().undo().run()}
                        className="px-3 py-1 rounded text-sm bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                        ↶ 실행취소
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().chain().focus().redo().run()}
                        className="px-3 py-1 rounded text-sm bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                        ↷ 다시실행
                    </button>
                </div>
            </div>

            {/* 에디터 내용 */}
            <div className="border border-gray-300 rounded-b-lg relative">
                <EditorContent 
                    editor={editor} 
                    className="focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent rounded-b-lg"
                />
                
                {/* 업로드 중 오버레이 */}
                {isUploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-b-lg">
                        <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
                            <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                <span className="text-sm text-gray-700">이미지 업로드 중...</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* 커스텀 스타일 */}
            <style>{`
                .tiptap-advanced-editor .ProseMirror {
                    outline: none;
                    padding: 1rem;
                    min-height: 400px;
                }
                
                /* 이미지 스타일 */
                .tiptap-advanced-editor .custom-image {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .tiptap-advanced-editor .custom-image:hover {
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    transform: translateY(-1px);
                }
                
                /* 선택된 이미지 */
                .tiptap-advanced-editor .ProseMirror-selectednode .custom-image {
                    outline: 3px solid #3b82f6;
                    outline-offset: 2px;
                }
                
                /* 리사이즈 핸들 스타일 */
                .tiptap-advanced-editor .resize-trigger {
                    position: absolute;
                    background: #3b82f6;
                    border: 2px solid white;
                    border-radius: 50%;
                    width: 12px;
                    height: 12px;
                    cursor: nw-resize;
                }
                
                /* 드롭 커서 스타일 */
                .tiptap-advanced-editor .drop-cursor {
                    pointer-events: none;
                    height: 3px;
                    background-color: #3b82f6;
                    border-radius: 1px;
                    position: relative;
                }
                
                .tiptap-advanced-editor .drop-cursor::before {
                    content: '';
                    position: absolute;
                    left: -6px;
                    top: -3px;
                    width: 12px;
                    height: 9px;
                    background-color: #3b82f6;
                    border-radius: 50%;
                }
                
                /* 제목 스타일 */
                .tiptap-advanced-editor .ProseMirror h1 {
                    font-size: 2rem;
                    font-weight: bold;
                    margin-top: 2rem;
                    margin-bottom: 1rem;
                    line-height: 1.2;
                }
                
                .tiptap-advanced-editor .ProseMirror h2 {
                    font-size: 1.5rem;
                    font-weight: bold;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                    line-height: 1.3;
                }
                
                .tiptap-advanced-editor .ProseMirror h3 {
                    font-size: 1.25rem;
                    font-weight: bold;
                    margin-top: 1rem;
                    margin-bottom: 0.5rem;
                    line-height: 1.4;
                }
                
                /* 인용문 스타일 */
                .tiptap-advanced-editor .ProseMirror blockquote {
                    border-left: 4px solid #3b82f6;
                    padding-left: 1rem;
                    margin: 1rem 0;
                    color: #6b7280;
                    font-style: italic;
                    background-color: #f8fafc;
                    border-radius: 0 0.5rem 0.5rem 0;
                }
                
                /* 코드 블록 스타일 */
                .tiptap-advanced-editor .ProseMirror code {
                    background-color: #f3f4f6;
                    padding: 0.125rem 0.25rem;
                    border-radius: 0.25rem;
                    font-family: 'Monaco', 'Consolas', monospace;
                    font-size: 0.875rem;
                }
                
                .tiptap-advanced-editor .ProseMirror pre {
                    background-color: #1f2937;
                    color: #f9fafb;
                    padding: 1rem;
                    border-radius: 0.5rem;
                    overflow-x: auto;
                    margin: 1rem 0;
                    font-family: 'Monaco', 'Consolas', monospace;
                }
                
                .tiptap-advanced-editor .ProseMirror pre code {
                    background: none;
                    padding: 0;
                    color: inherit;
                }
                
                /* 목록 스타일 */
                .tiptap-advanced-editor .ProseMirror ul, 
                .tiptap-advanced-editor .ProseMirror ol {
                    padding-left: 1.5rem;
                    margin: 0.5rem 0;
                }
                
                .tiptap-advanced-editor .ProseMirror li {
                    margin: 0.25rem 0;
                    line-height: 1.6;
                }
                
                /* 링크 스타일 */
                .tiptap-advanced-editor .custom-link {
                    color: #3b82f6;
                    text-decoration: underline;
                    cursor: pointer;
                    transition: color 0.2s ease;
                }
                
                .tiptap-advanced-editor .custom-link:hover {
                    color: #1d4ed8;
                }
                
                /* 포커스 스타일 */
                .tiptap-advanced-editor .has-focus {
                    border-radius: 0.25rem;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
                }
                
                /* 플레이스홀더 스타일 */
                .tiptap-advanced-editor .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #9ca3af;
                    pointer-events: none;
                    height: 0;
                    font-style: italic;
                }
                
                /* 반응형 디자인 */
                @media (max-width: 768px) {
                    .tiptap-advanced-editor .ProseMirror {
                        padding: 0.75rem;
                        min-height: 300px;
                    }
                    
                    .tiptap-advanced-editor .custom-image {
                        max-width: 100%;
                    }
                }
            `}</style>
        </div>
    );
});

TipTapAdvancedEditor.displayName = 'TipTapAdvancedEditor';

export default TipTapAdvancedEditor;