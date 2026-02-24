import { useRouteError, useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw, ArrowLeft, Lock, ShieldAlert, ServerCrash } from 'lucide-react';

const ErrorPage = () => {
    const error = useRouteError();
    const navigate = useNavigate();

    // 에러 상태에 따른 커스텀 설정
    const getErrorDetails = () => {
        // react-router-dom의 error 객체나 커스텀 error 객체에서 status 추출
        const status = error?.status || error?.response?.status || (error instanceof Error ? error.status : null);
        
        switch (status) {
            case 404:
                return {
                    title: "페이지를 찾을 수 없어요",
                    description: "요청하신 페이지가 존재하지 않거나, 주소가 잘못되었습니다.",
                    icon: <AlertTriangle size={48} className="text-blue-600" />,
                    bgClass: "bg-blue-100",
                    label: "404"
                };
            case 401:
                return {
                    title: "로그인이 필요합니다",
                    description: error?.message || "이 페이지를 보려면 먼저 로그인을 해주세요.",
                    icon: <Lock size={48} className="text-amber-600" />,
                    bgClass: "bg-amber-100",
                    label: "401",
                    action: () => navigate('/')
                };
            case 403:
                return {
                    title: "접근 권한이 없습니다",
                    description: "이 페이지에 접근할 수 있는 권한이 부족한 것 같아요.",
                    icon: <ShieldAlert size={48} className="text-orange-600" />,
                    bgClass: "bg-orange-100",
                    label: "403"
                };
            case 500:
                return {
                    title: "서버에 문제가 발생했습니다",
                    description: "서버가 잠시 아픈 것 같아요. 잠시 후 다시 시도해 주세요.",
                    icon: <ServerCrash size={48} className="text-red-600" />,
                    bgClass: "bg-red-100",
                    label: "500"
                };
            default:
                return {
                    title: "오류가 발생했습니다",
                    description: error?.statusText || error?.message || "알 수 없는 오류가 발생했습니다.",
                    icon: <AlertTriangle size={48} className="text-red-600" />,
                    bgClass: "bg-red-100",
                    label: "Error"
                };
        }
    };

    const details = getErrorDetails();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full text-center space-y-8 p-10 bg-white rounded-2xl shadow-xl border border-gray-100">
                {/* 아이콘 */}
                <div className="flex justify-center">
                    <div className={`p-4 rounded-full ${details.bgClass}`}>
                        {details.icon}
                    </div>
                </div>

                {/* 메시지 */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        {details.label}
                    </h1>
                    <h2 className="text-xl font-semibold text-gray-800">
                        {details.title}
                    </h2>
                    <p className="text-gray-500 leading-relaxed">
                        {details.description}
                    </p>
                </div>

                {/* 버튼들 */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        이전으로
                    </button>
                    <button
                        onClick={details.action || (() => navigate('/'))}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-sm font-medium rounded-lg text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
                    >
                        {details.action ? <Lock size={18} /> : <Home size={18} />}
                        {details.action ? "로그인하기" : "홈으로 이동"}
                    </button>
                </div>

                {/* 추가 안내 */}
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-6 text-sm text-gray-400 hover:text-blue-500 flex items-center justify-center gap-1 mx-auto transition-colors"
                >
                    <RefreshCw size={14} />
                    페이지 새로고침
                </button>
            </div>
            
            <p className="mt-8 text-gray-400 text-xs uppercase tracking-widest">
                &copy; {new Date().getFullYear()} LOCO Project System
            </p>
        </div>
    );
};

export default ErrorPage;