import { useState, useEffect } from 'react';
import { 
    getSystemStatus, 
    flushCache, 
    reconnectRedis 
} from '../../api/adminMonitoringAPI';
import { 
    Database, 
    ShieldCheck, 
    Zap, 
    RefreshCcw, 
    Trash2, 
    Clock, 
    Server, 
    Activity,
    Info
} from 'lucide-react';
import { toast } from 'react-toastify';

const SystemMonitoringComponent = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // 시스템 상태 로드
    const loadStatus = async () => {
        setLoading(true);
        try {
            const data = await getSystemStatus();
            if (data.success) {
                setStatus(data);
            }
        } catch (error) {
            console.error('시스템 상태 로드 실패:', error);
            toast.error('시스템 상태를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStatus();
        
        // 1분마다 자동 갱신
        const interval = setInterval(loadStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    // 캐시 정리 실행
    const handleFlushCache = async () => {
        if (!window.confirm('모든 캐시 데이터를 삭제하시겠습니까? 시스템 성능에 일시적인 영향을 줄 수 있습니다.')) return;
        
        setActionLoading(true);
        try {
            const result = await flushCache('*');
            toast.success(result.message || '캐시가 성공적으로 삭제되었습니다.');
            loadStatus();
        } catch (error) {
            toast.error('캐시 삭제에 실패했습니다.');
        } finally {
            setActionLoading(false);
        }
    };

    // Redis 재연결 실행
    const handleReconnectRedis = async () => {
        setActionLoading(true);
        try {
            const result = await reconnectRedis();
            toast.success(result.message);
            loadStatus();
        } catch (error) {
            toast.error('Redis 재연결 시도 중 오류가 발생했습니다.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading && !status) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <RefreshCcw className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                <p className="text-gray-500">시스템 상태 정보를 수집 중입니다...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-green-500" />
                        시스템 모니터링
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        마지막 업데이트: {new Date(status?.timestamp).toLocaleString()}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={loadStatus}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm text-sm font-medium"
                        disabled={loading}
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        상태 새로고침
                    </button>
                    <button 
                        onClick={handleFlushCache}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition shadow-sm text-sm font-medium"
                        disabled={actionLoading}
                    >
                        <Trash2 className="w-4 h-4" />
                        캐시 전체 비우기
                    </button>
                </div>
            </header>

            {/* 메인 대시보드 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* 캐시 상태 카드 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 overflow-hidden relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${status?.cache?.isRedis ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                <Zap className="w-5 h-5" />
                            </div>
                            <h2 className="font-bold text-gray-700">캐시 엔진 상태</h2>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${status?.cache?.isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {status?.cache?.isConnected ? '운영 중' : '중단됨'}
                        </span>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">엔진 타입:</span>
                            <span className="font-semibold text-gray-700">{status?.cache?.type}</span>
                        </div>
                        {status?.cache?.isRedis ? (
                            <>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">메모리 사용량:</span>
                                    <span className="font-semibold text-blue-600">{status?.cache?.memoryUsage}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">캐시 히트율:</span>
                                    <span className="font-semibold text-green-600">{status?.cache?.hitRate}</span>
                                </div>
                            </>
                        ) : (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">메모리 항목:</span>
                                <span className="font-semibold text-yellow-600">{status?.cache?.memoryDetail?.active} 개</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">전체 캐시 키:</span>
                            <span className="font-semibold text-gray-700">{status?.cache?.totalKeys}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-50 flex justify-between items-center text-sm">
                            <span className="text-gray-500">실시간 접속자:</span>
                            <span className="font-bold text-purple-600 text-lg">{status?.cache?.onlineUsers} 명</span>
                        </div>
                    </div>
                    {!status?.cache?.isRedis && (
                        <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-xs text-yellow-700 flex items-start gap-2">
                            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            Redis 연결이 끊겨 메모리 모드로 동작 중입니다. 성능 저하의 원인이 될 수 있습니다.
                        </div>
                    )}
                    {!status?.cache?.isRedis && (
                        <button 
                            onClick={handleReconnectRedis}
                            className="mt-3 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center justify-center gap-2"
                            disabled={actionLoading}
                        >
                            <RefreshCcw className="w-4 h-4" />
                            Redis 재연결 시도
                        </button>
                    )}
                </div>

                {/* 보안 및 암호화 카드 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <h2 className="font-bold text-gray-700">보안 및 암호화</h2>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${status?.security?.kmsEnabled ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
                            {status?.security?.kmsEnabled ? 'KMS 활성' : 'AES 전용'}
                        </span>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">보안 방식:</span>
                            <span className="font-semibold text-gray-700 text-xs">{status?.security?.encryptionMethod}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">채팅 암호화 키:</span>
                            <span className="font-semibold text-green-600">초기화됨</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-50">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">암호화 성능 테스트</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-lg text-center">
                                    <p className="text-[10px] text-gray-400 uppercase">암호화</p>
                                    <p className="text-lg font-bold text-indigo-600">{status?.security?.performance?.encryptTime}ms</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg text-center">
                                    <p className="text-[10px] text-gray-400 uppercase">복호화</p>
                                    <p className="text-lg font-bold text-indigo-600">{status?.security?.performance?.decryptTime}ms</p>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 text-center italic">
                                * AES-256-GCM 알고리즘 성능 실시간 측정치
                            </p>
                        </div>
                    </div>
                </div>

                {/* 시스템 리소스 카드 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                                <Server className="w-5 h-5" />
                            </div>
                            <h2 className="font-bold text-gray-700">데이터베이스 & 리소스</h2>
                        </div>
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">연결됨</span>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 flex items-center gap-1">
                                <Database className="w-3.5 h-3.5" />
                                DB 상태:
                            </span>
                            <span className="font-semibold text-gray-700">{status?.database?.status}</span>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-50">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-bold text-gray-400 uppercase">신고 통합 현황</h3>
                                {status?.database?.reports?.pending > 0 && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold animate-pulse">
                                        처리 대기: {status?.database?.reports?.pending}
                                    </span>
                                )}
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">프로필 신고:</span>
                                    <span className="font-semibold text-indigo-600">{status?.database?.reports?.profile} 건</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">커뮤니티 신고:</span>
                                    <span className="font-semibold text-emerald-600">{status?.database?.reports?.community} 건</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">채팅 신고(일반):</span>
                                    <span className="font-semibold text-blue-600">{status?.database?.reports?.chat} 건</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">채팅 백업(암호화):</span>
                                    <span className="font-semibold text-gray-700">{status?.database?.reports?.chatBackups} 건</span>
                                </div>
                                <div className="mt-2 pt-2 border-t border-dashed border-gray-100 flex justify-between text-sm">
                                    <span className="font-bold text-gray-600">전체 신고 합계:</span>
                                    <span className="font-bold text-red-600 text-base">{status?.database?.reports?.total} 건</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-50">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">환경 설정</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">실행 모드:</span>
                                    <span className={`font-bold ${status?.environment?.NODE_ENV === 'production' ? 'text-purple-600' : 'text-blue-500'}`}>
                                        {status?.environment?.NODE_ENV?.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">AWS 리전:</span>
                                    <span className="text-gray-700 font-mono">{status?.environment?.AWS_REGION}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            
            <footer className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                    이 페이지는 시스템의 건강 상태를 실시간으로 진단하기 위한 관리자 도구입니다. 
                    모든 동작은 접근 로그에 기록됩니다.
                </p>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                    <Activity className="w-3 h-3" />
                    LIVE_MONITORING_ACTIVE
                </div>
            </footer>
        </div>
    );
};

export default SystemMonitoringComponent;
