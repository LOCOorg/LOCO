import { create } from "zustand";
import { toggleFriendRoomActive } from "../api/chatAPI.js";
import { getDecryptedItem, setEncryptedItem } from "../utils/storageUtils.js";

// ✅ 초기 데이터 직접 복원
const getInitialState = () => {
    try {
        const stored = getDecryptedItem('friend-chat-storage');
        if (stored?.state) {
            return {
                friendChats: stored.state.friendChats || [],
                hiddenRoomIds: stored.state.hiddenRoomIds || [],
                friendRooms: stored.state.friendRooms || [],
            };
        }
    } catch (error) {
        console.error('초기 데이터 복원 실패:', error);
    }
    return {
        friendChats: [],
        hiddenRoomIds: [],
        friendRooms: [],
    };
};

// ✅ 저장 헬퍼 함수
const saveToStorage = (state) => {
    try {
        setEncryptedItem('friend-chat-storage', {
            state: {
                friendChats: state.friendChats,
                hiddenRoomIds: state.hiddenRoomIds,
                friendRooms: state.friendRooms,
            },
            version: 0
        });
    } catch (error) {
        console.error('데이터 저장 실패:', error);
    }
};

const useFriendChatStore = create((set, get) => ({
    // ✅ 초기 상태를 직접 복원
    ...getInitialState(),

    openFriendChat: (chat) => {
        set((state) => {
            let newState;
            if (state.hiddenRoomIds.includes(chat.roomId)) {
                newState = {
                    ...state,
                    hiddenRoomIds: state.hiddenRoomIds.filter((id) => id !== chat.roomId),
                };
            } else {
                if (state.friendChats.some((c) => c.roomId === chat.roomId)) return state;
                newState = { ...state, friendChats: [...state.friendChats, chat] };
            }

            // ✅ 상태 변경 후 즉시 저장
            saveToStorage(newState);
            return newState;
        });
    },

    closeFriendChat: async (roomId) => {
        set((state) => {
            const newState = {
                ...state,
                friendChats: state.friendChats.filter((c) => c.roomId !== roomId),
                friendRooms: state.friendRooms.filter((r) => r.roomId !== roomId),
                hiddenRoomIds: state.hiddenRoomIds.filter((id) => id !== roomId),
            };

            // ✅ 상태 변경 후 즉시 저장
            saveToStorage(newState);
            return newState;
        });

        try {
            await toggleFriendRoomActive(roomId, false);
        } catch (e) {
            console.error(e);
        }
    },

    toggleHideChat: (roomId) => {
        set((state) => {
            const newState = {
                ...state,
                hiddenRoomIds: state.hiddenRoomIds.includes(roomId)
                    ? state.hiddenRoomIds.filter((id) => id !== roomId)
                    : [...state.hiddenRoomIds, roomId],
            };

            // ✅ 상태 변경 후 즉시 저장
            saveToStorage(newState);
            return newState;
        });
    },

    setFriendRooms: (rooms) => {
        set((state) => {
            const newState = { ...state, friendRooms: rooms };
            saveToStorage(newState);
            return newState;
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

    swapFriendChat: (selectedRoomId, maxWindows) => {
        set((state) => {
            if (state.friendChats.length <= maxWindows) return state;

            const chats = [...state.friendChats];
            const removed = chats.shift();
            const idx = chats.findIndex((c) => c.roomId === selectedRoomId);
            if (idx === -1) return state;

            const [selected] = chats.splice(idx, 1);
            chats.splice(maxWindows - 1, 0, selected);
            chats.push(removed);

            const newState = { ...state, friendChats: chats };
            saveToStorage(newState);
            return newState;
        });
    },
    // ✅ 채팅방이 열려있고 보이는 상태인지 확인하는 함수
    isChatOpenAndVisible: (roomId) => {
        const state = get();
        const isOpen = state.friendChats.some(chat => chat.roomId === roomId);
        const isVisible = !state.hiddenRoomIds.includes(roomId);
        return isOpen && isVisible;
    },
}));

export default useFriendChatStore;
