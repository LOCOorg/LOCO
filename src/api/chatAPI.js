//LOCO/src/api/chatAPI.js
import instance from "./axiosInstance.js";  // ✅ instance 사용

/**
 * 🎯 방 찾기 또는 생성 (통합 API)
 */
export const findOrCreateChatRoom = async (params) => {
    try {
        console.log('🔍 [API] 방 찾기/생성 요청:', params);

        const response = await instance.post('/api/chat/rooms/find-or-create', params);

        console.log('✅ [API] 방 찾기/생성 성공:', {
            action: response.data.action,
            roomId: response.data.room._id,
            attemptedRooms: response.data.attemptedRooms
        });

        return response.data;
    } catch (error) {
        console.error('❌ [API] 방 찾기/생성 실패:', error);
        throw error;
    }
};
//=====프롬프트 변경=====캐싱추가=====Request/Response확인====countDocuments 적용 가능성====
// 친구와 채팅방 생성 (상위 호환)
export const findOrCreateFriendRoom = async (userId, friendId) => {
    try {
        console.log('🎯 [API] 친구방 찾기/생성 요청:', { userId, friendId });

        const response = await instance.post('/api/chat/friend/rooms/find-or-create', {
            userId,
            friendId
        });

        console.log('✅ [API] 성공:', response.data);

        return response.data;
    } catch (error) {
        console.error('❌ [API] 실패:', error);
        throw error;
    }
};

// 채팅 리스트
export const fetchChatRooms = async (params = {}) => {
    try {
        const response = await instance.get(`/api/chat/rooms`, { params });
        console.log(`🏛️ [방목록] 조회 성공: ${response.data.rooms?.length || 0}개`);
        return response.data;
    } catch (error) {
        console.error("채팅방 목록을 불러오는 중 오류 발생:", error);
        throw error; // ❌ 빈 배열 대신 에러 던지기
    }
};

// 특정 채팅방 정보 가져오기
export const getChatRoomInfo = async (roomId) => {
    try {
        const response = await instance.get(`/api/chat/rooms/${roomId}`);
        return response.data;
    } catch (error) {
        console.error("해당 채팅방 정보 불러오는 중 오류 발생:", error);
        return [];
    }
};

// 채팅 메세지 불러오기 (사용자 인증 포함)
export const fetchMessages = async (roomId, page = 1, limit = 20, userId = null) => {
    try {
        const params = { page, limit };
        
        // 사용자 ID가 있으면 권한 확인을 위해 포함
        if (userId) {
            params.userId = userId;
        }
        
        const response = await instance.get(`/api/chat/messages/${roomId}`, {
            params: params
        });
        
        console.log(`📨 [메시지조회] ${roomId}방 메시지 ${response.data.messages?.length || 0}개 로드`);
        return response.data;
    } catch (error) {
        console.error("메시지를 불러오는 중 오류 발생:", error);
        // Return an object with empty messages and default pagination on error
        return { messages: [], pagination: { hasNextPage: false } };
    }
};

// 채팅 메세지 전송
export const sendMessage = async (roomId, sender, text) => {
    try {
        const response = await instance.post(`/api/chat/messages`, {
            chatRoom: roomId,
            sender,
            text,
        });
        return response.data;
    } catch (error) {
        console.error("메시지를 전송하는 중 오류 발생:", error);
    }
};

// 채팅 삭제
export const deleteMessage = async (messageId) => {
    try {
        const response = await instance.put(`/api/chat/messages/${messageId}`);
        return response.data;
    } catch (error) {
        console.error("메시지 삭제 중 오류 발생:", error);
        throw error; // 오류가 발생하면 throw하여 catch로 넘어가도록 함
    }
};

// 채팅방 나가기 시 참여자에서 제거
export const leaveChatRoom = async (roomId, userId) => {
    try {
        const response = await instance.delete(`/api/chat/rooms/${roomId}/${userId}`);
        return response.data;
    } catch (error) {
        console.error("❌ leaveChatRoom API 오류:", error);
        throw error;
    }
};

export const toggleFriendRoomActive = async (roomId, active) =>
    instance.patch(`/api/chat/rooms/${roomId}/active`, { active })
        .then(res => res.data);


// 1. 메시지 읽음 처리 (인증 토큰에서 userId 자동 추출)
export const markRoomAsRead = async (roomId) => {
    try {
        await instance.patch(`/api/chat/rooms/${roomId}/read`);
        return { success: true };
    } catch (error) {
        console.error("메시지 읽음 처리 중 오류 발생:", error);
        throw error;
    }
};

/**
 * 여러 채팅방의 안읽은 메시지 개수 일괄 조회 (인증 토큰에서 userId 자동 추출)
 * @param {string[]} roomIds - 조회할 채팅방 ID 배열 (최대 100개)
 * @returns {Promise<Object>} { roomId: unreadCount } 형태의 객체
 */
export const getUnreadCountsBatch = async (roomIds) => {
    try {
        if (!Array.isArray(roomIds) || roomIds.length === 0) return {};
        if (roomIds.length > 100) return {};

        const response = await instance.post('/api/chat/rooms/unread-batch', {
            roomIds: roomIds
        });

        return response.data.counts || {};

    } catch (error) {
        console.error('❌ [배치조회] 실패:', error);
        return {};
    }
};


//=============새로만든 api함수==============================
/**
 * 🆕 여러 채팅방의 마지막 메시지 일괄 조회
 * N+1 쿼리 문제 해결: 한 번의 API 호출로 여러 채팅방 조회
 *
 * @param {string[]} roomIds - 조회할 채팅방 ID 배열 (최대 100개)
 * @returns {Promise<{ messages: Array }>} 마지막 메시지 배열
 */
export const fetchLastMessagesBatch = async (roomIds) => {
    try {
        // 입력 검증
        if (!Array.isArray(roomIds) || roomIds.length === 0) {
            console.warn('fetchLastMessagesBatch: roomIds가 유효하지 않음');
            return { messages: [] };
        }

        // 최대 100개 제한
        if (roomIds.length > 100) {
            console.warn('fetchLastMessagesBatch: 최대 100개까지만 조회 가능');
            return { messages: [] };
        }

        console.log(`📦 [배치조회] ${roomIds.length}개 채팅방 마지막 메시지 조회`);

        // POST 요청으로 배열 데이터 전송
        const response = await instance.post('/api/chat/messages/batch-last', {
            roomIds: roomIds
        });

        console.log(`✅ [배치조회] 성공: ${response.data.messages.length}개 메시지`);

        return {
            messages: response.data.messages || []
        };

    } catch (error) {
        console.error('❌ [배치조회] 실패:', error);
        // 에러 발생 시 빈 배열 반환 (UI 깨짐 방지)
        return { messages: [] };
    }
};


/**
 * 증분 동기화: lastMessageId 이후의 새 메시지만 가져오기
 * 리액트 쿼리 캐싱 - 캐싱된 후에 오는 메세지들만 로드
 *
 * @param {string} roomId - 채팅방 ID
 * @param {string} lastMessageId - 마지막 메시지 ID
 * @returns {Promise<{success: boolean, messages: Array, count: number}>}
 *
 * @example
 * const result = await getNewMessages('room123', 'msg456');
 * // { success: true, messages: [...], count: 5 }
 */
export const getNewMessages = async (roomId, lastMessageId) => {
    try {
        const params = new URLSearchParams();
        if (lastMessageId) {
            params.append('lastMessageId', lastMessageId);
        }

        console.log(`🔄 [API] 증분 동기화 요청: roomId=${roomId}, lastMessageId=${lastMessageId}`);

        const response = await instance.get(
            `/api/chat/messages/${roomId}/new?${params}`
        );

        console.log(`✅ [API] 증분 동기화 성공: ${response.data.count}개 새 메시지`);

        return response.data;
    } catch (error) {
        console.error('증분 동기화 실패:', error);
        throw error;
    }
};