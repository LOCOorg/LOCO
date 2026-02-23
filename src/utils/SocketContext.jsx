// src/utils/SocketContext.jsx
import {createContext, useContext, useEffect, useRef, useState} from 'react';
import { io } from 'socket.io-client';
import useFriendListStore from '../stores/useFriendListStore';
import useFriendChatStore from '../stores/useFriendChatStore';
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
    // 1️⃣ 소켓 초기화 - 로그인 상태에서만 연결
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    useEffect(() => {
        // 비로그인 상태에서는 소켓 연결하지 않음
        if (!user?._id) {
            // 기존 소켓이 있으면 정리
            if (socketRef.current) {
                console.log('🔌 [SocketContext] 비로그인 상태 - 소켓 연결 해제');
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
                registerSocket(null);
            }
            return;
        }

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
                    console.warn('💔 [SocketContext] Heartbeat 타임아웃 - Socket.IO 내장 재연결에 위임');
                    setConnectionState(prev => ({
                        ...prev,
                        isReallyConnected: false
                    }));
                    // Socket.IO 내장 pingTimeout(20초)이 자동으로 감지하고 재연결 처리
                    // 수동 disconnect/connect는 메시지 유실 위험이 있으므로 제거
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

        // 🆕 연결 오류 - 인증 실패 시 재연결 중단
        newSocket.on('connect_error', (error) => {
            console.error('❌ [SocketContext] 연결 오류:', error.message);
            setConnectionState(prev => ({
                ...prev,
                lastError: error.message
            }));

            // 인증 실패인 경우 무한 재연결 방지
            if (error.message === '인증이 필요합니다.' || error.message?.includes('인증')) {
                console.warn('🛑 [SocketContext] 인증 실패 - 재연결 중단');
                newSocket.disconnect();
            }
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
                // 1️⃣ 친구 목록에서 제거
                removeFriend(data.friendId);
                setUser((prevUser) => {
                    if (!prevUser) return prevUser;
                    const currentFriends = prevUser.friends || [];
                    return {
                        ...prevUser,
                        friends: currentFriends.filter(id => id !== data.friendId)
                    };
                });

                // 2️⃣ 채팅방 목록에서도 제거
                const { friendRooms, removeFriendRoom } = useFriendChatStore.getState();
                const targetRoom = friendRooms.find(r => r.friend?._id === data.friendId);
                if (targetRoom) {
                    removeFriendRoom(targetRoom.roomId);
                    console.log(`🗑️ [SocketContext] 친구 삭제로 채팅방 제거: ${targetRoom.roomId}`);
                }
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
    }, [user?._id]);  // 로그인/로그아웃 시 소켓 연결/해제

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2️⃣ 사용자 등록 (초기 연결 + 재연결 통합)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    useEffect(() => {
        if (!socket || !user?._id) return;

        // 이미 연결된 상태면 즉시 register
        if (socket.connected) {
            socket.emit('register', user._id);
            console.log(`📝 [SocketContext] 사용자 등록: ${user._id}`);
        }

        // 재연결 시 register
        const handleConnect = () => {
            socket.emit('register', user._id);
            console.log(`📝 [SocketContext] 재연결 후 사용자 재등록: ${user._id}`);
        };

        socket.on('connect', handleConnect);

        return () => {
            socket.off('connect', handleConnect);
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
