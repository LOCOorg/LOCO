// src/components/AuthGuard.jsx
import { useLv } from '../../hooks/useLv.js';


/**
 * AuthGuard
 * - 앱 시작 시 한 번만 useLv() 호출 → authStore.user 세팅
 * - currentUser가 null인 동안 로딩 UI 표시
 * - 로딩 완료 후 <Outlet />으로 하위 라우트 렌더링
 */
export default function AuthGuard({ children }) {
    const { currentUser } = useLv();

    if (currentUser === null) {
        return <div>로딩 중…</div>;
    }

    return <>{ children }</>;
}
