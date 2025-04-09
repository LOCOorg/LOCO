// useFriendChatStore.js
import { create } from 'zustand';

const useFriendChatStore = create((set) => ({
    friendChats: [],
    openFriendChat: (chatInfo) =>
        set((state) => {
            // 이미 해당 채팅방이 열려 있다면 그대로 반환
            if (state.friendChats.some(chat => chat.roomId === chatInfo.roomId)) {
                return state;
            }
            return { friendChats: [...state.friendChats, chatInfo] };
        }),
    closeFriendChat: (roomId) =>
        set((state) => ({
            friendChats: state.friendChats.filter(chat => chat.roomId !== roomId),
        })),
}));

export default useFriendChatStore;
