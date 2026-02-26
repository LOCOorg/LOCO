import { format } from 'date-fns';

const UserListTable = ({ users, selectedUserIds, onSelect, onSelectAll, pagination, onPageChange, onOpenRewardModal }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col h-[600px]">
            <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                <h2 className="text-lg font-bold text-gray-800">👥 사용자 목록 <span className="text-blue-600 ml-1">{pagination.total || 0}</span></h2>
                <div className="flex gap-2">
                    <button 
                        onClick={() => onOpenRewardModal('all')} 
                        disabled={pagination.total === 0}
                        className={`px-4 py-2 rounded-lg text-white font-bold shadow-sm transition ${pagination.total > 0 ? 'bg-blue-500 hover:bg-blue-600 active:scale-95' : 'bg-gray-300 cursor-not-allowed'}`}
                    >
                        전체 보상 ({pagination.total})
                    </button>
                    <button 
                        onClick={() => onOpenRewardModal('selected')} 
                        disabled={selectedUserIds.length === 0} 
                        className={`px-4 py-2 rounded-lg text-white font-bold shadow-sm transition ${selectedUserIds.length > 0 ? 'bg-green-600 hover:bg-green-700 scale-105 active:scale-95' : 'bg-gray-300 cursor-not-allowed'}`}
                    >
                        선택 보상 ({selectedUserIds.length})
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-2 relative">
                <table className="min-w-full border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10 shadow-sm">
                        <tr className="bg-white">
                            <th className="px-4 py-4 text-left bg-white">
                                <input 
                                    type="checkbox" 
                                    checked={users.length > 0 && users.every(u => selectedUserIds.includes(u._id))} 
                                    onChange={onSelectAll} 
                                    className="w-4 h-4" 
                                />
                            </th>
                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-white">닉네임</th>
                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-white">가입일</th>
                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-white">마지막접속</th>
                            <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-white">횟수</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(u => (
                            <tr 
                                key={u._id} 
                                className={`hover:bg-blue-50 transition cursor-pointer ${selectedUserIds.includes(u._id) ? 'bg-blue-50/50' : ''}`} 
                                onClick={() => onSelect(u._id)}
                            >
                                <td className="px-4 py-4">
                                    <input type="checkbox" checked={selectedUserIds.includes(u._id)} readOnly className="w-4 h-4 pointer-events-none" />
                                </td>
                                <td className="px-4 py-4 text-sm font-bold text-gray-900">{u.nickname}</td>
                                <td className="px-4 py-4 text-sm text-gray-500">{format(new Date(u.createdAt), 'yyyy-MM-dd')}</td>
                                <td className="px-4 py-4 text-sm text-gray-500">{u.lastLogin ? format(new Date(u.lastLogin), 'MM-dd HH:mm') : '-'}</td>
                                <td className="px-4 py-4 text-sm font-black text-blue-600">{u.numOfChat}</td>
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

export default UserListTable;
