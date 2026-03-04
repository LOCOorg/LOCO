import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSocket } from './useSocket';
import instance from '../api/axiosInstance.js';
import debounce from 'lodash.debounce';

/**
 * 실시간 온라인 상태 관리 훅 (최적화됨)
 * @param {string[]} userIds - 추적할 사용자 ID 배열
 * @returns {Object} { onlineStatus, refreshStatus, isLoading }
 */
export const useOnlineStatus = (userIds = []) => {
    const [onlineStatus, setOnlineStatus] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const socket = useSocket();
    const userIdsRef = useRef(userIds);
    const lastFetchedIds = useRef(new Set());

    // userIds를 정렬된 문자열로 메모화하여 불필요한 리렌더링 방지
    const userIdsString = useMemo(() => 
        [...userIds].sort().join(','), [userIds]
    );

    // userIds 변경 감지
    useEffect(() => {
        userIdsRef.current = userIds;
    }, [userIds]);

    // 디바운스된 온라인 상태 조회 (연속된 요청 방지)
    const debouncedRefreshStatus = useCallback(
        debounce(async (currentUserIds) => {
            if (!currentUserIds.length) return;
            
            // 이미 조회한 ID들과 비교하여 새로운 ID만 조회
            const newIds = currentUserIds.filter(id => !lastFetchedIds.current.has(id));
            if (newIds.length === 0) return;
            
            setIsLoading(true);
            try {
                const response = await instance.post('/api/online-status/bulk', {
                    userIds: newIds
                });
                
                if (response.data.success) {
                    setOnlineStatus(prev => ({ ...prev, ...response.data.data }));
                    newIds.forEach(id => lastFetchedIds.current.add(id));
                }
            } catch (error) {
                console.error('온라인 상태 조회 실패:', error);
            } finally {
                setIsLoading(false);
            }
        }, 300), // 300ms 디바운스
        []
    );

    // 전체 상태 새로고침 (필요시에만 사용)
    const refreshStatus = useCallback(async () => {
        if (!userIds.length) return;
        
        setIsLoading(true);
        try {
            const response = await instance.post('/api/online-status/bulk', {
                userIds: userIds
            });
            
            if (response.data.success) {
                setOnlineStatus(response.data.data);
                lastFetchedIds.current = new Set(userIds);
            }
        } catch (error) {
            console.error('온라인 상태 조회 실패:', error);
        } finally {
            setIsLoading(false);
        }
    }, [userIds]);

    // userIds 변경시에만 새로운 ID들을 조회
    useEffect(() => {
        if (userIds.length > 0) {
            debouncedRefreshStatus(userIds);
        }
    }, [userIdsString, debouncedRefreshStatus]);

    // 실시간 상태 업데이트 리스너
    useEffect(() => {
        if (!socket) return;

        const handleStatusChange = (data) => {
            const { userId, isOnline } = data;
            
            // 현재 추적 중인 사용자인지 확인
            if (userIdsRef.current.includes(userId)) {
                setOnlineStatus(prev => ({
                    ...prev,
                    [userId]: isOnline
                }));
                
                console.log(`🔄 실시간 상태 업데이트: ${userId} → ${isOnline ? '온라인' : '오프라인'}`);
            }
        };

        socket.on('userStatusChanged', handleStatusChange);

        // 클린업
        return () => {
            socket.off('userStatusChanged', handleStatusChange);
        };
    }, [socket]);

    return {
        onlineStatus,
        refreshStatus,
        isLoading
    };
};

/**
 * 단일 사용자 온라인 상태 훅
 * @param {string} userId - 사용자 ID
 * @returns {boolean|null} 온라인 상태 (null = 로딩 중)
 */
export const useSingleOnlineStatus = (userId) => {
    const { onlineStatus, isLoading } = useOnlineStatus(userId ? [userId] : []);
    
    if (isLoading) return null;
    return onlineStatus[userId] ?? false;
};
