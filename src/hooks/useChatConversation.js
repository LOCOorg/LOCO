// File: src/hooks/useChatConversation.js
import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * 채팅 모드에서 활성 방(active)과 종료된 랜덤 방(history)을
 * 모두 가져와 병합한 후 최근순으로 정렬합니다.
 *
 * @param {object|null} chatUser  선택된 사용자 객체 ({ _id, … }) 또는 null
 * @param {string}       mode      현재 모드 ('chat' 일 때만 동작)
 */
export function useChatConversation(chatUser, mode) {
    const [rooms, setRooms]               = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [messages, setMessages]         = useState([]);

    // 1) 활성 방 + 랜덤채팅 히스토리 병합 로직
    useEffect(() => {
        if (mode === 'chat' && chatUser) {
            (async () => {
                try {
                    // ─ 활성 채팅방 조회 ─
                    const activeRes = await axios.get('/api/chat/rooms', {
                        params: { chatUsers: chatUser._id }
                    });
                    const activeRooms = (activeRes.data || []).map(r => ({
                        ...r,
                        timestamp: r.updatedAt || r.createdAt,
                        source: 'active'
                    }));

                    // ─ 종료된 랜덤채팅 히스토리 조회 ─
                    const histRes = await axios.get('/api/chat/search/chat-room-history', {
                        params: {
                            'meta.chatUsers': chatUser._id,
                            page: 1,
                            size: 100
                        }
                    });
                    const historyList = histRes.data.dtoList || [];
                    const historyRooms = historyList.map(h => ({
                        _id:           h.chatRoomId,
                        chatUsers:     h.meta.chatUsers,
                        roomType:      h.meta.roomType,
                        capacity:      h.meta.capacity,
                        matchedGender: h.meta.matchedGender,
                        createdAt:     h.meta.createdAt,
                        closedAt:      h.timestamp,
                        timestamp:     h.timestamp,
                        source:        'history'
                    }));

                    // ─ 두 배열 합친 뒤 timestamp 내림차순 정렬 ─
                    const merged = [...activeRooms, ...historyRooms].sort(
                        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
                    );

                    setRooms(merged);
                    setSelectedRoom(null);
                    setMessages([]);
                } catch (err) {
                    console.error(err);
                }
            })();
        } else {
            setRooms([]);
            setSelectedRoom(null);
            setMessages([]);
        }
    }, [mode, chatUser]);

    // 2) 선택된 방의 메시지 불러오기
    useEffect(() => {
        if (mode === 'chat' && selectedRoom) {
            // 히스토리 방이면 includeDeleted=true, 아닐 땐 빈 파라미터
            const params =
                selectedRoom.source === 'history'
                    ? { includeDeleted: true }
                    : {};

            axios
                .get(`/api/chat/messages/${selectedRoom._id}`, { params })
                .then(res => setMessages(res.data || []))
                .catch(console.error);
        } else {
            setMessages([]);
        }
    }, [mode, selectedRoom]);

    return { rooms, selectedRoom, setSelectedRoom, messages };
}
