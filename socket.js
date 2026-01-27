//LOCO/socket.js

// 🔄 소켓 인스턴스는 SocketContext.jsx에서 설정됨
let socketInstance = null;

// 🆕 소켓 변경 리스너들
const socketChangeListeners = new Set();

/**
 * SocketContext.jsx에서 소켓 인스턴스를 등록
 * @param {Socket} socket - Socket.IO 클라이언트 인스턴스
 */
export const setSocket = (socket) => {
    const oldSocket = socketInstance;
    socketInstance = socket;
    
    if (socket) {
        console.log('✅ [socket.js] 소켓 인스턴스 등록 완료:', socket.id);
    } else {
        console.log('🔄 [socket.js] 소켓 인스턴스 초기화');
    }
    
    // 🆕 모든 리스너에게 소켓 변경 알림
    if (oldSocket !== socket) {
        socketChangeListeners.forEach(listener => {
            try {
                listener(socket);
            } catch (err) {
                console.error('❌ [socket.js] 리스너 호출 오류:', err);
            }
        });
    }
};

/**
 * 등록된 소켓 인스턴스 반환
 * SocketContext.jsx가 먼저 초기화되어야 함
 */
export const getSocket = () => {
    if (!socketInstance) {
        // 로그 레벨 낮춤 (매번 출력되지 않도록)
        // console.warn('⚠️ [socket.js] 소켓이 아직 초기화되지 않았습니다.');
    }
    return socketInstance;
};

/**
 * 🆕 소켓 변경 구독
 * @param {Function} listener - 소켓이 변경될 때 호출될 콜백 (socket) => void
 * @returns {Function} 구독 해제 함수
 */
export const subscribeToSocket = (listener) => {
    socketChangeListeners.add(listener);
    
    // 이미 소켓이 있으면 즉시 호출
    if (socketInstance) {
        listener(socketInstance);
    }
    
    // 구독 해제 함수 반환
    return () => {
        socketChangeListeners.delete(listener);
    };
};

/**
 * 소켓 연결 해제
 */
export const disconnectSocket = () => {
    if (socketInstance) {
        console.log('🔌 [socket.js] 소켓 연결 해제');
        socketInstance.disconnect();
    }
    socketInstance = null;
};

/**
 * 소켓 초기화 여부 확인
 */
export const isSocketInitialized = () => {
    return socketInstance !== null && socketInstance.connected;
};
