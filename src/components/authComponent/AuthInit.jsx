//src/components/authComponent/AuthInit.jsx

import {useEffect, useRef} from 'react';
import { fetchCurrentUser } from '../../api/authAPI.js';
import { getUserFriendIds } from '../../api/userLightAPI.js';  // ✅ 추가
import useAuthStore from '../../stores/authStore.js';
import { useSocket } from '../../hooks/useSocket.js';
import { getBlockedUsers } from '../../api/userAPI.js';  // ✅ 추가
import useBlockedStore from '../../stores/useBlockedStore.js';
import { useAutoLogout } from '../../hooks/logout/useAutoLogout.js';
import { useTokenExpiry } from '../../hooks/logout/useTokenExpiry.js';
const AuthInit = () => {
    const triedOnce = useRef(false);
    const setUser        = useAuthStore(s => s.setUser);
    // const setAccessToken = useAuthStore(s => s.setAccessToken);
    const logout = useAuthStore((s) => s.logout);
    const user = useAuthStore(s => s.user);  // 🔧 현재 사용자 정보
    const socket = useSocket();  // 🔧 소켓 인스턴스
    const setBlockedUsers = useBlockedStore(s => s.setBlockedUsers);

    // 자동 로그아웃 훅 추가 (30분 비활동 시)
    useAutoLogout(3 * 60 * 60 * 1000);

    // 토큰 만료 감지 훅 추가
    useTokenExpiry();

    useEffect(() => {
        if (triedOnce.current) return; // 이미 시도했으면 무시
        triedOnce.current = true;

        (async () => {
            try {
                // 1) Get user
                const { user } = await fetchCurrentUser();

                // 2) Get friends and blocked users in parallel
                const [friendData, blockedList] = await Promise.all([
                    getUserFriendIds(user._id).catch(err => {
                        console.error('❌ [AuthInit] 친구 ID 로드 실패:', err);
                        return { friendIds: [] }; // Return empty on failure
                    }),
                    getBlockedUsers(user._id).catch(err => {
                        console.error('❌ [AuthInit] 차단 목록 로드 실패:', err);
                        return []; // Return empty on failure
                    })
                ]);

                // 3) Combine all data into one user object
                const finalUser = {
                    ...user,
                    friends: friendData.friendIds
                };

                // 4) Set state ONCE
                setUser(finalUser);
                setBlockedUsers(blockedList);

                console.log('✅ [AuthInit] 인증 및 추가 정보 로드 완료:', user._id);

            } catch (err) {
                // 리프레시나 사용자 조회 단계에서 오류(401 등) 발생 시, 완전 로그아웃 상태로 전환
                console.error('AuthInit 오류:', err);
                logout();
            }
        })();
    }, [setUser, logout, setBlockedUsers]);

    // 🔧 사용자 로그인 완료 후 소켓 등록
    useEffect(() => {
        if (socket && user && user._id) {
            console.log('🟢 소켓에 사용자 등록:', user._id);
            socket.emit('register', user._id);
        }
    }, [socket, user]);

    return null; // 화면에 그릴 내용 없음. 초기화 용 컴포넌트
};

export default AuthInit;

