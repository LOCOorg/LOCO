
const GiveRewardModal = ({ isOpen, onClose, selectedCount, rewardAmount, setRewardAmount, rewardReason, setRewardReason, onGive }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl scale-in-center">
                <h3 className="text-2xl font-black mb-6 text-gray-800 flex items-center gap-2">🎁 보상 지급하기</h3>
                <div className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-100">
                    <p className="text-blue-800 font-bold">선택된 사용자: {selectedCount}명</p>
                    <p className="text-blue-600 text-xs mt-1">※ 선택한 모든 사용자에게 동일한 횟수가 지급됩니다.</p>
                </div>
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">지급 횟수 (개당)</label>
                        <input 
                            type="number" 
                            value={rewardAmount} 
                            onChange={(e) => setRewardAmount(e.target.value)} 
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" 
                            placeholder="숫자 입력..." 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-2">지급 사유</label>
                        <textarea 
                            value={rewardReason} 
                            onChange={(e) => setRewardReason(e.target.value)} 
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                            rows="3" 
                            placeholder="간단한 사유를 적어주세요..." 
                        />
                    </div>
                </div>
                <div className="mt-8 flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition">닫기</button>
                    <button onClick={onGive} className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition">지급하기</button>
                </div>
            </div>
        </div>
    );
};

export default GiveRewardModal;
