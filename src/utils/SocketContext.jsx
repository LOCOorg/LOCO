// src/utils/SocketContext.jsx
import {createContext, useContext, useEffect, useRef, useState} from 'react';
import { io } from 'socket.io-client';
import useFriendListStore from '../stores/useFriendListStore';
import authStore from '../stores/authStore';
import { setSocket as registerSocket } from '../../socket.js';


const SocketContext = createContext(null);

export const useSocketContext = () => {
    return useContext(SocketContext);
};


export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { addFriend, removeFriend } = useFriendListStore();
    const { user, setUser } = authStore();

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🆕 연결 상태 추가
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const [connectionState, setConnectionState] = useState({
        isConnected: false,
        isReallyConnected: false,  // Heartbeat 기반
        isReconnecting: false,
        reconnectAttempts: 0,
        lastError: null,
        lastHeartbeat: null
    });

    const heartbeatIntervalRef = useRef(null);
    const lastHeartbeatRef = useRef(Date.now());



    useEffect(() => {
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 1️⃣ 소켓 연결 초기화
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const SOCKET_URL = import.meta.env.VITE_API_SOCKET || 'http://localhost:3000';
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 20,       // 재시도 횟수
            reconnectionDelay: 1000,
            withCredentials: true,
            reconnectionDelayMax: 5000,
            randomizationFactor: 0.5
        });

        console.log('🔌 [Socket] 연결 시도 중...', SOCKET_URL);

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 2️⃣ 연결 성공
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        newSocket.on('connect', () => {
            console.log('✅ [SocketContext] 연결 성공:', newSocket.id);

            // 🆕 상태 업데이트
            setConnectionState(prev => ({
                ...prev,
                isConnected: true,
                isReallyConnected: true,
                isReconnecting: false,
                reconnectAttempts: 0,
                lastError: null
            }));

            // 사용자가 로그인되어 있으면 등록
            if (user?._id) {
                newSocket.emit('register', user._id);
                console.log(`📝 [SocketContext] 사용자 등록: ${user._id}`);
            }

            // 🆕 Heartbeat 시작
            lastHeartbeatRef.current = Date.now();

            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }

            heartbeatIntervalRef.current = setInterval(() => {
                const now = Date.now();
                const timeSinceLastBeat = now - lastHeartbeatRef.current;

                if (timeSinceLastBeat > 60000) {
                    // 60초 이상 응답 없음
                    console.error('💔 [SocketContext] Heartbeat 타임아웃');

                    setConnectionState(prev => ({
                        ...prev,
                        isReallyConnected: false
                    }));

                    // 재연결 시도
                    newSocket.disconnect();
                    newSocket.connect();
                } else {
                    // 정상 - Ping 전송
                    newSocket.emit('ping');
                }
            }, 30000);  // 30초마다
        });

        // 🆕 Pong 수신
        newSocket.on('pong', () => {
            lastHeartbeatRef.current = Date.now();

            setConnectionState(prev => ({
                ...prev,
                lastHeartbeat: new Date(lastHeartbeatRef.current).toLocaleString('ko-KR')
            }));

            console.log('💓 [SocketContext] Heartbeat 정상');
        });

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 3️⃣ 연결 해제
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        newSocket.on('disconnect', (reason) => {
            console.warn('⚠️ [SocketContext] 연결 끊김:', reason);

            // 🆕 상태 업데이트
            setConnectionState(prev => ({
                ...prev,
                isConnected: false,
                isReallyConnected: false
            }));

            // Heartbeat 중지
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
                heartbeatIntervalRef.current = null;
            }
        });

        // 🆕 재연결 시도
        newSocket.on('reconnect_attempt', (attempt) => {
            console.log(`🔄 [SocketContext] 재연결 시도: ${attempt}번째`);

            setConnectionState(prev => ({
                ...prev,
                isReconnecting: true,
                reconnectAttempts: attempt
            }));
        });

        // 🆕 재연결 성공
        newSocket.on('reconnect', (attempt) => {
            console.log(`✅ [SocketContext] 재연결 성공 (${attempt}번 시도)`);

            setConnectionState(prev => ({
                ...prev,
                isConnected: true,
                isReallyConnected: true,
                isReconnecting: false,
                reconnectAttempts: 0
            }));
        });

        // 🆕 연결 오류
        newSocket.on('connect_error', (error) => {
            console.error('❌ [SocketContext] 연결 오류:', error.message);

            setConnectionState(prev => ({
                ...prev,
                lastError: error.message
            }));
        });



        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 3️⃣ 친구 추가 이벤트
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const handleFriendAdded = (data) => {
            console.log('👥 [Socket 수신] 친구 추가:', data);

            if (data.friend && data.friend._id) {
                // ✅ 1. useFriendListStore 업데이트 (친구 객체 전체)
                addFriend(data.friend);
                console.log('✅ [useFriendListStore] 친구 추가:', data.friend.nickname);

                // ✅ 2. authStore 업데이트 (친구 ID만 추가)
                setUser((prevUser) => {
                    if (!prevUser) return prevUser;

                    const currentFriends = prevUser.friends || [];

                    // 중복 체크
                    if (currentFriends.includes(data.friend._id)) {
                        console.log('⚠️ [authStore] 이미 존재하는 친구:', data.friend._id);
                        return prevUser;
                    }

                    console.log('✅ [authStore] 친구 ID 추가:', data.friend._id);
                    return {
                        ...prevUser,
                        friends: [...currentFriends, data.friend._id]
                    };
                });

                console.log('🎉 [완료] 친구 추가 실시간 반영 완료');
            }
        };

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 4️⃣ 친구 삭제 이벤트
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const handleFriendDeleted = (data) => {
            console.log('🗑️ [Socket 수신] 친구 삭제:', data.friendId);

            if (data.friendId) {
                // ✅ 1. useFriendListStore 업데이트
                removeFriend(data.friendId);
                console.log('✅ [useFriendListStore] 친구 제거:', data.friendId);

                // ✅ 2. authStore 업데이트 (친구 ID 제거)
                setUser((prevUser) => {
                    if (!prevUser) return prevUser;

                    const currentFriends = prevUser.friends || [];
                    const newFriends = currentFriends.filter(id => id !== data.friendId);

                    console.log('✅ [authStore] 친구 ID 제거:', data.friendId);
                    return {
                        ...prevUser,
                        friends: newFriends
                    };
                });

                console.log('🎉 [완료] 친구 삭제 실시간 반영 완료');
            }
        };

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 5️⃣ 차단 이벤트
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const handleFriendBlocked = (data) => {
            console.log('🚫 [Socket 수신] 차단됨:', data.blockerId);

            // 차단한 사람을 친구 목록에서 제거
            if (data.blockerId) {
                removeFriend(data.blockerId);
                console.log('✅ [Store] 차단한 사용자 제거 완료:', data.blockerId);
            }
        };

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 6️⃣ 차단 해제 이벤트
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const handleFriendUnblocked = (data) => {
            console.log('✅ [Socket 수신] 차단 해제:', data.unblockerId);

            // 필요하다면 친구 목록 새로고침
            // refreshFriends(); // useFriendListStore에 이 함수가 있다면
        };

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 7️⃣ 이벤트 리스너 등록
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        newSocket.on('friendAdded', handleFriendAdded);
        newSocket.on('friendDeleted', handleFriendDeleted);
        newSocket.on('friendBlocked', handleFriendBlocked);
        newSocket.on('friendUnblocked', handleFriendUnblocked);

        setSocket(newSocket);
        registerSocket(newSocket);
        console.log('✅ [SocketContext] socket.js에 등록 완료');



        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 9️⃣ Cleanup
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        return () => {
            console.log('🔌 [Socket] 연결 해제 중...');

            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
                heartbeatIntervalRef.current = null;
            }

            newSocket.off('friendAdded', handleFriendAdded);
            newSocket.off('friendDeleted', handleFriendDeleted);
            newSocket.off('friendBlocked', handleFriendBlocked);
            newSocket.off('friendUnblocked', handleFriendUnblocked);

            newSocket.disconnect();

            // 🆕 socket.js 인스턴스도 정리
            registerSocket(null);
            console.log('✅ [SocketContext] socket.js 소켓 정리 완료');
        };
    }, [user?._id]); // user가 변경되면 재연결


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 6️⃣ Context Value (확장)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const value = {
        socket,
        ...connectionState,

        // 디버깅 헬퍼
        getConnectionInfo: () => {
            const now = Date.now();
            const timeSinceLastBeat = now - lastHeartbeatRef.current;

            return {
                socketId: socket?.id,
                connected: socket?.connected,
                ...connectionState,
                timeSinceLastBeat: `${Math.floor(timeSinceLastBeat / 1000)}초 전`,
                heartbeatHealthy: timeSinceLastBeat < 60000
            };
        }
    };


    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};