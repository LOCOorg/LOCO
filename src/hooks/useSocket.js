// src/hooks/useSocket.js
import { useEffect, useState } from 'react';
import { getSocket } from '../../socket';

export const useSocket = () => {
    const [socket, setSocket] = useState(null);
    const [retryCount, setRetryCount] = useState(0);


    useEffect(() => {
        const MAX_RETRIES = 10;


        const tryGetSocket = () => {
            const s = getSocket();

            if (s) {
                // 소켓 획득 성공
                setSocket(s);
                console.log('✅ [useSocket] 소켓 획득 성공:', s.id);
            } else if (retryCount < MAX_RETRIES) {
                // 재시도
                console.warn(`⏳ [useSocket] 소켓 대기 중... (${retryCount + 1}/${MAX_RETRIES})`);
                setRetryCount(prev => prev + 1);
                setTimeout(tryGetSocket, 100); // 100ms 후 재시도
            } else {
                // 최대 재시도 횟수 초과
                console.error('❌ [useSocket] 소켓 초기화 실패 - SocketProvider가 main.jsx에 추가되었는지 확인하세요.');
            }
        };

        tryGetSocket();

        return () => {
            // cleanup (의도적으로 disconnect 하지 않음)
        };
    }, [retryCount]);

    return socket;
};
