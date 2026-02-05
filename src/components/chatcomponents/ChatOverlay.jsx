import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useSocket } from "../../hooks/useSocket.js";
import { markRoomAsRead, getNewMessages } from "../../api/chatAPI.js";
import useAuthStore from "../../stores/authStore.js";
import useFriendChatStore from "../../stores/useFriendChatStore.js";
import ProfileButton from "../MyPageComponent/ProfileButton.jsx";
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import useNotificationStore from '../../stores/notificationStore.js';
import { filterProfanity } from '../../utils/profanityFilter.js';
import MessageReportModal from "./MessageReportModal.jsx";
import { debounce } from 'lodash';
import { useChatMessages } from "../../hooks/queries/useChatQueries.js"; // 추가
import { useUserMinimal } from "../../hooks/queries/useUserQueries.js";
import { useQueryClient } from '@tanstack/react-query'; // 추가

// eslint-disable-next-line react/prop-types
function ChatOverlay({ roomId, friend, isSidePanel = false, onMessageSent }) {

    const [newMessage, setNewMessage] = useState("");
    const socket = useSocket();
    const authUser = useAuthStore((state) => state.user);
    const senderId = authUser?._id;

    // React Query Hook
    const queryClient = useQueryClient();
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useChatMessages(roomId, 'friend', senderId);


    const messagesContainerRef = useRef(null);
    const scrollPositionRef = useRef(null);
    const { removeNotificationsByRoom } = useNotificationStore();
    const wordFilterEnabled = useNotificationStore(state => state.wordFilterEnabled);

    // 메시지 신고 모달 관련 상태
    const [showMessageReportModal, setShowMessageReportModal] = useState(false);
    const [reportTargetMessage, setReportTargetMessage] = useState(null);

    // 상대방의 마지막 읽은 시간 (인스타 "읽음" 표시용)
    const [partnerLastReadAt, setPartnerLastReadAt] = useState(null);

    const messages = useMemo(() => {
        if (!data?.pages) return [];
        return data.pages.flatMap(page => page.messages);
    }, [data]);

    // 인스타그램 DM "읽음" — 상대가 읽은 내 마지막 메시지 ID
    const lastReadMessageId = useMemo(() => {
        if (!partnerLastReadAt || !messages.length) return null;
        const readTime = new Date(partnerLastReadAt).getTime();
        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            if (msg.sender?._id === senderId && new Date(msg.textTime).getTime() <= readTime) {
                return msg._id;
            }
        }
        return null;
    }, [partnerLastReadAt, messages, senderId]);

    const scrollToBottom = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        if (scrollPositionRef.current !== null) {
            container.scrollTop = container.scrollHeight - scrollPositionRef.current;
            scrollPositionRef.current = null;
        } else {
            container.scrollTop = container.scrollHeight;
        }
    }, []);

    // Debounced 읽음 처리 (서버에서 userId 자동 추출)
    const debouncedMarkAsRead = useRef(
        debounce((roomId) => {
            if (socket && socket.connected) {
                socket.emit('markAsRead', { roomId }, (response) => {
                    if (!response.success) console.error('markAsRead 실패:', response.error);
                });
            } else {
                markRoomAsRead(roomId).catch(console.error);
            }
        }, 1000)
    ).current;

    //  cleanup 함수 추가
    useEffect(() => {
        return () => {
            debouncedMarkAsRead.cancel();
        };
    }, []);

    // Debounced enterRoom 함수 (서버에서 userId 자동 추출)
    const debouncedEnterRoom = useRef(
        debounce((roomId, socket, onMessageSent, setPartnerReadAt) => {
            if (socket && socket.connected) {
                socket.emit('enterRoom', { roomId }, (response) => {
                    if (response && response.success) {
                        if (response.partnerLastReadAt) {
                            setPartnerReadAt(new Date(response.partnerLastReadAt));
                        }
                        if (onMessageSent) onMessageSent(roomId);
                    } else {
                        // HTTP Fallback
                        markRoomAsRead(roomId).catch(console.error);
                    }
                });
            } else {
                markRoomAsRead(roomId).catch(console.error);
            }
        }, 500, { leading: true, trailing: false })
    ).current;

    useEffect(() => {
        return () => { debouncedEnterRoom.cancel(); };
    }, []);

    useEffect(() => {
        if (roomId) {
            removeNotificationsByRoom(roomId);
        }
    }, [roomId, removeNotificationsByRoom]);

    // 🆕 친구 삭제 감지 → 채팅창 자동 종료
    useEffect(() => {
        if (!socket || !friend?._id) return;

        const handleFriendDeleted = ({ friendId }) => {
            // 현재 채팅 상대가 삭제된 친구인지 확인
            if (friend._id === friendId || friend._id?.toString() === friendId?.toString()) {
                console.log(`🚪 [ChatOverlay] 친구 삭제 감지 - 채팅창 종료: ${friend.nickname}`);

                // useFriendChatStore의 selectedRoomId를 null로 설정 → 채팅창 닫힘
                useFriendChatStore.getState().setSelectedRoomId(null);
            }
        };

        socket.on('friendDeleted', handleFriendDeleted);

        return () => {
            socket.off('friendDeleted', handleFriendDeleted);
        };
    }, [socket, friend?._id, friend?.nickname]);

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

    useEffect(() => {
        // ✅ BUG 4 수정: 소켓 없으면 조기 반환
        if (!socket || !roomId) return;

        // ✅ BUG 4 수정: 재연결 시 자동으로 방 재참가 (ChatRoom.jsx와 동일 패턴)
        const handleConnect = () => {
            console.log('✅ [ChatOverlay] 소켓 연결됨 - joinRoom 실행:', socket.id);
            socket.emit("joinRoom", roomId, "friend");
        };

        socket.on('connect', handleConnect);

        // ✅ 이미 연결된 상태라면 즉시 joinRoom
        if (socket.connected) {
            socket.emit("joinRoom", roomId, "friend");
        }

        const handleReceiveMessage = async (message) => {
            if (message.chatRoom !== roomId) return;

            // ✅ sender가 문자열이면 캐시에서 사용자 정보 가져오기
            if (typeof message.sender === "string") {
                const msgSenderId = message.sender;

                // 캐시 확인
                const cachedUser = queryClient.getQueryData(['userMinimal', msgSenderId]);

                if (cachedUser) {
                    message.sender = { _id: msgSenderId, ...cachedUser };
                } else {
                    // 캐시 미스 - API 호출 및 저장
                    const { getUserBasic } = await import('../../api/userLightAPI');
                    const user = await getUserBasic(msgSenderId);
                    message.sender = { _id: msgSenderId, ...user };
                    queryClient.setQueryData(['userMinimal', msgSenderId], user);
                }
            }

            const normalizedMessage = {
                ...message,
                sender: message.sender.id
                    ? { _id: message.sender.id, name: message.sender.name, nickname: message.sender.nickname }
                    : message.sender,
            };
            // ✅ BUG 2 수정: React Query 캐시 불변성 유지 (새 page 객체 생성)
            queryClient.setQueryData(['chat-messages', roomId], (old) => {
                if (!old?.pages) return old;

                const lastIndex = old.pages.length - 1;
                const lastPage = old.pages[lastIndex];

                // 중복 체크
                if (lastPage.messages.some(m => m._id === normalizedMessage._id)) {
                    return old;
                }

                return {
                    ...old,
                    pages: old.pages.map((page, index) => {
                        if (index === lastIndex) {
                            return {
                                ...page,
                                messages: [...page.messages, normalizedMessage]
                            };
                        }
                        return page;
                    })
                };
            });

            const isFromOther = message.sender?._id !== senderId && message.sender?.id !== senderId;
            if (isFromOther && document.hasFocus()) {
                debouncedMarkAsRead(roomId);
            }
            if (onMessageSent) onMessageSent(roomId);
        };

        socket.on("receiveMessage", handleReceiveMessage);

        return () => {
            socket.off('connect', handleConnect);
            socket.off("receiveMessage", handleReceiveMessage);
        };
    }, [socket, roomId, onMessageSent, senderId, debouncedMarkAsRead]);


    // 증분 동기화 공통 함수 (중복 제거)
    const syncNewMessages = useCallback(async () => {
        try {
            const currentData = queryClient.getQueryData(['chat-messages', roomId]);
            if (!currentData?.pages) return;

            const allMessages = currentData.pages.flatMap(p => p.messages);
            const lastMessage = allMessages[allMessages.length - 1];
            if (!lastMessage) return;

            const result = await getNewMessages(roomId, lastMessage._id);
            if (result.messages && result.messages.length > 0) {
                queryClient.setQueryData(['chat-messages', roomId], (old) => {
                    if (!old?.pages) return old;

                    const newPages = [...old.pages];
                    const lastPageIndex = newPages.length - 1;
                    const lastPage = newPages[lastPageIndex];

                    const existingIds = new Set(lastPage.messages.map(m => m._id));
                    const uniqueMessages = result.messages.filter(m => !existingIds.has(m._id));
                    if (uniqueMessages.length === 0) return old;

                    newPages[lastPageIndex] = {
                        ...lastPage,
                        messages: [...lastPage.messages, ...uniqueMessages]
                    };
                    return { ...old, pages: newPages };
                });
            }
        } catch (error) {
            console.error('증분동기화 실패:', error);
        }
    }, [roomId, queryClient]);

    // 증분 동기화 (마운트 + 소켓 재연결 시)
    useEffect(() => {
        if (!roomId) return;
        syncNewMessages();
    }, [roomId, syncNewMessages, socket?.connected]);

    // partnerRead 소켓 리스너 (인스타 "읽음" 표시 실시간 갱신)
    useEffect(() => {
        if (!socket || !roomId) return;

        const handlePartnerRead = (data) => {
            if (data.roomId === roomId && data.lastReadAt) {
                setPartnerLastReadAt(new Date(data.lastReadAt));
            }
        };

        socket.on('partnerRead', handlePartnerRead);
        return () => { socket.off('partnerRead', handlePartnerRead); };
    }, [socket, roomId]);

    // 포커스/탭 전환 시 입장 + 동기화
    useEffect(() => {
        const handleFocus = () => {
            if (roomId && senderId) {
                debouncedEnterRoom(roomId, socket, onMessageSent, setPartnerLastReadAt);
                syncNewMessages();
            }
        };

        const handleVisibilityChange = () => {
            if (!document.hidden) handleFocus();
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [roomId, senderId, socket, onMessageSent, debouncedEnterRoom, syncNewMessages]);


    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);


    const handleScroll = () => {
        const container = messagesContainerRef.current;
        if (container && container.scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
            scrollPositionRef.current = container.scrollHeight;
            fetchNextPage();
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
                            sender: response.message.sender.id
                                ? { _id: response.message.sender.id, name: response.message.sender.name }
                                : response.message.sender,
                        };
                        // ✅ BUG 2 수정: React Query 캐시 불변성 유지 (새 page 객체 생성)
                        queryClient.setQueryData(['chat-messages', roomId], (old) => {
                            if (!old?.pages) return old;

                            const lastIndex = old.pages.length - 1;
                            const lastPage = old.pages[lastIndex];

                            if (lastPage.messages.some(m => m._id === normalizedMessage._id)) {
                                return old;
                            }

                            return {
                                ...old,
                                pages: old.pages.map((page, index) => {
                                    if (index === lastIndex) {
                                        return {
                                            ...page,
                                            messages: [...page.messages, normalizedMessage]
                                        };
                                    }
                                    return page;
                                })
                            };
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

    // 메시지 신고 모달 열기/닫기 함수
    const openMessageReportModal = (message) => {
        setReportTargetMessage(message);
        setShowMessageReportModal(true);
    };

    const closeMessageReportModal = () => {
        setShowMessageReportModal(false);
        setReportTargetMessage(null);
    };

    const groupedMessages = groupMessagesByDate(messages);

    return (
        <div className={`h-full flex flex-col ${isSidePanel ? 'bg-white' : 'bg-white border rounded-lg shadow-lg'}`}>
            <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-4">
                {isFetchingNextPage && <div className="text-center text-gray-500">이전 메시지 로딩 중...</div>}
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
                                                <ProfileButton profile={message.sender} size="xs" area="친구채팅" anchor={{
                                                    type: 'chat',
                                                    roomId: roomId,
                                                    parentId: roomId,
                                                    targetId: message._id
                                                }}/>
                                            </div>
                                        )}
                                        <div className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
                                            {!isMyMessage && (
                                                <span className="text-sm text-gray-600 mb-1 px-1">{message.sender?.nickname || message.sender?.name || '알 수 없음'}</span>
                                            )}
                                            <div className={`flex ${isMyMessage ? 'flex-row-reverse' : 'flex-row'} items-end gap-1`}>
                                                <div className={`px-4 py-2 rounded-2xl whitespace-pre-wrap ${isMyMessage ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'} max-w-full break-words relative`}>
                                                    {wordFilterEnabled ? filterProfanity(message.text) : message.text}
                                                    {/* 신고 버튼 - 내 메시지가 아닐 때만 표시 */}
                                                    {!isMyMessage && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openMessageReportModal(message);
                                                            }}
                                                            className="absolute -top-2 -right-2 bg-white border rounded-full w-6 h-6 flex items-center justify-center text-xs text-gray-500 hover:text-red-500 hover:border-red-300 shadow-sm"
                                                            title="신고하기"
                                                        >
                                                            •••
                                                        </button>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-500 px-1 whitespace-nowrap">{formatTime(message.textTime)}</span>
                                            </div>
                                            {isMyMessage && message._id === lastReadMessageId && (
                                                <span className="text-xs text-gray-400 pr-1">읽음</span>
                                            )}
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
            
            {/* 메시지 신고 모달 */}
            <MessageReportModal
                isOpen={showMessageReportModal}
                onClose={closeMessageReportModal}
                message={reportTargetMessage}
                roomType="friend"
            />
        </div>
    );
}

export default ChatOverlay;