// src/hooks/queries/useChatQueries.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchChatRooms,
    getChatRoomInfo,
    getUnreadCountsBatch,
    fetchLastMessagesBatch,
    markRoomAsRead,
} from '../../api/chatAPI';

/**
 * 채팅방 목록 조회 (React Query 버전)
 *
 * @param {Object} params
 * @param {string} params.userId - 사용자 ID
 * @param {string} [params.roomType] - 'friend' | 'random'
 * @param {string} [params.keyword] - 검색어
 * @returns {UseQueryResult}
 */
export const useChatRooms = (params) => {
    return useQuery({
        queryKey: ['chat-rooms', params],
        queryFn: () => fetchChatRooms(params),
        staleTime: 10000,       // 10초
        gcTime: 300000,         // 5분
        refetchInterval: 30000, // 30초마다 자동 갱신
        enabled: !!params?.userId, // userId가 있을 때만 실행
    });
};

/**
 * 채팅방 정보 조회
 *
 * @param {string} roomId
 * @returns {UseQueryResult}
 */
export const useChatRoomInfo = (roomId) => {
    return useQuery({
        queryKey: ['chat-room-info', roomId],
        queryFn: () => getChatRoomInfo(roomId),
        staleTime: 30000,
        gcTime: 300000,
        enabled: !!roomId,
    });
};

/**
 * 안읽은 메시지 개수 배치 조회 (N+1 문제 해결)
 *
 * @param {string[]} roomIds - 채팅방 ID 배열
 * @param {string} userId
 * @returns {UseQueryResult} - { [roomId]: count } 형태
 */
export const useUnreadCountsBatch = (roomIds, userId) => {
    return useQuery({
        queryKey: ['unread-counts-batch', roomIds, userId],
        queryFn: () => getUnreadCountsBatch(roomIds, userId),
        staleTime: 5000,        // 5초
        gcTime: 60000,          // 1분
        refetchInterval: 10000, // 10초마다 자동 갱신
        enabled: roomIds.length > 0 && !!userId,
    });
};

/**
 * 마지막 메시지 배치 조회 (N+1 문제 해결)
 *
 * @param {string[]} roomIds
 * @returns {UseQueryResult} - { messages: [...] } 형태
 */
export const useLastMessagesBatch = (roomIds) => {
    return useQuery({
        queryKey: ['last-messages-batch', roomIds],
        queryFn: () => fetchLastMessagesBatch(roomIds),
        staleTime: 10000,
        gcTime: 60000,
        enabled: roomIds.length > 0,
    });
};

/**
 * 메시지 읽음 처리 Mutation
 */
export const useMarkRoomAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ roomId, userId }) => markRoomAsRead(roomId, userId),
        onSuccess: () => {
            // 안읽은 개수 캐시 무효화
            queryClient.invalidateQueries(['unread-counts-batch']);
        },
    });
};