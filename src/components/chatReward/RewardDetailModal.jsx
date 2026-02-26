import { format } from 'date-fns';

const RewardDetailModal = ({ isOpen, onClose, selectedLog, selectedLogItems, cancelReason, setCancelReason, onCancel }) => {
    if (!isOpen || !selectedLog) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]">
                <h3 className="text-2xl font-black mb-6 text-gray-800 flex items-center gap-2">🔍 보상 상세 정보</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <div><p className="text-xs font-bold text-gray-400 uppercase mb-1">지급 일시</p><p className="font-bold text-gray-800">{format(new Date(selectedLog.createdAt), 'yyyy-MM-dd HH:mm:ss')}</p></div>
                    <div><p className="text-xs font-bold text-gray-400 uppercase mb-1">지급 횟수</p><p className="font-bold text-blue-600">+{selectedLog.rewardAmount} 회</p></div>
                    <div><p className="text-xs font-bold text-gray-400 uppercase mb-1">지급 관리자</p><p className="font-bold text-gray-800">{selectedLog.adminId?.nickname || '시스템'}</p></div>
                    <div><p className="text-xs font-bold text-gray-400 uppercase mb-1">지급 사유</p><p className="font-bold text-gray-800 truncate">{selectedLog.reason}</p></div>
                </div>

                <div className="mb-4 flex items-center justify-between">
                    <h4 className="font-black text-gray-700">👥 지급 대상자 목록 ({selectedLog.targetCount || 0}명)</h4>
                    {selectedLogItems.some(i => i.status === 'active') && (
                        <button 
                            onClick={() => onCancel('all')}
                            className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-red-700 transition shadow-md"
                        >
                            이 그룹 전체 취소
                        </button>
                    )}
                </div>
                
                <div className="flex-1 overflow-auto border rounded-xl divide-y divide-gray-100 mb-6 bg-white">
                    {(selectedLogItems || []).map(item => (
                        <div key={item._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                            <div>
                                <p className="font-bold text-gray-900">{item.targetUserId?.nickname || '알 수 없음'}</p>
                                <div className={`text-xs mt-1 font-bold ${item.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>
                                    {item.status === 'active' ? (
                                        '● 지급 상태'
                                    ) : (
                                        <div className="space-y-0.5">
                                            <p>● 취소됨 ({item.cancelReason})</p>
                                            <p className="text-gray-400 font-medium">
                                                취소일: {item.cancelledAt ? format(new Date(item.cancelledAt), 'yyyy-MM-dd HH:mm') : '-'} 
                                                | 취소자: {item.cancelledBy?.nickname || '시스템'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {item.status === 'active' && (
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="text" 
                                        placeholder="취소 사유..." 
                                        value={cancelReason} 
                                        onChange={(e) => setCancelReason(e.target.value)} 
                                        className="border rounded-md px-3 py-1.5 text-xs w-40 outline-none focus:ring-1 focus:ring-red-400" 
                                    />
                                    <button 
                                        onClick={() => onCancel(item._id)} 
                                        className="bg-red-50 text-red-600 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-red-600 hover:text-white transition"
                                    >
                                        취소
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                
                <div className="flex justify-end">
                    <button onClick={onClose} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black shadow-lg transition">확인 완료</button>
                </div>
            </div>
        </div>
    );
};

export default RewardDetailModal;
