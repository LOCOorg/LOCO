import React from 'react';

const RewardSearchFilter = ({ searchNickname, setSearchNickname, startDate, setStartDate, endDate, setEndDate, onSearch }) => {
    return (
        <form onSubmit={onSearch} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 첫 번째 줄: 닉네임 (공간 확보를 위해 한 쪽을 비우거나 넓게 씁니다) */}
                <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">사용자 닉네임</label>
                    <input 
                        type="text" 
                        value={searchNickname} 
                        onChange={(e) => setSearchNickname(e.target.value)} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition" 
                        placeholder="닉네임 입력..." 
                    />
                </div>
                {/* 두 번째 줄: 접속 기간 설정 */}
                <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">접속 기간 설정</label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)} 
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" 
                        />
                        <span className="text-gray-400 font-bold">~</span>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)} 
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" 
                        />
                    </div>
                </div>
            </div>
            <div className="flex gap-2 mt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-md">
                    사용자 검색 적용
                </button>
                <button 
                    type="button" 
                    onClick={() => {setSearchNickname(''); setStartDate(''); setEndDate('');}} 
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200 transition"
                >
                    초기화
                </button>
            </div>
        </form>
    );
};

export default RewardSearchFilter;
