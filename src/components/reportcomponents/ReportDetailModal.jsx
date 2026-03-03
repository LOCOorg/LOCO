import { useState, useEffect } from 'react';
import { replyToReport, fetchSingleReportedMessage, fetchReportedMessagePlaintext, fetchReportById } from '../../api/reportAPI.js';
import CommonModal from '../../common/CommonModal.jsx';

const ReportDetailModal = ({ reportId, onClose, onUpdateReport }) => {
    const [replyContent, setReplyContent] = useState('');
    const [suspensionDays, setSuspensionDays] = useState('');
    const [selectedStopDetail, setSelectedStopDetail] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [localReport, setLocalReport] = useState(null);
    const [modalInfo, setModalInfo] = useState({ isOpen: false, title: '', message: '' });

    // --- Plaintext Modal State ---
    const [showPlaintextModal, setShowPlaintextModal] = useState(false);
    const [viewMode, setViewMode] = useState('single'); // 'single' or 'all'
    const [singleMessageData, setSingleMessageData] = useState(null);
    const [allMessagesData, setAllMessagesData] = useState(null);
    const [totalReportedMessagesCount, setTotalReportedMessagesCount] = useState(0); // 추가된 상태

    // ✅ 이미지 경로 처리 헬퍼 함수
    const getImgSrc = (path) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const host = import.meta.env.VITE_API_HOST;
        return `${host}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    useEffect(() => {
        if (reportId) {
            fetchReportById(reportId)
                .then(data => {
                    setLocalReport(data);
                    setReplyContent(data?.reportAnswer || '');
                    setSelectedStopDetail(data?.stopDetail || '');
                })
                .catch(err => {
                    setModalInfo({ isOpen: true, title: '오류', message: `신고 정보를 불러오는 데 실패했습니다: ${err.message}` });
                });
        }
    }, [reportId]);

    const openPlaintextModal = async () => {
        if (!localReport?.anchor?.targetId) {
            setModalInfo({ isOpen: true, title: '오류', message: '신고 대상 메시지를 찾을 수 없습니다.' });
            return;
        }
        try {
            setViewMode('single'); // 항상 단일 보기로 시작
            const response = await fetchSingleReportedMessage(localReport.anchor.targetId);
            setSingleMessageData(response.reportedMessage);
            setTotalReportedMessagesCount(response.reportedMessage.totalReportedMessagesInRoom); // 상태 저장
            setShowPlaintextModal(true);
        } catch (err) {
            setModalInfo({ isOpen: true, title: '오류', message: err.message });
        }
    };

    const loadAllReportedMessages = async () => {
        try {
            const response = await fetchReportedMessagePlaintext(reportId);
            setAllMessagesData(response);
            setViewMode('all'); // 전체 보기로 전환
        } catch (err) {
            setModalInfo({ isOpen: true, title: '오류', message: err.message });
        }
    };

    const handleClosePlaintextModal = () => {
        setShowPlaintextModal(false);
        setSingleMessageData(null);
        setAllMessagesData(null);
        setTotalReportedMessagesCount(0); // 상태 초기화
    };

    const goTarget = () => {
        if (!localReport?.anchor) return;
        const { parentId, type, targetId } = localReport.anchor;
        window.open(`/community/${parentId}#${type}-${targetId}`, '_blank', 'noopener,noreferrer');
    };

    if (!localReport) return null;

    const handleReplySubmit = async () => {
        try {
            const updatedReport = await replyToReport(localReport._id, {
                reportAnswer: replyContent,
                suspensionDays: suspensionDays ? parseInt(suspensionDays) : 0,
                stopDetail: selectedStopDetail,
            });
            setLocalReport(updatedReport);
            setIsEditing(false);
            setModalInfo({ isOpen: true, title: '성공', message: '답변과 제재 내용이 성공적으로 저장되었습니다.' });
            if (onUpdateReport) {
                onUpdateReport(updatedReport);
            }
        } catch (error) {
            setModalInfo({ isOpen: true, title: '오류 발생', message: error.message });
        }
    };

    const closeModal = () => setModalInfo(prev => ({ ...prev, isOpen: false }));

    return (
        <>
            <div 
                className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                    {/* Header */}
                    <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <span className="text-red-500 text-2xl">🚨</span> 신고 상세 내역
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">신고번호: {localReport._id}</p>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600 font-bold text-2xl leading-none"
                        >
                            &times;
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Section 1: 기본 신고 정보 */}
                        <section>
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <div className="w-1 h-4 bg-indigo-500 rounded-full"></div> 기본 정보
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-500">신고 제목</span>
                                    <p className="text-sm font-semibold text-gray-800">{localReport.reportTitle}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-500">신고 구역 / 카테고리</span>
                                    <p className="text-sm">
                                        <span className="font-semibold text-indigo-600">{localReport.reportArea}</span>
                                        <span className="mx-2 text-gray-300">|</span>
                                        <span className="font-semibold text-gray-700">{localReport.reportCategory}</span>
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-500">신고일</span>
                                    <p className="text-sm text-gray-700">{new Date(localReport.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-500">신고 상태</span>
                                    <div>
                                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${
                                            localReport.reportStatus === 'pending' ? 'bg-orange-100 text-orange-600' :
                                            localReport.reportStatus === 'resolved' ? 'bg-green-100 text-green-600' :
                                            localReport.reportStatus === 'reviewed' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {
                                                localReport.reportStatus === 'pending' ? '대기 중' :
                                                localReport.reportStatus === 'reviewed' ? '검토 중' :
                                                localReport.reportStatus === 'resolved' ? '처리 완료' :
                                                localReport.reportStatus === 'dismissed' ? '반려(경고 처리)' : localReport.reportStatus
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 2: 당사자 정보 */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1 h-4 bg-blue-500 rounded-full"></div> 신고자
                                </h3>
                                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                        {localReport.reportErId?.nickname?.charAt(0) || '👤'}
                                    </div>
                                    <span className="font-bold text-blue-800">{localReport.reportErId?.nickname || '알 수 없음'}</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1 h-4 bg-red-500 rounded-full"></div> 가해 대상자
                                </h3>
                                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                                    <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center text-red-600 font-bold">
                                        {localReport.offenderId?.nickname?.charAt(0) || '🚫'}
                                    </div>
                                    <span className="font-bold text-red-800">{localReport.offenderId?.nickname || '알 수 없음'}</span>
                                </div>
                            </div>
                        </section>

                        {/* Section 3: 신고 상세 내용 */}
                        <section className="bg-amber-50 p-4 rounded-xl border border-amber-100 shadow-inner">
                            <h3 className="text-sm font-bold text-amber-700 mb-2 flex items-center gap-2">
                                📝 신고 상세 설명
                            </h3>
                            <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap italic">
                                "{localReport.reportContants}"
                            </p>
                        </section>

                        {/* Section 4: 증거 자료 */}
                        
                        {/* ─── 커뮤니티 증거 ─── */}
                        {localReport.reportArea === '커뮤니티' && 
                         (localReport.contentText || (localReport.contentImages && localReport.contentImages.length > 0)) && (
                            <section className="p-4 border-2 border-orange-100 bg-orange-50/30 rounded-2xl space-y-4">
                                <h3 className="text-sm font-black text-orange-600 flex items-center gap-2">
                                    📝 신고된 콘텐츠 확인 (커뮤니티)
                                </h3>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100">
                                    {localReport.contentText && (
                                        <div className="mb-4">
                                            <span className="text-[10px] font-bold text-gray-400 mb-1 block uppercase">작성 내용</span>
                                            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-800 whitespace-pre-wrap max-h-40 overflow-y-auto border">
                                                {localReport.contentText}
                                            </div>
                                        </div>
                                    )}
                                    {localReport.contentImages && localReport.contentImages.length > 0 && (
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-400 mb-2 block uppercase">첨부 이미지 ({localReport.contentImages.length})</span>
                                            <div className="flex flex-wrap gap-2">
                                                {localReport.contentImages.map((img, idx) => (
                                                    <img 
                                                        key={idx}
                                                        src={getImgSrc(img)} 
                                                        alt="증거"
                                                        className="w-24 h-24 object-cover rounded-lg border cursor-pointer hover:ring-2 ring-orange-400 transition-all shadow-sm"
                                                        onClick={() => window.open(getImgSrc(img), '_blank', 'noopener,noreferrer')}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* ─── 프로필 증거 ─── */}
                        {localReport.reportArea === '프로필' && (localReport.reportCategory?.includes('닉네임') || localReport.reportCategory?.includes('이미지')) && (
                            <section className="p-4 border-2 border-purple-100 bg-purple-50/30 rounded-2xl space-y-4">
                                <h3 className="text-sm font-black text-purple-600 flex items-center gap-2">
                                    👤 신고된 프로필 상태
                                </h3>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-100 space-y-4">
                                    {localReport.reportCategory?.includes('닉네임') && (
                                        <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                            <div>
                                                <span className="text-[10px] font-bold text-blue-400 block uppercase">현재 닉네임</span>
                                                <span className="text-lg font-bold text-gray-800">{localReport.offenderId?.nickname}</span>
                                            </div>
                                            <span className="text-[10px] bg-red-500 text-white px-2 py-1 rounded-full font-bold">제재 대상</span>
                                        </div>
                                    )}
                                    {localReport.reportCategory?.includes('이미지') && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between border-b pb-2">
                                                <span className="text-[10px] font-bold text-purple-400 uppercase">이미지 데이터</span>
                                                <span className="text-[10px] bg-red-500 text-white px-2 py-1 rounded-full font-bold">제재 대상</span>
                                            </div>
                                            <div className="flex gap-4">
                                                <div>
                                                    <span className="text-[10px] text-gray-400 mb-1 block">대표 사진</span>
                                                    <img 
                                                        src={getImgSrc(localReport.offenderId?.profilePhoto)} 
                                                        className="w-20 h-20 rounded-full object-cover border-2 border-purple-200 shadow-md cursor-pointer"
                                                        alt="프로필"
                                                        onClick={() => window.open(getImgSrc(localReport.offenderId?.profilePhoto), '_blank', 'noopener,noreferrer')}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-[10px] text-gray-400 mb-1 block">앨범 사진 ({localReport.offenderId?.photo?.length || 0})</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {localReport.offenderId?.photo?.map((p, i) => (
                                                            <img key={i} src={getImgSrc(p)} className="w-12 h-12 rounded-md object-cover border shadow-sm cursor-pointer" alt="앨범" onClick={() => window.open(getImgSrc(p), '_blank', 'noopener,noreferrer')} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* ─── 채팅 관련 버튼 ─── */}
                        {localReport.anchor?.type === 'chat' && (
                            <button onClick={openPlaintextModal} className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-rose-500 to-orange-500 shadow-lg hover:shadow-rose-500/30 transition-all active:scale-95 flex items-center justify-center gap-2">
                                🔍 신고된 채팅 대화 로그 확인
                            </button>
                        )}

                        {/* ─── 타겟 이동 버튼 ─── */}
                        {localReport.anchor?.type !== 'chat' && localReport.reportArea !== '프로필' && (
                            <button onClick={goTarget} className="w-full py-3 rounded-xl font-bold text-indigo-600 bg-indigo-50 border-2 border-indigo-100 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2">
                                📍 해당 원본 글로 이동하기 (새 창)
                            </button>
                        )}

                        {/* Section 5: 관리자 처분 내역 (기존 답변이 있을 때) */}
                        {localReport.reportAnswer && !isEditing && (
                            <section className="border-t pt-6">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <div className="w-1 h-4 bg-green-500 rounded-full"></div> 처리 결과
                                </h3>
                                <div className="bg-green-50 rounded-2xl p-5 border border-green-100 space-y-4 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <svg width="60" height="60" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-green-600 block mb-1">관리자 답변</span>
                                        <p className="text-sm text-green-900 leading-relaxed">{localReport.reportAnswer}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-4 pt-3 border-t border-green-200/50">
                                        <div className="text-xs">
                                            <span className="text-green-600/70 mr-2">담당 관리자:</span>
                                            <span className="font-bold text-green-800">{localReport.adminId?.nickname}</span>
                                        </div>
                                        <div className="text-xs">
                                            <span className="text-green-600/70 mr-2">최종 처분:</span>
                                            <span className="font-bold text-green-800">{localReport.stopDetail}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsEditing(true)} className="w-full mt-2 py-2 bg-white text-green-600 text-xs font-bold rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
                                        수정하기
                                    </button>
                                </div>
                            </section>
                        )}

                        {/* Section 6: 처분 입력 (신규 등록 또는 수정 모드) */}
                        {(!localReport.reportAnswer || isEditing) && (
                            <section className="border-t pt-6 space-y-4">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <div className="w-1 h-4 bg-blue-600 rounded-full"></div> 제재 및 답변 등록
                                </h3>
                                <div className="space-y-4 bg-white p-5 rounded-2xl border-2 border-blue-50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 ml-1">제재 종류</label>
                                            <select 
                                                value={selectedStopDetail} 
                                                onChange={(e) => setSelectedStopDetail(e.target.value)} 
                                                className="w-full bg-gray-50 border-gray-200 rounded-xl p-3 text-sm focus:ring-2 ring-blue-500 transition-all outline-none"
                                            >
                                                <option value="활성">활성 (단순답변)</option>
                                                <option value="영구정지">영구정지</option>
                                                <option value="일시정지">일시정지</option>
                                                <option value="경고">경고</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 ml-1">정지 기간 (선택)</label>
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    value={suspensionDays} 
                                                    onChange={(e) => setSuspensionDays(e.target.value)} 
                                                    className="w-full bg-gray-50 border-gray-200 rounded-xl p-3 text-sm focus:ring-2 ring-blue-500 transition-all outline-none pr-10" 
                                                    placeholder="0" 
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">일</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 ml-1">관리자 답변 메시지</label>
                                        <textarea 
                                            placeholder="사용자에게 전달될 답변을 입력하세요..." 
                                            value={replyContent} 
                                            onChange={(e) => setReplyContent(e.target.value)} 
                                            className="w-full bg-gray-50 border-gray-200 rounded-xl p-4 text-sm focus:ring-2 ring-blue-500 transition-all outline-none min-h-[120px]"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleReplySubmit} 
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                                    >
                                        {localReport.reportAnswer ? '답변 수정 완료' : '답변 및 제재 확정'}
                                    </button>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>

            {/* 내부 알림 모달 */}
            <CommonModal isOpen={modalInfo.isOpen} title={modalInfo.title} onClose={closeModal} onConfirm={closeModal} showCancel={false}>
                <p className="text-center font-medium py-4">{modalInfo.message}</p>
            </CommonModal>

            {/* Plaintext Modal (채팅 대화 로그) */}
            {showPlaintextModal && (
                <div 
                    className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) handleClosePlaintextModal();
                    }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                        <div className="px-6 py-5 border-b flex items-center justify-between bg-gray-50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    {viewMode === 'single' ? `🔒 신고된 대화내용` : `🔒 전체 대화 로그`}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    {viewMode === 'single' ? `해당 채팅방에서 총 ${totalReportedMessagesCount}건의 신고가 접수되었습니다.` : `전체 신고 메시지: ${allMessagesData?.roomInfo?.totalReportedMessages || 0}건`}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {viewMode === 'single' && totalReportedMessagesCount > 1 && (
                                    <button onClick={loadAllReportedMessages} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-xs shadow-md transition-all active:scale-95">
                                        모든 신고 메시지 보기
                                    </button>
                                )}
                                <button onClick={handleClosePlaintextModal} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-gray-100 space-y-4">
                            {viewMode === 'single' && singleMessageData && (
                                <div className="p-5 rounded-2xl border-2 bg-white border-red-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                                        <span className="font-bold text-gray-800">{singleMessageData.sender?.nickname || '알 수 없음'}</span>
                                        {singleMessageData.reportersCount > 1 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase">REPORTS: {singleMessageData.reportersCount}</span>}
                                        <span className="ml-auto text-[10px] text-gray-400 font-mono">{new Date(singleMessageData.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="whitespace-pre-wrap break-words text-gray-700 leading-relaxed">{singleMessageData.plaintextContent}</p>
                                </div>
                            )}

                            {viewMode === 'all' && allMessagesData?.allReportedMessages?.map((msg) => (
                                <div key={msg.messageId} className={`p-5 rounded-2xl border-2 mb-3 transition-all ${msg.isCurrentReport ? 'bg-red-50 border-red-300 shadow-md' : 'bg-white border-gray-100'}`}>
                                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50">
                                        <span className="font-bold text-gray-800">{msg.sender?.nickname || '알 수 없음'}</span>
                                        {msg.isCurrentReport && <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase animate-pulse">SELECTED</span>}
                                        {msg.reportersCount > 1 && <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">신고 {msg.reportersCount}건</span>}
                                        <span className="ml-auto text-[10px] text-gray-400 font-mono">{new Date(msg.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="whitespace-pre-wrap break-words text-gray-700 leading-relaxed">{msg.plaintextContent}</p>
                                </div>
                            ))}
                        </div>

                        <div className="px-6 py-4 border-t bg-white flex justify-end">
                            <button onClick={handleClosePlaintextModal} className="px-6 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-gray-200">확인 완료</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ReportDetailModal;