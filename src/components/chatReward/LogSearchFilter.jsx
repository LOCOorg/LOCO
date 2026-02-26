import React from 'react';

const LogSearchFilter = ({ filter, setFilter, onSearch }) => {
    return (
        <form onSubmit={onSearch} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 첫 번째 줄: 관리자 닉네임 & 지급 사유 */}
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">관리자 닉네임</label>
                    <input 
                        type="text" 
                        value={filter.adminNickname} 
                        onChange={(e) => setFilter({...filter, adminNickname: e.target.value})} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" 
                        placeholder="관리자명 입력..." 
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">지급 사유</label>
                    <input 
                        type="text" 
                        value={filter.reason} 
                        onChange={(e) => setFilter({...filter, reason: e.target.value})} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" 
                        placeholder="사유 키워드..." 
                    />
                </div>
                {/* 두 번째 줄: 지급 기간 설정 */}
                <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">지급 기간 설정</label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="date" 
                            value={filter.startDate} 
                            onChange={(e) => setFilter({...filter, startDate: e.target.value})} 
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" 
                        />
                        <span className="text-gray-400 font-bold">~</span>
                        <input 
                            type="date" 
                            value={filter.endDate} 
                            onChange={(e) => setFilter({...filter, endDate: e.target.value})} 
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" 
                        />
                    </div>
                </div>
            </div>
            <div className="flex gap-2 mt-4">
                <button type="submit" className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-bold hover:bg-black transition shadow-md">
                    내역 필터 적용
                </button>
                <button 
                    type="button" 
                    onClick={() => setFilter({adminNickname: '', startDate: '', endDate: '', reason: ''})} 
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200 transition"
                >
                    초기화
                </button>
            </div>
        </form>
    );
};

export default LogSearchFilter;
