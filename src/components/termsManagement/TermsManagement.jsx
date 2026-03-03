import React, { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllTerms, createTerm, deleteTerm, updateTerm } from '../../api/termAPI';
import TipTapAdvancedEditor from '../editor/TipTapAdvancedEditor';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import useAuthStore from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';

const TermsManagement = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const editorRef = useRef(null);

    const [form, setForm] = useState({
        type: 'TERMS',
        version: '',
        content: '',
        effectiveDate: dayjs().add(7, 'days').format('YYYY-MM-DDTHH:mm'),
        isRequired: true
    });

    const [viewMode, setViewMode] = useState('list'); // 'list' or 'create' or 'detail'
    const [selectedTerm, setSelectedTerm] = useState(null);

    const { data: terms, isLoading } = useQuery({
        queryKey: ['terms'],
        queryFn: getAllTerms
    });

    const createMutation = useMutation({
        mutationFn: createTerm,
        onSuccess: () => {
            queryClient.invalidateQueries(['terms']);
            toast.success('약관이 성공적으로 등록되었습니다.');
            setViewMode('list');
            resetForm();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || '약관 등록 실패');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteTerm,
        onSuccess: () => {
            queryClient.invalidateQueries(['terms']);
            toast.success('약관이 삭제되었습니다.');
            setViewMode('list');
            setSelectedTerm(null);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || '약관 삭제 실패');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateTerm(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['terms']);
            toast.success('약관이 수정되었습니다.');
            setViewMode('list');
            setSelectedTerm(null);
            resetForm();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || '약관 수정 실패');
        }
    });

    const resetForm = () => {
        setForm({
            type: 'TERMS',
            version: '',
            content: '',
            effectiveDate: dayjs().add(7, 'days').format('YYYY-MM-DDTHH:mm'),
            isRequired: true
        });
        editorRef.current?.setContent('');
    };

    const handleDelete = () => {
        if (!selectedTerm) return;
        if (window.confirm(`[${selectedTerm.type}] v${selectedTerm.version} 약관을 정말 삭제하시겠습니까?\n관련된 사용자 동의 기록도 모두 삭제됩니다.`)) {
            deleteMutation.mutate(selectedTerm._id);
        }
    };

    const handleEdit = () => {
        if (!selectedTerm) return;
        setForm({
            type: selectedTerm.type,
            version: selectedTerm.version,
            content: selectedTerm.content,
            effectiveDate: dayjs(selectedTerm.effectiveDate).format('YYYY-MM-DDTHH:mm'),
            isRequired: selectedTerm.isRequired
        });
        setViewMode('create');
    };

    const handleSubmit = (e, isNewVersion = false) => {
        e.preventDefault();
        
        const content = editorRef.current?.getHTML() || '';
        
        if (!form.version || !content || content === '<p></p>') {
            toast.warn('버전과 내용을 모두 입력해주세요.');
            return;
        }

        if (selectedTerm && !isNewVersion) {
            if (window.confirm('단순 수정은 사용자에게 재동의를 받지 않습니다.\n오타 수정 등에만 사용해주세요.\n계속 하시겠습니까?')) {
                updateMutation.mutate({
                    id: selectedTerm._id,
                    data: { ...form, content }
                });
            }
        } else {
            createMutation.mutate({
                ...form,
                content
            });
        }
    };

    const handleEditorChange = (html) => {
        setForm(prev => ({ ...prev, content: html }));
    };

    const termTypeLabels = {
        'TERMS': '이용약관',
        'PRIVACY': '개인정보 처리방침',
        'MARKETING': '마케팅 정보 수신'
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">약관 관리</h1>
                {viewMode === 'list' ? (
                    <button
                        onClick={() => {
                            setSelectedTerm(null);
                            resetForm();
                            setViewMode('create');
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                        + 새 약관 등록
                    </button>
                ) : (
                    <button
                        onClick={() => setViewMode('list')}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                    >
                        목록으로 돌아가기
                    </button>
                )}
            </div>

            {viewMode === 'list' && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">로딩 중...</div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">종류</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">버전</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">필수여부</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시행일</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {terms?.data?.map((term) => (
                                    <tr key={term._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${term.type === 'TERMS' ? 'bg-blue-100 text-blue-800' : 
                                                  term.type === 'PRIVACY' ? 'bg-green-100 text-green-800' : 
                                                  'bg-yellow-100 text-yellow-800'}`}>
                                                {termTypeLabels[term.type]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{term.version}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {term.isRequired ? '필수' : '선택'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {dayjs(term.effectiveDate).format('YYYY-MM-DD HH:mm')}
                                            {dayjs().isAfter(term.effectiveDate) ?
                                                <span className="ml-2 text-green-600 text-xs font-bold">(시행중)</span> : 
                                                <span className="ml-2 text-orange-600 text-xs font-bold">(예정)</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {dayjs(term.createdAt).format('YYYY-MM-DD')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={() => {
                                                    setSelectedTerm(term);
                                                    setViewMode('detail');
                                                }}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                상세보기
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {viewMode === 'create' && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">
                        {selectedTerm ? '약관 수정 / 버전 업' : '새 약관 등록'}
                    </h2>
                    {selectedTerm && (
                        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                            <strong>💡 수정 가이드:</strong><br/>
                            - <b>단순 수정:</b> 오타 수정 등 내용이 크게 바뀌지 않은 경우 사용하세요. (유저 재동의 X)<br/>
                            - <b>새 버전으로 등록:</b> 법적 효력이 바뀌는 내용 변경 시 <b>버전을 올리고</b> 이 버튼을 누르세요. (유저 재동의 O)
                        </div>
                    )}
                    <form onSubmit={(e) => e.preventDefault()}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">약관 종류</label>
                                <select
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="TERMS">이용약관 (TERMS)</option>
                                    <option value="PRIVACY">개인정보 처리방침 (PRIVACY)</option>
                                    <option value="MARKETING">마케팅 정보 수신 (MARKETING)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">버전 (예: 1.0, 20251105)</label>
                                <input
                                    type="text"
                                    value={form.version}
                                    onChange={(e) => setForm({ ...form, version: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="1.0"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">시행일</label>
                                <input
                                    type="datetime-local"
                                    value={form.effectiveDate}
                                    onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                                    className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">* 시행일 이후에 로그인하는 유저에게 동의 팝업이 뜹니다.</p>
                            </div>
                            <div className="flex items-center pt-8">
                                <input
                                    type="checkbox"
                                    id="isRequired"
                                    checked={form.isRequired}
                                    onChange={(e) => setForm({ ...form, isRequired: e.target.checked })}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isRequired" className="ml-2 block text-sm text-gray-900">
                                    필수 동의 여부
                                </label>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">약관 내용</label>
                            <div className="border border-gray-300 rounded-lg">
                                <TipTapAdvancedEditor
                                    ref={editorRef}
                                    value={form.content}
                                    onChange={handleEditorChange}
                                    placeholder="약관 내용을 입력하세요..."
                                    className="min-h-[400px]"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                                취소
                            </button>
                            
                            {selectedTerm ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={(e) => handleSubmit(e, true)}
                                        disabled={createMutation.isPending}
                                        className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
                                    >
                                        {createMutation.isPending ? '처리 중...' : '새 버전으로 등록 (재동의 요청)'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => handleSubmit(e, false)}
                                        disabled={updateMutation.isPending}
                                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                                    >
                                        {updateMutation.isPending ? '처리 중...' : '단순 수정 (동의 유지)'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="submit"
                                    onClick={(e) => handleSubmit(e, false)}
                                    disabled={createMutation.isPending}
                                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                                >
                                    {createMutation.isPending ? '저장 중...' : '약관 등록'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {viewMode === 'detail' && selectedTerm && (
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-6 border-b pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">
                                [{termTypeLabels[selectedTerm.type]}] v{selectedTerm.version}
                            </h2>
                            <p className="text-gray-500 mt-1">
                                시행일: {dayjs(selectedTerm.effectiveDate).format('YYYY-MM-DD HH:mm')} |
                                {selectedTerm.isRequired ? ' 필수' : ' 선택'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleEdit}
                                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
                            >
                                수정
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                            >
                                삭제
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                    
                    <div className="prose max-w-none p-4 bg-gray-50 rounded border border-gray-200">
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedTerm.content) }} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default TermsManagement;
