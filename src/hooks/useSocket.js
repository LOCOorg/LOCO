import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_SERVER_URL = `${import.meta.env.VITE_API_SOCKET}`; // 웹소켓 서버 주소

export const useSocket = () => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io(SOCKET_SERVER_URL, {
            transports: ["websocket"],
            withCredentials: true,
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    return socket;
};
