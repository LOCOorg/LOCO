import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMissingConsents, submitConsent } from '../../api/termAPI';
import useAuthStore from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import CommonModal from '../../common/CommonModal';

const TermConsentModal = () => {
    const { user, logout } = useAuthStore();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [selectedTerms, setSelectedTerms] = useState([]);
    const [expandedTermId, setExpandedTermId] = useState(null);

    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    // 로그인 상태일 때만 체크 (user가 존재할 때)
    const { data: missingTerms, isLoading } = useQuery({
        queryKey: ['missingConsents', user?._id], // 유저 ID가 바뀌면(로그인/로그아웃) 쿼리 다시 실행
        queryFn: getMissingConsents,
        enabled: !!user, // user가 있을 때만 실행
        staleTime: 0,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        retry: false,
    });

    const mutation = useMutation({
        mutationFn: submitConsent,
        onSuccess: (data, variables) => {
            // 성공 시 캐시 무효화하여 모달 닫히게 함
            queryClient.invalidateQueries(['missingConsents']);
            
            // 전달된 변수(variables) 중 agreed: true가 하나라도 있는 경우만 알림 표시
            const hasAgreedAny = variables.some(v => v.agreed);
            if (hasAgreedAny) {
                setAlertMessage('약관에 동의하였습니다.');
                setIsAlertOpen(true);
            }
        },
        onError: (error) => {
            setAlertMessage('동의 처리에 실패했습니다. 다시 시도해주세요.');
            setIsAlertOpen(true);
        }
    });

    useEffect(() => {
        if (missingTerms?.data) {
            // 처음에는 아무것도 선택 안 하거나, 필요시 전체 선택 로직 추가 가능
        }
    }, [missingTerms]);

    const handleCheckboxChange = (termId) => {
        setSelectedTerms(prev => 
            prev.includes(termId) 
                ? prev.filter(id => id !== termId)
                : [...prev, termId]
        );
    };

    const handleAllCheck = () => {
        if (!missingTerms?.data) return;
        if (selectedTerms.length === missingTerms.data.length) {
            setSelectedTerms([]);
        } else {
            setSelectedTerms(missingTerms.data.map(t => t._id));
        }
    };

    const handleSubmit = () => {
        if (!missingTerms?.data) return;
        
        // 필수 약관 체크 확인
        const requiredTerms = missingTerms.data.filter(t => t.isRequired);
        const requiredIds = requiredTerms.map(t => t._id);
        const isAllRequiredChecked = requiredIds.every(id => selectedTerms.includes(id));

        if (!isAllRequiredChecked) {
            setAlertMessage('필수 약관에 모두 동의해야 서비스를 이용할 수 있습니다.');
            setIsAlertOpen(true);
            return;
        }

        // 서버 전송 데이터 구성
        const consents = missingTerms.data.map(term => ({
            termId: term._id,
            agreed: selectedTerms.includes(term._id)
        }));

        mutation.mutate(consents);
    };

    const handleLogout = async () => {
        if (window.confirm('약관에 동의하지 않으면 서비스를 이용할 수 없습니다. 로그아웃 하시겠습니까?')) {
            await logout();
            navigate('/');
        }
    };

    // 로딩 중이거나, 미동의 약관이 없으면 렌더링 안 함
    if (isLoading || !missingTerms?.data || missingTerms.data.length === 0) {
        return null;
    }

    // 필수 약관이 하나라도 있는지 확인
    const hasRequiredTerms = missingTerms.data.some(t => t.isRequired);
    // 버튼 문구 결정 (선택된 항목이 있으면 '동의하고 계속하기', 없으면 '닫기')
    const submitButtonText = selectedTerms.length > 0 ? '동의하고 계속하기' : '닫기';

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[9999]">
            <div className="bg-white w-full max-w-2xl p-6 rounded-lg shadow-2xl max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">서비스 이용 약관 변경 안내</h2>
                <p className="mb-6 text-gray-600">
                    서비스 이용을 위해 새로운 약관에 동의해주세요.
                </p>

                <div className="flex-1 overflow-y-auto mb-6 pr-2">
                    <div className="space-y-4">
                        {missingTerms.data.map((term) => (
                            <div key={term._id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`term-${term._id}`}
                                            checked={selectedTerms.includes(term._id)}
                                            onChange={() => handleCheckboxChange(term._id)}
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mr-3"
                                        />
                                        <label htmlFor={`term-${term._id}`} className="font-semibold text-gray-700 cursor-pointer select-none">
                                            [{term.isRequired ? '필수' : '선택'}] {term.type === 'TERMS' ? '이용약관' : term.type === 'PRIVACY' ? '개인정보 처리방침' : '마케팅 정보 수신'} (v{term.version})
                                        </label>
                                    </div>
                                    <button 
                                        onClick={() => setExpandedTermId(expandedTermId === term._id ? null : term._id)}
                                        className="text-sm text-blue-500 hover:underline"
                                    >
                                        {expandedTermId === term._id ? '접기' : '내용 보기'}
                                    </button>
                                </div>
                                
                                {expandedTermId === term._id && (
                                    <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-600 h-40 overflow-y-auto border border-gray-100">
                                        <div dangerouslySetInnerHTML={{ __html: term.content }} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t pt-4">
                    <div className="flex items-center mb-4">
                        <input
                            type="checkbox"
                            id="check-all"
                            checked={missingTerms.data.length > 0 && selectedTerms.length === missingTerms.data.length}
                            onChange={handleAllCheck}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mr-2"
                        />
                        <label htmlFor="check-all" className="font-bold text-gray-800 cursor-pointer select-none">
                            전체 동의하기
                        </label>
                    </div>

                    <div className="flex justify-end gap-3">
                        {/* 필수 사항이 있을 때만 로그아웃 버튼 표시 */}
                        {hasRequiredTerms && (
                            <button
                                onClick={handleLogout}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                            >
                                다음에 하기 (로그아웃)
                            </button>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={mutation.isPending}
                            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                        >
                            {mutation.isPending ? '처리 중...' : submitButtonText}
                        </button>
                    </div>
                </div>
            </div>
            <CommonModal
                isOpen={isAlertOpen}
                onClose={() => setIsAlertOpen(false)}
                title="알림"
                onConfirm={() => setIsAlertOpen(false)}
                showCancel={false}
                zIndex={10000}
            >
                {alertMessage}
            </CommonModal>
        </div>
    );
};

export default TermConsentModal;
