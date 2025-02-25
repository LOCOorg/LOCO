import axios from "axios";

const host = `${import.meta.env.VITE_API_HOST}/api/chat`;

//채팅방 생성
export const createChatRoom = async (roomType, capacity) => {
    try {
        const response = await axios.post(`${host}/rooms`, { roomType, capacity });
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
    }
};

