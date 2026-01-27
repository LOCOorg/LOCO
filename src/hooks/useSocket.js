// src/hooks/useSocket.js
import { useEffect, useState, useRef } from 'react';
import { getSocket, subscribeToSocket } from '../../socket';

export const useSocket = () => {
    const [socket, setSocket] = useState(() => getSocket());
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        // 🆕 소켓 변경 구독 - 소켓이 재생성되면 자동으로 업데이트
        const unsubscribe = subscribeToSocket((newSocket) => {
            if (mountedRef.current) {
                if (newSocket) {
                    console.log('🔄 [useSocket] 소켓 업데이트:', newSocket.id);
                } else {
                    console.log('🔄 [useSocket] 소켓 해제됨');
                }
                setSocket(newSocket);
            }
        });

        return () => {
            mountedRef.current = false;
            unsubscribe();
        };
    }, []);

    return socket;
};
