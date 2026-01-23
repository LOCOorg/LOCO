import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useSocket } from "../../hooks/useSocket.js";
import { markRoomAsRead, recordRoomEntry, getNewMessages } from "../../api/chatAPI.js";
import useAuthStore from "../../stores/authStore.js";
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
function ChatOverlay({ roomId, isSidePanel = false, onMessageSent }) {

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

    const messages = useMemo(() => {
        if (!data?.pages) return [];
        return data.pages.flatMap(page => page.messages);
    }, [data]);

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

    //  Debounce 함수 추가 (messages useMemo 바로 다음)
    const debouncedMarkAsRead = useRef(
        debounce((roomId, userId) => {
            if (socket && socket.connected) {
                // Socket 우선 사용
                socket.emit('markAsRead', { roomId, userId }, (response) => {
                    if (response.success) {
                        console.log(`✅ [ChatOverlay-Debounce] ${response.readCount}개 읽음`);
                    }
                });
            } else {
                // Fallback: HTTP
                markRoomAsRead(roomId, userId).catch(console.error);
            }
        }, 1000)  // 1초 대기
    ).current;

    //  cleanup 함수 추가
    useEffect(() => {
        return () => {
            debouncedMarkAsRead.cancel();
        };
    }, []);

    // Debounced enterRoom 함수 (탭 전환용)
    const debouncedEnterRoom = useRef(
        debounce((roomId, userId, socket, onMessageSent) => {
            console.log(`🔔 [Debounce-EnterRoom] 실행 시작`);
            console.log(`  - roomId: ${roomId}`);
            console.log(`  - userId: ${userId}`);
            console.log(`  - socket.connected: ${socket?.connected}`);

            // Socket 연결 상태 확인
            if (socket && socket.connected) {
                console.log(`📡 [Debounce-EnterRoom] Socket으로 전송`);

                socket.emit('enterRoom',
                    { roomId, userId },
                    (response) => {
                        if (response && response.success) {
                            console.log(`✅ [Debounce-EnterRoom] Socket 성공`);
                            console.log(`  - 읽음 처리: ${response.readCount}개`);
                            console.log(`  - 입장 시간: ${response.entryTime}`);

                            // onMessageSent 콜백 실행
                            if (onMessageSent) {
                                onMessageSent(roomId);
                            }
                        } else {
                            // Socket 요청은 성공했지만 서버에서 실패
                            console.error(`❌ [Debounce-EnterRoom] Socket 응답 실패`);
                            console.error(`  - error: ${response?.error || '알 수 없음'}`);
                            console.log(`🔄 [Debounce-EnterRoom] HTTP Fallback 시도`);

                            // HTTP Fallback
                            Promise.all([
                                recordRoomEntry(roomId, userId),
                                markRoomAsRead(roomId, userId)
                            ])
                                .then(() => {
                                    console.log(`✅ [Debounce-EnterRoom] HTTP Fallback 성공`);
                                    if (onMessageSent) {
                                        onMessageSent(roomId);
                                    }
                                })
                                .catch((error) => {
                                    console.error(`❌ [Debounce-EnterRoom] HTTP Fallback 실패:`, error);
                                });
                        }
                    }
                );
            } else {
                // Socket 연결 끊김
                console.warn(`⚠️ [Debounce-EnterRoom] Socket 연결 안됨`);
                console.warn(`  - socket: ${socket ? 'exists' : 'null'}`);
                console.warn(`  - socket.connected: ${socket?.connected}`);
                console.log(`🔄 [Debounce-EnterRoom] HTTP Fallback 사용`);

                // HTTP Fallback
                Promise.all([
                    recordRoomEntry(roomId, userId),
                    markRoomAsRead(roomId, userId)
                ])
                    .then(() => {
                        console.log(`✅ [Debounce-EnterRoom] HTTP 성공`);
                        if (onMessageSent) {
                            onMessageSent(roomId);
                        }
                    })
                    .catch((error) => {
                        console.error(`❌ [Debounce-EnterRoom] HTTP 실패:`, error);
                    });
            }
        },  500, { leading: true, trailing: false })
    ).current;

    // ✅ Cleanup 함수 추가
    useEffect(() => {
        return () => {
            console.log('🧹 [Debounce-EnterRoom] Cleanup - 취소됨');
            debouncedEnterRoom.cancel();
        };
    }, []);

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

    useEffect(() => {
        if (socket && roomId) {
            socket.emit("joinRoom", roomId, "friend");

            const handleReceiveMessage = async (message) => {
                if (message.chatRoom !== roomId) return;

                // ✅ sender가 문자열이면 캐시에서 사용자 정보 가져오기
                if (typeof message.sender === "string") {
                    const senderId = message.sender;

                    // 캐시 확인
                    const cachedUser = queryClient.getQueryData(['userMinimal', senderId]);

                    if (cachedUser) {
                        message.sender = { _id: senderId, ...cachedUser };
                    } else {
                        // 캐시 미스 - API 호출 및 저장
                        const { getUserBasic } = await import('../../api/userLightAPI');
                        const user = await getUserBasic(senderId);
                        message.sender = { _id: senderId, ...user };
                        queryClient.setQueryData(['userMinimal', senderId], user);
                    }
                }

                const normalizedMessage = {
                    ...message,
                    sender: message.sender.id
                        ? { _id: message.sender.id, name: message.sender.name, nickname: message.sender.nickname }
                        : message.sender,
                };
                // ✅ React Query 캐시에 메시지 추가
                queryClient.setQueryData(['chat-messages', roomId], (old) => {
                    if (!old?.pages) return old;

                    const newPages = [...old.pages];
                    const lastPage = newPages[newPages.length - 1];

                    // 중복 체크 후 추가
                    if (!lastPage.messages.some(m => m._id === normalizedMessage._id)) {
                        lastPage.messages = [...lastPage.messages, normalizedMessage];
                    }

                    return { ...old, pages: newPages };
                });

                const isFromOther = message.sender?._id !== senderId || message.sender?.id !== senderId;
                if (isFromOther && document.hasFocus()) {
                    // Debounced 읽음 처리 (1초에 1번만)
                    debouncedMarkAsRead(roomId, senderId);
                }
                if (onMessageSent) onMessageSent(roomId);
            };

            socket.on("receiveMessage", handleReceiveMessage);
            return () => socket.off("receiveMessage", handleReceiveMessage);
        }
    }, [socket, roomId, onMessageSent, senderId, debouncedMarkAsRead]);


    // 증분 동기화
    useEffect(() => {
        if (!roomId) return;

        let isCancelled = false;

        const syncNewMessages = async () => {
            if (isCancelled) return;

            try {
                const currentData = queryClient.getQueryData(['chat-messages', roomId]);
                if (!currentData?.pages) return;

                const allMessages = currentData.pages.flatMap(p => p.messages);
                const lastMessage = allMessages[allMessages.length - 1];
                if (!lastMessage) return;

                console.log(`🔄 [ChatOverlay-증분동기화] 시작 - lastId: ${lastMessage._id}`);

                const result = await getNewMessages(roomId, lastMessage._id);
                if (isCancelled) return;

                if (result.messages && result.messages.length > 0) {
                    console.log(`✅ [ChatOverlay-증분동기화] ${result.messages.length}개 발견`);

                    queryClient.setQueryData(['chat-messages', roomId], (old) => {
                        if (!old?.pages) return old;

                        const newPages = [...old.pages];
                        const lastPageIndex = newPages.length - 1;
                        const lastPage = newPages[lastPageIndex];

                        const existingIds = new Set(lastPage.messages.map(m => m._id));
                        const uniqueMessages = result.messages.filter(m => !existingIds.has(m._id));

                        if (uniqueMessages.length === 0) return old;

                        // ✅ 불변성 유지
                        newPages[lastPageIndex] = {
                            ...lastPage,
                            messages: [...lastPage.messages, ...uniqueMessages]
                        };

                        return { ...old, pages: newPages };
                    });
                }
            } catch (error) {
                console.error('❌ [ChatOverlay-증분동기화] 실패:', error);
            }
        };

        // roomId 변경 시 또는 소켓 재연결 시
        syncNewMessages();

        return () => {
            isCancelled = true;
        };
    }, [roomId, queryClient, socket?.connected]);


    useEffect(() => {
        const handleFocus = () => {
            if (roomId && senderId) {
                console.log('👁️ [ChatOverlay-Focus] 탭 포커스 감지');

                // 1. 입장 처리
                debouncedEnterRoom(roomId, senderId, socket, onMessageSent);

                // 2. 증분 동기화 (위 useEffect와 동일한 로직)
                const currentData = queryClient.getQueryData(['chat-messages', roomId]);
                if (currentData?.pages) {
                    const allMessages = currentData.pages.flatMap(p => p.messages);
                    const lastMessage = allMessages[allMessages.length - 1];

                    if (lastMessage) {
                        getNewMessages(roomId, lastMessage._id)
                            .then(result => {
                                if (result.messages && result.messages.length > 0) {
                                    queryClient.setQueryData(['chat-messages', roomId], (old) => {
                                        if (!old?.pages) return old;

                                        const newPages = [...old.pages];
                                        const lastPageIndex = newPages.length - 1;
                                        const lastPage = newPages[lastPageIndex];

                                        const existingIds = new Set(lastPage.messages.map(m => m._id));
                                        const uniqueMessages = result.messages.filter(m => !existingIds.has(m._id));

                                        if (uniqueMessages.length === 0) return old;

                                        // ✅ 불변성 유지
                                        newPages[lastPageIndex] = {
                                            ...lastPage,
                                            messages: [...lastPage.messages, ...uniqueMessages]
                                        };

                                        return { ...old, pages: newPages };
                                    });
                                }
                            })
                            .catch(error => console.error('포커스 시 증분동기화 실패:', error));
                    }
                }
            } else {
                console.warn('⚠️ [ChatOverlay-Focus] roomId 또는 senderId 없음');
            }
        };

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                console.log('👁️ [ChatOverlay-Visibility] 탭 보임 감지');
                handleFocus();
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [roomId, senderId, socket, onMessageSent, debouncedEnterRoom, queryClient]);


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
                        // ✅ React Query 캐시에 메시지 추가
                        queryClient.setQueryData(['chat-messages', roomId], (old) => {
                            if (!old?.pages) return old;

                            const newPages = [...old.pages];
                            const lastPage = newPages[newPages.length - 1];

                            if (!lastPage.messages.some(m => m._id === normalizedMessage._id)) {
                                lastPage.messages = [...lastPage.messages, normalizedMessage];
                            }

                            return { ...old, pages: newPages };
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