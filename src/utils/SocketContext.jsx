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
    const socketRef = useRef(null);  // 🆕 소켓 인스턴스 ref

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1️⃣ 소켓 초기화 - 한 번만 실행 (의존성 없음)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    useEffect(() => {
        // 이미 소켓이 있으면 재생성 안 함
        if (socketRef.current) {
            console.log('✅ [SocketContext] 기존 소켓 재사용');
            return;
        }

        const SOCKET_URL = import.meta.env.VITE_API_SOCKET || 'http://localhost:3000';
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 20,
            reconnectionDelay: 1000,
            withCredentials: true,
            reconnectionDelayMax: 5000,
            randomizationFactor: 0.5
        });

        socketRef.current = newSocket;
        console.log('🔌 [Socket] 연결 시도 중...', SOCKET_URL);

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 2️⃣ 연결 성공
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        newSocket.on('connect', () => {
            console.log('✅ [SocketContext] 연결 성공:', newSocket.id);

            setConnectionState(prev => ({
                ...prev,
                isConnected: true,
                isReallyConnected: true,
                isReconnecting: false,
                reconnectAttempts: 0,
                lastError: null
            }));

            // 🆕 Heartbeat 시작
            lastHeartbeatRef.current = Date.now();

            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }

            heartbeatIntervalRef.current = setInterval(() => {
                const now = Date.now();
                const timeSinceLastBeat = now - lastHeartbeatRef.current;

                if (timeSinceLastBeat > 60000) {
                    console.error('💔 [SocketContext] Heartbeat 타임아웃');
                    setConnectionState(prev => ({
                        ...prev,
                        isReallyConnected: false
                    }));
                    newSocket.disconnect();
                    newSocket.connect();
                } else {
                    newSocket.emit('ping');
                }
            }, 30000);
        });

        // 🆕 Pong 수신
        newSocket.on('pong', () => {
            lastHeartbeatRef.current = Date.now();
            setConnectionState(prev => ({
                ...prev,
                lastHeartbeat: new Date(lastHeartbeatRef.current).toLocaleString('ko-KR')
            }));
        });

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 3️⃣ 연결 해제
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        newSocket.on('disconnect', (reason) => {
            console.warn('⚠️ [SocketContext] 연결 끊김:', reason);

            setConnectionState(prev => ({
                ...prev,
                isConnected: false,
                isReallyConnected: false
            }));

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
        // 4️⃣ 친구 관련 이벤트 핸들러
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const handleFriendAdded = (data) => {
            if (data.friend && data.friend._id) {
                addFriend(data.friend);
                setUser((prevUser) => {
                    if (!prevUser) return prevUser;
                    const currentFriends = prevUser.friends || [];
                    if (currentFriends.includes(data.friend._id)) return prevUser;
                    return {
                        ...prevUser,
                        friends: [...currentFriends, data.friend._id]
                    };
                });
            }
        };

        const handleFriendDeleted = (data) => {
            if (data.friendId) {
                removeFriend(data.friendId);
                setUser((prevUser) => {
                    if (!prevUser) return prevUser;
                    const currentFriends = prevUser.friends || [];
                    return {
                        ...prevUser,
                        friends: currentFriends.filter(id => id !== data.friendId)
                    };
                });
            }
        };

        const handleFriendBlocked = (data) => {
            if (data.blockerId) {
                removeFriend(data.blockerId);
            }
        };

        const handleFriendUnblocked = (data) => {
            // 필요시 친구 목록 새로고침
        };

        newSocket.on('friendAdded', handleFriendAdded);
        newSocket.on('friendDeleted', handleFriendDeleted);
        newSocket.on('friendBlocked', handleFriendBlocked);
        newSocket.on('friendUnblocked', handleFriendUnblocked);

        setSocket(newSocket);
        registerSocket(newSocket);
        console.log('✅ [SocketContext] socket.js에 등록 완료');

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // Cleanup - 앱 종료 시에만 실행
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
            socketRef.current = null;
            registerSocket(null);
        };
    }, []);  // 🆕 의존성 없음 - 한 번만 실행

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2️⃣ 사용자 변경 시 register만 다시 호출
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    useEffect(() => {
        if (socket && socket.connected && user?._id) {
            socket.emit('register', user._id);
            console.log(`📝 [SocketContext] 사용자 등록: ${user._id}`);
        }
    }, [socket, user?._id]);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3️⃣ 소켓 재연결 시 사용자 재등록
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    useEffect(() => {
        if (!socket) return;

        const handleReconnect = () => {
            if (user?._id) {
                socket.emit('register', user._id);
                console.log(`📝 [SocketContext] 재연결 후 사용자 재등록: ${user._id}`);
            }
        };

        socket.on('connect', handleReconnect);

        return () => {
            socket.off('connect', handleReconnect);
        };
    }, [socket, user?._id]);


    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Context Value
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const value = {
        socket,
        ...connectionState,

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
