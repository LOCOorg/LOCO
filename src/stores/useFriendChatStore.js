import { create } from "zustand";
import { toggleFriendRoomActive } from "../api/chatAPI.js";

const useFriendChatStore = create((set) => ({
    /* ───────────────── 채팅 오버레이 ───────────────── */
    friendChats: [],               // { roomId, friend }
    hiddenRoomIds: [],             // ← 새로 추가

    openFriendChat: (chat) =>
        set((state) => {
            /* 이미 열려 있으나 숨김 상태라면 hidden 해제 */
            if (state.hiddenRoomIds.includes(chat.roomId)) {
                return {
                    ...state,
                    hiddenRoomIds: state.hiddenRoomIds.filter((id) => id !== chat.roomId),
                };
            }
            /* 창이 열려 있지 않으면 리스트에 추가 */
            if (state.friendChats.some((c) => c.roomId === chat.roomId)) return state;
            return { friendChats: [...state.friendChats, chat] };
        }),

    closeFriendChat: async (roomId) => {
        set((state) => ({
            friendChats: state.friendChats.filter((c) => c.roomId !== roomId),
            friendRooms: state.friendRooms.filter((r) => r.roomId !== roomId),
            hiddenRoomIds: state.hiddenRoomIds.filter((id) => id !== roomId),
        }));
        try {
            await toggleFriendRoomActive(roomId, false);
        } catch (e) {
            console.error(e);
        }
    },

    /* 최소화(숨김) 토글 */
    toggleHideChat: (roomId) =>
        set((state) => ({
            hiddenRoomIds: state.hiddenRoomIds.includes(roomId)
                ? state.hiddenRoomIds.filter((id) => id !== roomId)
                : [...state.hiddenRoomIds, roomId],
        })),

    /* ───────────────── 드롭다운 전용 friends 목록 (기존 코드) ───────────────── */
    friendRooms: [],
    setFriendRooms: (rooms) => set({ friendRooms: rooms }),
    addFriendRoom: (room) =>
        set((state) => {
            if (state.friendRooms.some((r) => r.roomId === room.roomId)) return state;
            return { friendRooms: [room, ...state.friendRooms] };
        }),
    removeFriendRoom: (roomId) =>
        set((state) => ({
            friendRooms: state.friendRooms.filter((r) => r.roomId !== roomId),
        })),

    /* 숨김 영역 ↔ 표시 영역 교환 (기존 코드) */
    swapFriendChat: (selectedRoomId, maxWindows) =>
        set((state) => {
            if (state.friendChats.length <= maxWindows) return state;
            const chats = [...state.friendChats];
            const removed = chats.shift(); // visible 첫 번째 제거
            const idx = chats.findIndex((c) => c.roomId === selectedRoomId);
            if (idx === -1) return state;
            const [selected] = chats.splice(idx, 1);
            chats.splice(maxWindows - 1, 0, selected);
            chats.push(removed);
            return { friendChats: chats };
        }),
}));

export default useFriendChatStore;
