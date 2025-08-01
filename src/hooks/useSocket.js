// src/hooks/useSocket.js
import { useEffect, useState } from 'react';
import { getSocket } from '../../socket';

export const useSocket = () => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const s = getSocket();        // ① 싱글턴 획득
        setSocket(s);

        // ② 클린업: 전체 앱 언마운트 시에만 해제
        return () => {
            // 의도적으로 disconnect 하지 않음
            // 페이지 이동·컴포넌트 언마운트마다 끊으면 다시 여러 개가 생김
        };
    }, []);

    return socket;
};
