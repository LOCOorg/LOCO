//LOCO/socket.js

// 🔄 소켓 인스턴스는 SocketContext.jsx에서 설정됨
let socketInstance = null;

/**
 * SocketContext.jsx에서 소켓 인스턴스를 등록
 * @param {Socket} socket - Socket.IO 클라이언트 인스턴스
 */
export const setSocket = (socket) => {
    if (socket) {
        socketInstance = socket;
        console.log('✅ [socket.js] 소켓 인스턴스 등록 완료:', socket.id);
    } else {
        console.warn('⚠️ [socket.js] null 소켓이 전달됨');
    }
};

/**
 * 등록된 소켓 인스턴스 반환
 * SocketContext.jsx가 먼저 초기화되어야 함
 */
export const getSocket = () => {
    if (!socketInstance) {
        console.warn('⚠️ [socket.js] 소켓이 아직 초기화되지 않았습니다. SocketProvider를 main.jsx에 추가했는지 확인하세요.');
    }
    return socketInstance;
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
    return socketInstance !== null;
};














// const SOCKET_SERVER_URL = import.meta.env.VITE_API_SOCKET;
//
// let socket = null;                                 // 모듈 스코프 변수
//
// export const getSocket = () => {
//     if (!socket) {
//         socket = io(SOCKET_SERVER_URL, {
//             transports: ['websocket'],
//             withCredentials: true,
//         });
//     }
//     return socket;
// };
//
// export const disconnectSocket = () => {
//     if (socket) socket.disconnect();
//     socket = null;
// };
