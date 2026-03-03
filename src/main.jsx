// src/main.jsx
import { createRoot } from 'react-dom/client'
import './index.css'
import mainRouter from "./routers/MainRouter.jsx";
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import AuthInit from '../src/components/authComponent/AuthInit.jsx';
import {NotificationProvider} from "./hooks/NotificationContext.jsx";
import {SocketProvider} from "./utils/SocketContext.jsx";


// ✅ QueryClient 생성
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60000,           // 1분간 신선한 데이터로 간주
            gcTime: 300000,             // 5분간 캐시 유지
            refetchOnWindowFocus: false, // 창 포커스 시 자동 재요청 비활성화
            retry: 1,                    // 실패 시 1회 재시도
            throwOnError: true,          // ✅ 에러 발생 시 ErrorBoundary(errorElement)로 던짐
        },
        mutations: {
            throwOnError: false,         // 생성/수정/삭제는 보통 직접 처리하므로 false가 안전해요
        }
    },
});



createRoot(document.getElementById('root')).render(
    <QueryClientProvider client={queryClient}>
        <NotificationProvider>
            <SocketProvider>
            <AuthInit />
            <RouterProvider router={mainRouter} />
            </SocketProvider>
        </NotificationProvider>
        {/* 개발 환경에서만 DevTools 표시 */}
        {import.meta.env.DEV && (
            <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
        )}
    </QueryClientProvider>
)
