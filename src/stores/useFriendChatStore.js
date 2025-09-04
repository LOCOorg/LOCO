import { create } from "zustand";
import { getDecryptedItem, setEncryptedItem } from "../utils/storageUtils.js";

const getInitialState = () => {
    try {
        const stored = getDecryptedItem('friend-chat-storage');
        if (stored?.state) {
            return {
                friendRooms: stored.state.friendRooms || [],
                roomSummaries: {}, // 각 채팅방의 요약 정보
                sidePanelOpen: false,
                selectedRoomId: null,
                activeRightTab: 'chatlist',
                shouldOpenPanel: false,
                targetRoomId: null,
                targetFriendInfo: null,
            };
        }
    } catch (error) {
        console.error('초기 데이터 복원 실패:', error);
    }
    return {
        friendRooms: [],
        roomSummaries: {},
        sidePanelOpen: false,
        selectedRoomId: null,
        activeRightTab: 'chatlist',
        shouldOpenPanel: false,
        targetRoomId: null,
        targetFriendInfo: null,
    };
};

const saveToStorage = (state) => {
    try {
        setEncryptedItem('friend-chat-storage', {
            state: { friendRooms: state.friendRooms },
            version: 0
        });
    } catch (error) {
        console.error('데이터 저장 실패:', error);
    }
};

const useFriendChatStore = create((set, get) => ({
    ...getInitialState(),

    // 친구 채팅방 목록 관리
    setFriendRooms: (rooms) => {
        set((state) => {
            const newState = { ...state, friendRooms: rooms };
            saveToStorage(newState);
            return newState;
        });
    },

    // 채팅방 요약 정보 설정 - 새 객체 생성 보장
    setRoomSummary: (roomId, summary) => {
        set((state) => ({
            ...state,
            roomSummaries: {
                ...state.roomSummaries,
                [roomId]: { ...summary } // 새 객체 생성 보장
            }
        }));
    },

    // 여러 채팅방 요약 정보 한번에 설정
    setRoomSummaries: (summaries) => {
        set((state) => ({
            ...state,
            roomSummaries: { ...summaries } // 완전히 새로운 객체
        }));
    },

    // 실시간 메시지 업데이트 (효율적인 단일 채팅방 업데이트)
    updateRoomMessage: (roomId, messageData) => {
        set((state) => {
            const currentSummary = state.roomSummaries[roomId] || {
                lastMessage: '',
                lastMessageTime: null,
                unreadCount: 0
            };

            const newSummary = {
                lastMessage: messageData.text || currentSummary.lastMessage,
                lastMessageTime: messageData.timestamp || messageData.textTime || Date.now(),
                // ✅ isFromOther가 true일 때만 unreadCount 증가
                unreadCount: messageData.isFromOther ?
                    (currentSummary.unreadCount + 1) :
                    currentSummary.unreadCount
            };

            return {
                ...state,
                roomSummaries: {
                    ...state.roomSummaries,
                    [roomId]: newSummary
                }
            };
        });
    },
    // ✅ 활성 채팅방 상태 추가
    setActiveChat: (roomId) => {
        set({ activeRoomId: roomId });
    },

    clearActiveChat: () => {
        set({ activeRoomId: null });
    },

    // 채팅방 읽음 처리
    markRoomAsRead: (roomId) => {
        set((state) => {
            const currentSummary = state.roomSummaries[roomId];
            if (!currentSummary) return state;

            return {
                ...state,
                roomSummaries: {
                    ...state.roomSummaries,
                    [roomId]: {
                        ...currentSummary,
                        unreadCount: 0
                    }
                }
            };
        });
    },

    addFriendRoom: (room) => {
        set((state) => {
            if (state.friendRooms.some((r) => r.roomId === room.roomId)) return state;
            const newState = { ...state, friendRooms: [room, ...state.friendRooms] };
            saveToStorage(newState);
            return newState;
        });
    },

    removeFriendRoom: (roomId) => {
        set((state) => {
            const newState = {
                ...state,
                friendRooms: state.friendRooms.filter((r) => r.roomId !== roomId),
            };
            saveToStorage(newState);
            return newState;
        });
    },

    // 사이드패널 상태 관리
    setSidePanelOpen: (open) => set({ sidePanelOpen: open }),
    setSelectedRoomId: (roomId) => set({ selectedRoomId: roomId }),
    setActiveRightTab: (tab) => set({ activeRightTab: tab }),

    // 외부에서 사이드패널 열기
    openSidePanelWithChat: (roomId, friendInfo) => {
        set({
            shouldOpenPanel: true,
            targetRoomId: roomId,
            targetFriendInfo: friendInfo,
        });
    },

    clearOpenSignal: () => {
        set({
            shouldOpenPanel: false,
            targetRoomId: null,
            targetFriendInfo: null,
        });
    },

    // 사이드패널 체크 함수
    isSidePanelChatVisible: (roomId) => {
        const state = get();
        return state.sidePanelOpen &&
            state.activeRightTab === 'chat' &&
            state.selectedRoomId === roomId;
    },
}));

export default useFriendChatStore;
