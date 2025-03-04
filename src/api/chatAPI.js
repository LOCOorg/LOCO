import axios from "axios";

const host = `${import.meta.env.VITE_API_HOST}/api/chat`;

//채팅방 생성
export const createChatRoom = async (roomType, capacity,matchedGender) => {
    try {
        const response = await axios.post(`${host}/rooms`, { roomType, capacity, matchedGender });
        return response.data;
    } catch (error) {
        console.error("채팅방 생성 중 오류 발생:", error);
    }
};

//채팅 리스트
export const fetchChatRooms = async () => {
    try {
        const response = await axios.get(`${host}/rooms`);
        return response.data;
    } catch (error) {
        console.error("채팅방 목록을 불러오는 중 오류 발생:", error);
        return [];
    }
};

//채팅 메세지 불러오기
export const fetchMessages = async (roomId) => {
    try {
        const response = await axios.get(`${host}/messages/${roomId}`);
        return response.data;
    } catch (error) {
        console.error("메시지를 불러오는 중 오류 발생:", error);
        return [];
    }
};

//채팅 메세지 전송
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

//채팅 삭제
export const deleteMessage = async (messageId) => {
    try {
        const response = await axios.put(`${host}/messages/${messageId}`);
        return response.data;
    } catch (error) {
        console.error("메시지 삭제 중 오류 발생:", error);
        throw error; // 오류가 발생하면 throw하여 catch로 넘어가도록 함
    }
};

//사용자 참가
export const joinChatRoom = async (roomId, userId) => {
    try {
        const response = await fetch(`${host}/rooms/${roomId}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }), // 사용자 ID를 body로 전송
        });

        const data = await response.json();
        console.log('채팅방 참가 성공:', data);

    } catch (error) {
        console.error('채팅방 참가 오류:', error);
    }
};

// 채팅방 나가기 시 참여자에서 제거
export const leaveChatRoom = async (roomId, userId) => {
    try {
        const response = await fetch(`${host}/rooms/${roomId}/${userId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "채팅방 나가기 실패");
        }

        return await response.json();
    } catch (error) {
        console.error("❌ leaveChatRoom API 오류:", error);
        throw error;
    }
};







