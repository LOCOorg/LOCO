import axios from "axios";

const host = `${import.meta.env.VITE_API_HOST}/api/chat`;

// 채팅방 생성
export const createChatRoom = async (roomType, capacity, matchedGender, ageGroup) => {
    try {
        const response = await axios.post(`${host}/rooms`, { roomType, capacity, matchedGender, ageGroup });
        return response.data;
    } catch (error) {
        console.error("채팅방 생성 중 오류 발생:", error);
    }
};

// 친구와 채팅방 생성
export const createFriendRoom = async (roomType, capacity) => {
    try {
        const response = await axios.post(`${host}/friend/rooms`, { roomType, capacity });
        return response.data;
    } catch (error) {
        console.log("친구와 채팅방 생성 중 오류 발생", error);
    }
};

// 채팅 리스트
export const fetchChatRooms = async () => {
    try {
        const response = await axios.get(`${host}/rooms`);
        return response.data;
    } catch (error) {
        console.error("채팅방 목록을 불러오는 중 오류 발생:", error);
        return [];
    }
};

// 특정 채팅방 정보 가져오기
export const getChatRoomInfo = async (roomId) => {
    try {
        const response = await axios.get(`${host}/rooms/${roomId}`);
        return response.data;
    } catch (error) {
        console.error("해당 채팅방 정보 불러오는 중 오류 발생:", error);
        return [];
    }
};

// 채팅 메세지 불러오기
export const fetchMessages = async (roomId) => {
    try {
        const response = await axios.get(`${host}/messages/${roomId}`);
        return response.data;
    } catch (error) {
        console.error("메시지를 불러오는 중 오류 발생:", error);
        return [];
    }
};

// 채팅 메세지 전송
export const sendMessage = async (roomId, sender, text) => {
    try {
        const response = await axios.post(`${host}/messages`, {
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
        const response = await axios.put(`${host}/messages/${messageId}`);
        return response.data;
    } catch (error) {
        console.error("메시지 삭제 중 오류 발생:", error);
        throw error; // 오류가 발생하면 throw하여 catch로 넘어가도록 함
    }
};

// 사용자 참가
export const joinChatRoom = async (roomId, userId) => {
    try {
        const response = await axios.post(`${host}/rooms/${roomId}/join`, { userId });
        console.log("채팅방 참가 성공:", response.data);
        return response.data;
    } catch (error) {
        console.error("채팅방 참가 오류:", error);
        throw error;
    }
};

// 채팅방 나가기 시 참여자에서 제거
export const leaveChatRoom = async (roomId, userId) => {
    try {
        const response = await axios.delete(`${host}/rooms/${roomId}/${userId}`);
        return response.data;
    } catch (error) {
        console.error("❌ leaveChatRoom API 오류:", error);
        throw error;
    }
};

// 사용자가 종료한 채팅방 ID 목록을 가져오는 함수
export const fetchUserLeftRooms = async (userId) => {
    try {
        const response = await axios.get(`${host}/leftRooms/${userId}`);
        return response.data.leftRooms; // 예를 들어, [roomId1, roomId2, ...]
    } catch (error) {
        console.error("사용자 종료 채팅방 목록 불러오는 중 오류 발생:", error);
        throw error;
    }
};
