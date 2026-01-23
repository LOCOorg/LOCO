// src/hooks/queries/useChatQueries.js
// 채팅방 목록 캐싱
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

        // ✅ 최적화된 설정
        staleTime: 30000,         // 30초 (5초 → 30초)
        gcTime: 300000,           // 5분 (1분 → 5분)
        refetchInterval: false,   // 비활성화 (10초 → false)
        refetchOnWindowFocus: true,  // 포커스 시에만
        refetchOnMount: false,    // 마운트 시 재조회 안함

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

/**
 * 채팅 메시지 무한 스크롤 조회
 *
 * @param {string} roomId - 채팅방 ID
 * @param {string} roomType - 'friend' | 'random'
 * @param {string} userId - 사용자 ID (권한 확인용)
 * @returns {UseInfiniteQueryResult}
 *
 * @example
 * const { data, fetchNextPage, hasNextPage } = useChatMessages(roomId, 'friend', userId);
 * const messages = data?.pages.flatMap(page => page.messages) || [];
 */
export const useChatMessages = (roomId, roomType, userId) => {
    return useInfiniteQuery({
        queryKey: ['chat-messages', roomId],

        queryFn: async ({ pageParam = 1 }) => {
            const { fetchMessages } = await import('../../api/chatAPI');
            return fetchMessages(roomId, pageParam, 20, userId);
        },

        getNextPageParam: (lastPage) => {
            if (lastPage?.pagination?.hasNextPage) {
                return lastPage.pagination.currentPage + 1;
            }
            return undefined;
        },

        // ✅ 수정: 친구 채팅 3시간, 랜덤 채팅 30분
        staleTime: 30000,  // 30초
        gcTime: roomType === 'friend'
            ? 3 * 60 * 60 * 1000   // 친구: 3시간
            : 30 * 60 * 1000,      // 랜덤: 30분

        // ✅ 수정: 자동 refetch 비활성화 (수동 제어)
        refetchOnMount: false,
        refetchOnWindowFocus: false,

        enabled: !!roomId && !!userId,
        initialPageParam: 1,


        select: (data) => ({
            pages: data.pages,
            pageParams: data.pageParams,
        }),
    });
};

/**
 * 메시지 삭제 Mutation (낙관적 업데이트)
 *
 * @param {string} roomId - 채팅방 ID
 * @returns {UseMutationResult}
 *
 * @example
 * const deleteMutation = useDeleteMessage(roomId);
 * deleteMutation.mutate({ messageId: 'msg123' });
 */
export const useDeleteMessage = (roomId) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ messageId }) => {
            const { deleteMessage } = await import('../../api/chatAPI');
            return deleteMessage(messageId);
        },

        onMutate: async ({ messageId }) => {
            await queryClient.cancelQueries({
                queryKey: ['chat-messages', roomId]
            });

            const previousMessages = queryClient.getQueryData(['chat-messages', roomId]);

            queryClient.setQueryData(['chat-messages', roomId], (old) => {
                if (!old?.pages) return old;

                return {
                    ...old,
                    pages: old.pages.map(page => ({
                        ...page,
                        messages: page.messages.map(msg =>
                            msg._id === messageId
                                ? { ...msg, isDeleted: true, text: '[삭제된 메시지입니다]' }
                                : msg
                        ),
                    })),
                };
            });

            return { previousMessages };
        },

        onError: (err, variables, context) => {
            if (context?.previousMessages) {
                queryClient.setQueryData(['chat-messages', roomId], context.previousMessages);
            }
            console.error('메시지 삭제 실패:', err);
        },

        onSuccess: () => {
            console.log('✅ 메시지 삭제 완료');
        },
    });
};