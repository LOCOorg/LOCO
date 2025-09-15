import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "../../hooks/useSocket.js";
import { fetchMessages, recordRoomEntry } from "../../api/chatAPI.js";
import useAuthStore from "../../stores/authStore.js";
import ProfileButton from "../MyPageComponent/ProfileButton.jsx";
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import useNotificationStore from '../../stores/notificationStore.js';

// eslint-disable-next-line react/prop-types
function ChatOverlay({ roomId, isSidePanel = false, onMessageSent }) {
    const [messages, setMessages] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, hasNextPage: false });
    const [loadingMore, setLoadingMore] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const socket = useSocket();
    const authUser = useAuthStore((state) => state.user);
    const senderId = authUser?._id;
    const messagesContainerRef = useRef(null);
    const scrollPositionRef = useRef(null);
    const { removeNotificationsByRoom } = useNotificationStore();

    useEffect(() => {
        if (roomId) {
            removeNotificationsByRoom(roomId);
        }
    }, [roomId, removeNotificationsByRoom]);

    const formatTime = (textTime) => {
        if (!textTime) return "";
        const date = new Date(textTime);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (textTime) => {
        if (!textTime) return "";
        const date = new Date(textTime);
        return date.toLocaleDateString();
    };

    const groupMessagesByDate = (messages) => {
        return messages.reduce((groups, message) => {
            const date = formatDate(message.textTime);
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(message);
            return groups;
        }, {});
    };

    const loadMessages = useCallback(async (page) => {
        if (!roomId || !senderId) return;
        setLoadingMore(true);
        try {
            const data = await fetchMessages(roomId, page, 20);
            if (data && data.messages) {
                if (page === 1) {
                    setMessages(data.messages);
                } else {
                    setMessages(prev => [...data.messages, ...prev]);
                }
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("채팅 메시지 불러오기 실패:", error);
        } finally {
            setLoadingMore(false);
        }
    }, [roomId, senderId]);

    useEffect(() => {
        loadMessages(1);
    }, [loadMessages]);

    useEffect(() => {
        if (socket && roomId) {
            socket.emit("joinRoom", roomId, "friend");

            const handleReceiveMessage = (message) => {
                if (message.chatRoom !== roomId) return;
                const normalizedMessage = {
                    ...message,
                    sender: message.sender.id ? { _id: message.sender.id, name: message.sender.name, nickname: message.sender.nickname } : message.sender,
                };
                setMessages((prevMessages) => {
                    const messageSet = new Set(prevMessages.map((msg) => msg._id));
                    if (!messageSet.has(normalizedMessage._id)) {
                        return [...prevMessages, normalizedMessage];
                    }
                    return prevMessages;
                });
                const isFromOther = message.sender?._id !== senderId || message.sender?.id !== senderId;
                if (isFromOther && document.hasFocus()) {
                    setTimeout(async () => {
                        try {
                            await recordRoomEntry(roomId, senderId);
                            if (onMessageSent) onMessageSent(roomId);
                        } catch (error) {
                            console.error('메시지 수신 후 읽음 처리 실패:', error);
                        }
                    }, 100);
                }
                if (onMessageSent) onMessageSent(roomId);
            };

            socket.on("receiveMessage", handleReceiveMessage);
            return () => socket.off("receiveMessage", handleReceiveMessage);
        }
    }, [socket, roomId, onMessageSent, senderId]);

    useEffect(() => {
        const handleFocus = () => {
            if (roomId && senderId) {
                recordRoomEntry(roomId, senderId).catch(console.error);
                if (onMessageSent) onMessageSent(roomId);
            }
        };
        const handleVisibilityChange = () => {
            if (!document.hidden && roomId && senderId) handleFocus();
        };
        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [roomId, senderId, onMessageSent]);

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        if (scrollPositionRef.current !== null) {
            container.scrollTop = container.scrollHeight - scrollPositionRef.current;
            scrollPositionRef.current = null;
        } else {
            container.scrollTop = container.scrollHeight;
        }
    }, [messages]);

    const handleScroll = () => {
        const container = messagesContainerRef.current;
        if (container && container.scrollTop === 0 && pagination.hasNextPage && !loadingMore) {
            scrollPositionRef.current = container.scrollHeight;
            loadMessages(pagination.currentPage + 1);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() && socket && roomId && senderId) {
            try {
                const messageData = { chatRoom: roomId, sender: senderId, text: newMessage, roomType: "friend" };
                socket.emit("sendMessage", messageData, (response) => {
                    if (response.success) {
                        const normalizedMessage = {
                            ...response.message,
                            sender: response.message.sender.id ? { _id: response.message.sender.id, name: response.message.sender.name } : response.message.sender,
                        };
                        setMessages((prevMessages) => {
                            const messageSet = new Set(prevMessages.map((msg) => msg._id));
                            if (!messageSet.has(normalizedMessage._id)) {
                                return [...prevMessages, normalizedMessage];
                            }
                            return prevMessages;
                        });
                        if (onMessageSent) onMessageSent(roomId);
                    } else {
                        console.error("메시지 전송 실패:", response.error);
                    }
                });
                setNewMessage("");
            } catch (error) {
                console.error("메시지 전송 실패:", error);
            }
        }
    };

    const groupedMessages = groupMessagesByDate(messages);

    return (
        <div className={`h-full flex flex-col ${isSidePanel ? 'bg-white' : 'bg-white border rounded-lg shadow-lg'}`}>
            <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMore && <div className="text-center text-gray-500">이전 메시지 로딩 중...</div>}
                {Object.entries(groupedMessages).map(([date, dayMessages]) => (
                    <div key={date}>
                        <div className="text-center mb-4">
                            <span className="bg-gray-100 text-gray-500 text-sm px-3 py-1 rounded-full">{date}</span>
                        </div>
                        {dayMessages.map((message) => {
                            const isMyMessage = message.sender?._id === senderId;
                            return (
                                <div key={message._id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-3`}>
                                    <div className={`flex ${isMyMessage ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[80%]`}>
                                        {!isMyMessage && (
                                            <div className="flex-shrink-0">
                                                <ProfileButton profile={message.sender} size="xs" />
                                            </div>
                                        )}
                                        <div className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
                                            {!isMyMessage && (
                                                <span className="text-sm text-gray-600 mb-1 px-1">{message.sender?.nickname || message.sender?.name || '알 수 없음'}</span>
                                            )}
                                            <div className={`flex ${isMyMessage ? 'flex-row-reverse' : 'flex-row'} items-end gap-1`}>
                                                <div className={`px-4 py-2 rounded-2xl whitespace-pre-wrap ${isMyMessage ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'} max-w-full break-words`}>
                                                    {message.text}
                                                </div>
                                                <span className="text-xs text-gray-500 px-1 whitespace-nowrap">{formatTime(message.textTime)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
            <div className="border-t bg-gray-50 p-4">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => {
                                if (e.target.value.length <= 100) {
                                    setNewMessage(e.target.value);
                                }
                            }}
                            placeholder="메시지를 입력하세요..."
                            maxLength={100}
                            className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 pr-20"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">{newMessage.length}/100</span>
                    </div>
                    <button type="submit" disabled={!newMessage.trim()} className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                        <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ChatOverlay;