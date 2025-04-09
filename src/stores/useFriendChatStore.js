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
    // hidden 영역의 채팅 아이콘 클릭 시 순환 교환 로직
    swapFriendChat: (selectedRoomId, maxWindows) =>
        set((state) => {
            if (state.friendChats.length <= maxWindows) return state;
            const newChats = [...state.friendChats];
            // visible 영역의 가장 왼쪽 채팅 제거
            const removedVisible = newChats.shift();
            // hidden 채팅 중 선택한 채팅 찾기
            const selectedIndex = newChats.findIndex(chat => chat.roomId === selectedRoomId);
            if (selectedIndex === -1) return state;
            const [selectedChat] = newChats.splice(selectedIndex, 1);
            // visible 영역은 newChats[0 ~ maxWindows-1] (현재 newChats의 길이는 maxWindows-1)
            newChats.splice(maxWindows - 1, 0, selectedChat);
            // 제거한 visible 채팅을 마지막 hidden 영역에 추가
            newChats.push(removedVisible);
            return { friendChats: newChats };
        }),
}));

export default useFriendChatStore;
