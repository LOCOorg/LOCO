import { format } from 'date-fns';

const RewardLogTable = ({ logs, pagination, onPageChange, onSelectLog }) => {
    const getLogDisplayName = (log) => {
        const firstNickname = log.previewNickname || '알 수 없음';
        return log.targetCount > 1 ? `${firstNickname} 외 ${log.targetCount - 1}명` : firstNickname;
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col h-[600px]">
            <div className="p-5 border-b bg-gray-50 rounded-t-xl"><h2 className="text-lg font-bold text-gray-800">📜 보상 지급 내역</h2></div>
            <div className="flex-1 overflow-auto p-2 relative">
                <table className="min-w-full border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10 shadow-sm">
                        <tr className="bg-white">
                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-white">지급일</th>
                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-white">대상자</th>
                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-white">보상</th>
                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-white">상태</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.map(log => (
                            <tr 
                                key={log._id} 
                                onClick={() => onSelectLog(log)} 
                                className="hover:bg-gray-50 cursor-pointer transition border-l-4 border-transparent hover:border-blue-500"
                            >
                                <td className="px-4 py-4 text-sm text-gray-500">{format(new Date(log.createdAt), 'MM-dd HH:mm')}</td>
                                <td className="px-4 py-4 text-sm font-bold text-gray-900">{getLogDisplayName(log)}</td>
                                <td className="px-4 py-4 text-sm text-blue-600 font-black">+{log.rewardAmount}</td>
                                <td className="px-4 py-4 text-sm">
                                    {log.allCancelled ? (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                            전체취소
                                        </span>
                                    ) : log.hasCancelled ? (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                                            일부취소
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                            지급완료
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-center gap-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                    <button 
                        key={p} 
                        onClick={() => onPageChange(p)} 
                        className={`w-8 h-8 rounded-md text-sm font-bold border transition ${pagination.page === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-gray-200 border-gray-300'}`}
                    >
                        {p}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default RewardLogTable;
