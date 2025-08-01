import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_API_SOCKET;

let socket = null;                                 // 모듈 스코프 변수

export const getSocket = () => {
    if (!socket) {
        socket = io(SOCKET_SERVER_URL, {
            transports: ['websocket'],
            withCredentials: true,
        });
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) socket.disconnect();
    socket = null;
};
