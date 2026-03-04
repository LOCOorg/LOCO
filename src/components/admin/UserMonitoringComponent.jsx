import React, { useState, useEffect } from 'react';
import { getUserStatistics } from '../../api/adminMonitoringAPI';
import { 
    Users, 
    UserPlus, 
    Shield, 
    Code, 
    UserCheck, 
    UserX, 
    Venus, 
    Mars, 
    Clock, 
    Search,
    RefreshCcw,
    BarChart3,
    Activity
} from 'lucide-react';
import { toast } from 'react-toastify';

const UserMonitoringComponent = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await getUserStatistics();
            if (result.success) {
                setData(result);
            }
        } catch (error) {
            console.error('유저 통계 로드 실패:', error);
            toast.error('유저 데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <RefreshCcw className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                <p className="text-gray-500 font-medium">유저 활동 데이터를 분석 중입니다...</p>
            </div>
        );
    }

    // 통계 보조 함수
    const getLevelCount = (lv) => data?.distribution?.levels?.find(l => l._id === lv)?.count || 0;
    const getStatusCount = (status) => data?.distribution?.status?.find(s => s._id === status)?.count || 0;
    const getGenderCount = (gender) => data?.distribution?.gender?.find(g => g._id === gender)?.count || 0;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="w-6 h-6 text-indigo-500" />
                        유저 활동 모니터링
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        전체 서비스 이용자 현황과 실시간 가입 소식을 확인합니다.
                    </p>
                </div>
                <button 
                    onClick={loadData}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-md text-sm font-medium"
                    disabled={loading}
                >
                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    데이터 갱신
                </button>
            </header>

            {/* 상단 요약 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">전체 회원</p>
                        <p className="text-2xl font-black text-gray-800">{data?.summary?.total.toLocaleString()} 명</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                        <UserPlus className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">오늘 가입</p>
                        <p className="text-2xl font-black text-gray-800">+{data?.summary?.newToday} 명</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                        <Code className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">개발자 (우리들!)</p>
                        <p className="text-2xl font-black text-gray-800">{getLevelCount(3).toLocaleString()} 명</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                        <UserX className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">제재/정지</p>
                        <p className="text-2xl font-black text-gray-800">{(getStatusCount('영구정지') + getStatusCount('일시정지')).toLocaleString()} 명</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 왼쪽: 상세 통계 */}
                <div className="lg:col-span-2 space-y-8">
                    {/* 레벨 & 상태 분포 */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-indigo-400" />
                            사용자 상세 분포
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* 성별 분포 */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-500 flex items-center gap-2">
                                    성별 비율 (응답 기준)
                                </h3>
                                <div className="space-y-3">
                                    <div className="relative pt-1">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="flex items-center gap-1 text-blue-500"><Mars className="w-3 h-3" /> 남성</span>
                                            <span className="font-bold">{getGenderCount('남성')} 명</span>
                                        </div>
                                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-100">
                                            <div style={{ width: `${(getGenderCount('남성') / (data?.summary?.total || 1) * 100) || 0}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-1000"></div>
                                        </div>
                                    </div>
                                    <div className="relative pt-1">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="flex items-center gap-1 text-pink-500"><Venus className="w-3 h-3" /> 여성</span>
                                            <span className="font-bold">{getGenderCount('여성')} 명</span>
                                        </div>
                                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-100">
                                            <div style={{ width: `${(getGenderCount('여성') / (data?.summary?.total || 1) * 100) || 0}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-pink-500 transition-all duration-1000"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 상태 요약 */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-gray-500">계정 및 레벨 요약</h3>
                                <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 uppercase font-bold text-ellipsis whitespace-nowrap overflow-hidden">정상 사용자 (Lv.1)</span>
                                        <span className="text-lg font-bold text-indigo-600">{getLevelCount(1)} 명</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 uppercase font-bold">운영진 (Lv.2)</span>
                                        <span className="text-lg font-bold text-emerald-600">{getLevelCount(2)} 명</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 uppercase font-bold">활성 계정</span>
                                        <span className="text-lg font-bold text-green-600">{getStatusCount('활성')} 명</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-400 uppercase font-bold">정지 계정</span>
                                        <span className="text-lg font-bold text-red-500">{getStatusCount('영구정지') + getStatusCount('일시정지')} 명</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 최근 가입자 리스트 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-indigo-400" />
                                최근 가입한 유저들
                            </h2>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {data?.recentSignups?.map((user) => (
                                <div key={user._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100">
                                            {user.profilePhoto ? (
                                                <img 
                                                    src={user.profilePhoto.startsWith('http') ? user.profilePhoto : `http://localhost:3000/uploads/${user.profilePhoto}`} 
                                                    alt={user.nickname} 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                                                    <Users className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{user.nickname}</p>
                                            <p className="text-[10px] text-gray-400">가입일: {new Date(user.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            user.userLv === 1 ? 'bg-indigo-50 text-indigo-600' :
                                            user.userLv === 2 ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-purple-100 text-purple-700 border border-purple-200'
                                        }`}>
                                            {user.userLv === 1 ? 'USER' : user.userLv === 2 ? 'ADMIN' : 'DEV'} (Lv.{user.userLv})
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 오른쪽: 시스템 알림/메모 */}
                <div className="space-y-6">
                    <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-100">
                        <h3 className="text-sm font-bold opacity-80 mb-2 flex items-center gap-2 uppercase tracking-tighter">
                            <Shield className="w-4 h-4" /> 
                            관리자 보안 수칙
                        </h3>
                        <p className="text-sm font-medium leading-relaxed">
                            모든 사용자 정보 열람은 시스템에 기록됩니다. 개인정보 보호를 위해 필요한 최소한의 범위 내에서만 사용해 주십시오.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-green-500" />
                            실시간 활성 지표
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                <span className="text-xs text-gray-500">전체 대비 개발자 비율</span>
                                <span className="text-sm font-bold text-indigo-600">
                                    {((getLevelCount(1) / data?.summary?.total) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                <span className="text-xs text-gray-500">오늘 가입 증가율</span>
                                <span className="text-sm font-bold text-green-600">
                                    {((data?.summary?.newToday / data?.summary?.total) * 100).toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserMonitoringComponent;
