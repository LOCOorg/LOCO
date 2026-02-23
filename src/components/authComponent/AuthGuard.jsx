// src/components/AuthGuard.jsx
import { useLv } from '../../hooks/useLv.js';


/**
 * AuthGuard (인증 감지 전용)
 * - AuthInit이 인증 상태를 확인하는 동안 로딩 UI 표시
 * - user === undefined: AuthInit이 아직 완료되지 않음 → 로딩
 * - user === null: 비로그인 상태 → children 렌더 (공개 페이지 접근 허용)
 * - user === 객체: 로그인 상태 → children 렌더
 * - 개별 페이지 보호는 AuthRequiredGuard, AdminGuard 등에서 처리
 */
export default function AuthGuard({ children }) {
    const { currentUser } = useLv();

    // AuthInit이 인증 상태를 확인하는 동안만 로딩 표시
    if (currentUser === undefined) {
        return <div>로딩 중…</div>;
    }

    return <>{ children }</>;
}
