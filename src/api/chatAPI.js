//LOCO/src/api/chatAPI.js
import instance from "./axiosInstance.js";  // ✅ instance 사용


//=====프롬프트 변경=====캐싱추가=====Request/Response확인====countDocuments 적용 가능성====
// 채팅방 생성 (사용안함)
export const createChatRoom = async (roomType, capacity, matchedGender, ageGroup) => {
    try {
        const response = await instance.post(`/api/chat/rooms`, { roomType, capacity, matchedGender, ageGroup });
        return response.data;
    } catch (error) {
        console.error("채팅방 생성 중 오류 발생:", error.response?.data || error.message);
        throw error;     // ← 반드시 던져서 호출 측에서 잡을 수 있도록
    }
};
//=====프롬프트 변경=====캐싱추가=====Request/Response확인====countDocuments 적용 가능성====

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
//=====프롬프트 변경=====캐싱추가=====Request/Response확인====countDocuments 적용 가능성====
// 친구와 채팅방 생성 (기존 - 하위 호환성 유지)
export const createFriendRoom = async (roomType, capacity) => {
    try {
        const response = await instance.post(`/api/chat/friend/rooms`, { roomType, capacity });
        return response.data;
    } catch (error) {
        console.log("친구와 채팅방 생성 중 오류 발생", error);
        throw error;
    }
};
//=====프롬프트 변경=====캐싱추가=====Request/Response확인====countDocuments 적용 가능성====


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
//=====프롬프트 변경=====캐싱추가=====Request/Response확인====countDocuments 적용 가능성====


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
//=====프롬프트 변경=====캐싱추가=====Request/Response확인====countDocuments 적용 가능성====


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

//=====프롬프트 변경=====캐싱추가=====Request/Response확인====countDocuments 적용 가능성====


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
//=====프롬프트 변경=====캐싱추가=====Request/Response확인====countDocuments 적용 가능성====

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
//=====프롬프트 변경=====캐싱추가=====Request/Response확인====countDocuments 적용 가능성====


// 사용자 참가 (성별 선택 정보 포함)
export const joinChatRoom = async (roomId, userId, selectedGender = null) => {
    try {
        const requestData = { userId };
        
        // 🔧 selectedGender가 있으면 포함해서 전송
        if (selectedGender) {
            requestData.selectedGender = selectedGender;
        }
        
        const response = await instance.post(`/api/chat/rooms/${roomId}/join`, requestData);
        console.log("채팅방 참가 성공:", response.data);
        return response.data;
    } catch (error) {
        console.error("채팅방 참가 오류:", error);
        throw error;
    }
};
//=====프롬프트 변경=====캐싱추가=====Request/Response확인====countDocuments 적용 가능성====

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
//=====프롬프트 변경=====캐싱추가=====Request/Response확인====countDocuments 적용 가능성====

// 사용자가 종료한 채팅방 ID 목록을 가져오는 함수
// export const fetchUserLeftRooms = async (userId) => {
//     try {
//         const response = await instance.get(`/api/chat/leftRooms/${userId}`);
//         return response.data.leftRooms; // 예를 들어, [roomId1, roomId2, ...]
//     } catch (error) {
//         console.error("사용자 종료 채팅방 목록 불러오는 중 오류 발생:", error);
//         throw error;
//     }
// };

//=====프롬프트 변경=====캐싱추가=====Request/Response확인====countDocuments 적용 가능성====


export const toggleFriendRoomActive = async (roomId, active) =>
    instance.patch(`/api/chat/rooms/${roomId}/active`, { active })
        .then(res => res.data);

//=====프롬프트 변경=====캐싱추가=====Request/Response확인====countDocuments 적용 가능성====

// 사용 x
export const fetchChatRoomHistory = async (params = {}) => {
    try {
        const response = await instance.get(`/api/chat/search/chat-room-history`, { params });
        return response.data.dtoList || [];
    } catch (error) {
        console.error("채팅방 히스토리 불러오는 중 오류 발생:", error);
        return [];
    }
};
//=====프롬프트 변경=====캐싱추가=====Request/Response확인====countDocuments 적용 가능성====


// 1. 메시지 읽음 처리
export const markRoomAsRead = async (roomId, userId) => {
    try {
        const response = await instance.patch(`/api/chat/rooms/${roomId}/read`, {
            userId: userId
        });

        return {
            success: true,
            readAt: response.data.readAt || Date.now(),
            modifiedCount: response.data.modifiedCount || 0
        };
    } catch (error) {
        console.error("메시지 읽음 처리 중 오류 발생:", error);
        throw error;
    }
};
//=====프롬프트 변경=====캐싱추가=====Request/Response확인====countDocuments 적용 가능성====


// 2. 안읽은 메시지 개수 조회
export const getUnreadCount = async (roomId, userId) => {
    try {
        const response = await instance.get(`/api/chat/rooms/${roomId}/unread`, {
            params: { userId: userId }
        });

        return {
            unreadCount: response.data.unreadCount || 0
        };
    } catch (error) {
        console.error("안읽은 메시지 개수 조회 중 오류 발생:", error);
        return { unreadCount: 0 };
    }
};
//=====프롬프트 변경=====캐싱추가=====Request/Response확인====countDocuments 적용 가능성====

/**
 * 🆕 여러 채팅방의 안읽은 메시지 개수 일괄 조회 (N+1 문제 해결)
 * @param {string[]} roomIds - 조회할 채팅방 ID 배열 (최대 100개)
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Object>} { roomId: unreadCount } 형태의 객체
 */
// 새로 추가한 함수
export const getUnreadCountsBatch = async (roomIds, userId) => {
    try {
        // 입력 검증
        if (!Array.isArray(roomIds) || roomIds.length === 0) {
            console.warn('getUnreadCountsBatch: roomIds가 유효하지 않음');
            return {};
        }

        if (roomIds.length > 100) {
            console.warn('getUnreadCountsBatch: 최대 100개까지만 조회 가능');
            return {};
        }

        console.log(`📊 [배치조회] ${roomIds.length}개 채팅방 안읽은 개수 조회`);

        // POST 요청으로 배열 데이터 전송
        const response = await instance.post('/api/chat/rooms/unread-batch', {
            roomIds: roomIds,
            userId: userId
        });

        console.log(`✅ [배치조회] 성공`);

        return response.data.counts || {};

    } catch (error) {
        console.error('❌ [배치조회] 실패:', error);

        // 에러 발생 시 빈 객체 반환 (UI 깨짐 방지)
        return {};
    }
};
//=====프롬프트 변경=====캐싱추가=====Request/Response확인====countDocuments 적용 가능성====

/**
 * ⚠️ DEPRECATED: Socket enterRoom 사용 권장
 *
 * 채팅방 입장 시간 기록 (Fallback용)
 * - 주용도: Socket 연결 실패 시 대체 수단
 * - 성능: HTTP 2번 호출 (~100ms)
 * - 권장: socket.emit('enterRoom') 사용 (~5ms)
 */
// 3. 채팅방 입장 시간 기록
export const recordRoomEntry = async (roomId, userId) => {
    try {
        const response = await instance.post(`/api/chat/rooms/${roomId}/entry`, {
            userId: userId,
            // entryTime: new Date().toISOString()
        });

        // // 입장과 동시에 읽음 처리
        // await markRoomAsRead(roomId, userId);

        return {
            success: true,
            entryTime: response.data.entryTime || Date.now()
        };
    } catch (error) {
        console.error("채팅방 입장 시간 기록 중 오류 발생:", error);
        throw error;
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