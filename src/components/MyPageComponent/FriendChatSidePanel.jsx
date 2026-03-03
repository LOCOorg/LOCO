import { useState, useEffect, useContext, useCallback, useRef, useMemo } from 'react';
import useAuthStore from '../../stores/authStore';
import useFriendChatStore from '../../stores/useFriendChatStore';
import { NotificationContext } from '../../hooks/NotificationContext';
import {
    // fetchChatRooms,
    // fetchMessages,
    markRoomAsRead,
    // getUnreadCount,
    getUnreadCountsBatch,
    fetchLastMessagesBatch
} from '../../api/chatAPI';
import { useSocket } from '../../hooks/useSocket';
import {
    // acceptFriendRequest,
    // declineFriendRequest,
    // getFriendRequestList,
    // getFriendRequestCount,
} from '../../api/userAPI';
import { getUserFriendProfile } from '../../api/userLightAPI.js';
import {
    useFriendRequestCount,
    useFriendRequestList,
    useAcceptFriendRequest,
    useDeclineFriendRequest} from '../../hooks/queries/useFriendQueries';
import { useQueryClient } from '@tanstack/react-query';
import { useChatRooms } from '../../hooks/queries/useChatQueries';
import useFriendListStore from '../../stores/useFriendListStore';
import {
    UserGroupIcon,
    CheckIcon,
    XMarkIcon,
    ChatBubbleLeftEllipsisIcon,
    UserPlusIcon,
    ArrowLeftIcon,
} from '@heroicons/react/24/solid';
import { XMarkIcon as XMarkOutlineIcon } from '@heroicons/react/24/outline';
import ProfileButton from "./ProfileButton.jsx";
import FriendListPanel from "./FriendListPanel.jsx";
import ChatOverlay from "../chatcomponents/ChatOverlay.jsx";
import { filterProfanity } from '../../utils/profanityFilter.js';
import useNotificationStore from '../../stores/notificationStore.js';
import debounce from 'lodash.debounce';
import CommonModal from '../../common/CommonModal.jsx';

const FriendChatSidePanel = () => {
    // ✅ 모든 hooks를 최상위에서 먼저 호출
    const { user, setUser: setAuthUser } = useAuthStore();
    const {
        friendRooms,
        setFriendRooms,
        roomSummaries,
        setRoomSummaries,
        setRoomSummary,
        updateRoomMessage,
        markRoomAsRead: markRoomAsReadStore,
        setSidePanelOpen,
        setSelectedRoomId,
        setActiveRightTab,
        shouldOpenPanel,
        targetRoomId,
        targetFriendInfo,
        clearOpenSignal
    } = useFriendChatStore();

    const socket = useSocket();
    const addFriend = useFriendListStore((s) => s.addFriend);
    const { notifications, removeNotification } = useContext(NotificationContext);
    const wordFilterEnabled = useNotificationStore(state => state.wordFilterEnabled);

    const [showPanel, setShowPanel] = useState(false);
    const [friendRequests, setFriendRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('friendlist');
    const [activeRightTab, setActiveRightTabLocal] = useState('chatlist');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [mobileTab, setMobileTab] = useState('chats'); // 'friends' | 'chats'
    const panelRef = useRef(null);

    // 🆕 React Query Hooks 추가
    const { data: friendRequestCount = 0 } = useFriendRequestCount(user?._id);
    const queryClient = useQueryClient();

    // 친구 요청 Mutation Hooks 추가
    const acceptMutation = useAcceptFriendRequest();
    const declineMutation = useDeclineFriendRequest();

    // 친구 요청 목록 조회 Hook (탭 활성화 시에만)
    const { data: friendRequestListData } = useFriendRequestList(
        user?._id,
        activeTab === 'requests'  // 탭이 'requests'일 때만 활성화
    );


    // 🆕 채팅방 목록 조회 (React Query로 자동 캐싱)
    const {
        data: chatRoomsData,
        isLoading: isChatRoomsLoading,
        error: chatRoomsError
    } = useChatRooms({
        userId: user?._id,
        roomType: 'friend',
        isActive: true,
    });

    // 알림 모달 상태 추가
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');


    // Debounce 함수 생성 (컴포넌트 최상단, hooks 다음)
    const debouncedMarkAsRead = useRef(
        debounce((roomId) => {
            if (socket && socket.connected) {
                socket.emit('markAsRead', { roomId }, (response) => {
                    if (response.success) {
                        console.log(`✅ [Debounce] 읽음 처리 완료`);
                    }
                });
            } else {
                markRoomAsRead(roomId).catch(console.error);
            }
        }, 1000)
    ).current;


    // ✅ 총 안읽은 메시지 개수 계산 (메모이제이션으로 성능 최적화)
    const totalUnreadCount = useMemo(() => {
        if (!roomSummaries || Object.keys(roomSummaries).length === 0) return 0;

        return Object.values(roomSummaries).reduce((total, summary) => {
            return total + (summary?.unreadCount || 0);
        }, 0);
    }, [roomSummaries]);

    // ✅ 전체 배지 개수 계산 (친구 요청 + 안읽은 메시지)
    const badgeCnt = useMemo(() => {
        return friendRequestCount + totalUnreadCount;  // state 직접 사용
    }, [friendRequestCount, totalUnreadCount]);

    // 날짜/시간 포맷팅 함수
    const formatDateTime = useCallback((timestamp) => {
        if (!timestamp) return '';
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return '';

            const today = new Date();

            if (date.toDateString() === today.toDateString()) {
                return date.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
            } else {
                return date.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }).replace(/\./g, '-').replace(/-$/, '');
            }
        } catch (error) {
            console.error('날짜 포맷팅 오류:', error);
            return '';
        }
    }, []);

    // 🆕 Socket Push: 안읽은 개수 업데이트 핸들러
    const handleUnreadCountUpdate = useCallback((data) => {
        const { roomId, reset, unreadCount, increment  } = data;

        console.log('📬 [Socket] 안읽은 개수 업데이트:', data);

        // ✅ Zustand getState()로 현재 상태를 직접 읽기
        const { roomSummaries, selectedRoomId } = useFriendChatStore.getState();
        const existing = roomSummaries[roomId];

        // 채팅방 정보가 없으면 무시
        if (!existing) {
            console.warn('⚠️ [Socket] 알 수 없는 채팅방:', roomId);
            return;
        }

        // 현재 보고 있는 채팅방이면 increment 무시 (깜빡임 방지)
        if (increment && roomId === selectedRoomId) {
            return;
        }

        let newUnreadCount = existing.unreadCount;

        // reset: 읽음 처리로 0으로 리셋
        if (reset) {
            console.log(`✅ [Socket] ${roomId} 읽음 처리 (0으로 리셋)`);
            newUnreadCount = 0;
        }
        // increment: 개수 증가 (메시지 수신 시)
        else if (increment) {
            newUnreadCount = (existing.unreadCount || 0) + increment;
            console.log(`✅ [Socket] ${roomId} 개수 증가: ${existing.unreadCount} → ${newUnreadCount}`);
        }
        // unreadCount: 직접 값 설정 (주로 재연결 시)
        else if (typeof unreadCount === 'number') {
            console.log(`✅ [Socket] ${roomId} 개수 설정: ${unreadCount}`);
            newUnreadCount = unreadCount;
        }

        // ✅ 올바른 시그니처: setRoomSummary(roomId, summary)
        setRoomSummary(roomId, {
            ...existing,
            unreadCount: newUnreadCount
        });
    }, [setRoomSummary]);

    // // 개별 채팅방 요약 정보 업데이트 함수
    // const updateRoomSummary = useCallback(async (roomId) => {
    //     if (!user?._id || !roomId) return;
    //
    //     try {
    //         const data = await fetchMessages(roomId, 1, 1);
    //         const messages = data.messages;
    //
    //         if (messages && messages.length > 0) {
    //             const lastMessage = messages[0];
    //
    //             // ✅ setRoomSummary를 함수형 업데이트로 변경
    //             setRoomSummary(prev => {
    //                 // 기존 상태에서 현재 방의 정보 가져오기
    //                 const existing = prev[roomId] || { unreadCount: 0 };
    //
    //                 return {
    //                     ...prev,
    //                     [roomId]: {
    //                         lastMessage: lastMessage?.text || '',
    //                         lastMessageTime: lastMessage?.textTime || lastMessage?.timestamp || null,
    //                         unreadCount: existing.unreadCount  // ✅ 기존 값 유지
    //                     }
    //                 };
    //             });
    //         }
    //         // 아래 코드를 위 코드로 바꿈
    //         // const { unreadCount } = await getUnreadCount(roomId, user._id);
    //         //
    //         // if (messages && messages.length > 0) {
    //         //     const lastMessage = messages[0];
    //         //
    //         //     const summary = {
    //         //         lastMessage: lastMessage?.text || '',
    //         //         lastMessageTime: lastMessage?.textTime || lastMessage?.timestamp || null,
    //         //         unreadCount: unreadCount || 0
    //         //     };
    //         //
    //         //     setRoomSummary(roomId, summary);
    //         // }
    //     } catch (error) {
    //         console.error(`채팅방 ${roomId} 요약 정보 업데이트 실패:`, error);
    //     }
    // }, [user?._id, setRoomSummary]);


    const loadRoomSummaries = useCallback(async () => {
        if (!friendRooms || friendRooms.length === 0 || !user?._id) return;

        try {
            // 🆕 1. 채팅방 ID 배열 생성
            const roomIds = friendRooms
                .filter(room => room && room.roomId)
                .map(room => room.roomId);

            if (roomIds.length === 0) return;

            console.log(`📦 [loadRoomSummaries] ${roomIds.length}개 채팅방 조회 시작`);

            // 🆕 2. 배치 API로 마지막 메시지 한 번에 조회 (N+1 해결!)
            // 🆕 3. 안읽은 메시지 개수 병렬 조회 -> api 새로 만듬 N+1쿼리 해결
            // ⚡ 병렬 실행 (20ms) - 50% 빠름!
            const [{ messages }, unreadCounts] = await Promise.all([
                fetchLastMessagesBatch(roomIds),
                getUnreadCountsBatch(roomIds)
            ]);

            // 🆕 4. 결과 매핑
            const summaries = {};

            roomIds.forEach((roomId) => {
                // 해당 채팅방의 마지막 메시지 찾기
                const messageData = messages.find(m => m.roomId === roomId);
                const unreadCount = unreadCounts[roomId] || 0;

                if (messageData && messageData.lastMessage) {
                    summaries[roomId] = {
                        lastMessage: messageData.lastMessage.text || '',
                        lastMessageTime: messageData.lastMessage.createdAt || null,
                        unreadCount: unreadCount
                    };
                } else {
                    // 메시지가 없는 경우
                    summaries[roomId] = {
                        lastMessage: '메시지가 없습니다.',
                        lastMessageTime: null,
                        unreadCount: unreadCount
                    };
                }
            });

            setRoomSummaries(summaries);
            console.log(`✅ [loadRoomSummaries] 완료: ${Object.keys(summaries).length}개 방`);

        } catch (error) {
            console.error('❌ [loadRoomSummaries] 실패:', error);

            // 에러 발생 시 기본값 설정 (UI 깨짐 방지)
            const fallbackSummaries = {};
            friendRooms.forEach(room => {
                if (room && room.roomId) {
                    fallbackSummaries[room.roomId] = {
                        lastMessage: '정보 로드 실패',
                        lastMessageTime: null,
                        unreadCount: 0
                    };
                }
            });
            setRoomSummaries(fallbackSummaries);
        }
    }, [friendRooms, user?._id, setRoomSummaries]);



    // 전체 채팅방 요약 정보 로드
    // const loadRoomSummaries = useCallback(async () => {
    //     if (!friendRooms || friendRooms.length === 0 || !user?._id) return;
    //
    //     const summaries = {};
    //
    //     for (const room of friendRooms) {
    //         if (!room || !room.roomId) continue;
    //
    //         try {
    //             const data = await fetchMessages(room.roomId, 1, 1);
    //             const messages = data.messages;
    //             const { unreadCount } = await getUnreadCount(room.roomId, user._id);
    //
    //             if (messages && messages.length > 0) {
    //                 const lastMessage = messages[0];
    //
    //                 summaries[room.roomId] = {
    //                     lastMessage: lastMessage?.text || '',
    //                     lastMessageTime: lastMessage?.textTime || lastMessage?.timestamp || null,
    //                     unreadCount: unreadCount || 0
    //                 };
    //             } else {
    //                 summaries[room.roomId] = {
    //                     lastMessage: '메시지가 없습니다.',
    //                     lastMessageTime: null,
    //                     unreadCount: unreadCount || 0
    //                 };
    //             }
    //         } catch (error) {
    //             console.error(`채팅방 ${room.roomId} 요약 정보 로드 실패:`, error);
    //             summaries[room.roomId] = {
    //                 lastMessage: '정보 로드 실패',
    //                 lastMessageTime: null,
    //                 unreadCount: 0
    //             };
    //         }
    //     }
    //
    //     setRoomSummaries(summaries);
    // }, [friendRooms, user?._id, setRoomSummaries]);

    // // 채팅방 로드
    // const loadRooms = useCallback(async () => {
    //     if (!user?._id) return;
    //     try {
    //         const rooms = await fetchChatRooms({ roomType: 'friend', isActive: true  });
    //         if (!rooms || !Array.isArray(rooms)) return;
    //
    //         const myRooms = rooms.filter((r) =>
    //             r?.chatUsers &&
    //             Array.isArray(r.chatUsers) &&
    //             r.chatUsers.some((u) => u?._id === user._id)
    //         );
    //
    //         const mapped = myRooms
    //             .filter((r) => r?.isActive)
    //             .map((r) => ({
    //                 roomId: r._id,
    //                 friend: r.chatUsers?.find((u) => u?._id !== user._id),
    //             }))
    //             .filter(room => room && room.friend && room.roomId);
    //
    //         setFriendRooms(mapped);
    //     } catch (e) {
    //         console.error('친구 채팅방 조회 실패', e);
    //     }
    // }, [user?._id, setFriendRooms]);

    // 채팅방 로드 대체
    // 🆕 React Query 데이터를 Zustand Store에 동기화
    useEffect(() => {
        // 데이터가 없거나 로딩 중이면 무시
        if (!chatRoomsData || !user?._id) return;

        try {

            const roomsArray = chatRoomsData.rooms || [];
            // 1. 내가 참여한 채팅방만 필터링
            const myRooms = roomsArray.filter((r) =>
                r?.chatUsers &&
                Array.isArray(r.chatUsers) &&
                r.chatUsers.some((u) => u?._id === user._id)
            );

            // 2. 친구 정보 매핑
            const mapped = myRooms
                .filter((r) => r?.isActive)
                .map((r) => ({
                    roomId: r._id,
                    friend: r.chatUsers?.find((u) => u?._id !== user._id),
                }))
                .filter(room => room && room.friend && room.roomId)
                // 🆕 3. 친구인 사람만 필터링 (친구 삭제 시 목록에서 제외)
                .filter(room => {
                    const friendId = room.friend?._id;
                    if (!friendId || !user?.friends) return false;

                    // user.friends 배열에 해당 친구가 있는지 확인
                    return user.friends.some(fid =>
                        fid?.toString() === friendId?.toString() || fid === friendId
                    );
                });

            // 4. Zustand Store에 저장
            setFriendRooms(mapped);

            console.log(`✅ [React Query] ${mapped.length}개 채팅방 로드 완료 (친구만 필터링)`);
        } catch (e) {
            console.error('❌ [React Query] 채팅방 처리 실패:', e);
        }
    }, [chatRoomsData, user?._id, user?.friends, setFriendRooms]);


    // 친구 요청 로드
    const loadFriendReqFromServer = useCallback(async () => {
        if (!user?._id) return;


        try {
            console.log('📋 [전체 목록] 친구 요청 전체 목록 조회');
            const list = friendRequestListData;

            if (!list || !Array.isArray(list)) {
                // ⚠️ 서버에서 빈 목록이 왔어도 소켓 알림은 유지
                console.log('⚠️ [서버 목록] 비어있음 - 소켓 알림 유지');
                return;  // ✅ 빈 배열로 덮어쓰지 않음!
            }

            // ✅ 1. notifications에서 친구 요청 추출
            const notificationRequests = notifications
                .filter((n) => n?.type === 'FRIEND_REQUEST' && n?.requestId)
                .map((n) => ({
                    _id: n.requestId,
                    sender: {
                        _id: n.senderId || n.sender?._id,
                        nickname: n.senderNickname || n.sender?.nickname || '알 수 없음',
                    },
                }))
                .filter(req => req?._id && req?.sender?._id);

            // ✅ 2. 서버 목록과 알림 목록 병합 (중복 제거)
            const existingIds = new Set(list.map(r => r._id.toString()));
            const mergedList = [...list];

            notificationRequests.forEach((notifReq) => {
                if (!existingIds.has(notifReq._id.toString())) {
                    mergedList.unshift(notifReq);  // 알림은 맨 위에 추가
                    console.log('🆕 [병합] 소켓 알림 추가:', notifReq.sender.nickname);
                }
            });

            setFriendRequests(mergedList);
            console.log(`✅ [전체 목록] 서버: ${list.length}개, 알림: ${notificationRequests.length}개, 총: ${mergedList.length}개`);

            // ✅ 3. 서버에 있는 요청은 알림에서 제거
            list.forEach((r) => {
                if (!r?._id) return;
                const idx = notifications.findIndex(
                    (n) => n?.type === 'FRIEND_REQUEST' && n?.requestId === r._id
                );
                if (idx !== -1) removeNotification(idx);
            });
        } catch (e) {
            console.error('❌ [전체 목록] 조회 실패:', e);
            // ⚠️ 에러 발생 시에도 덮어쓰지 않음
        }
    }, [user?._id, friendRequestListData, notifications, removeNotification]);

    // ✅ handleSelectChat을 useEffect들보다 먼저 정의 (호이스팅 문제 해결)
    const handleSelectChat = useCallback(async (room) => {
        if (!room || !room.roomId || !user?._id) return;

        setSelectedRoom(room);
        setActiveRightTabLocal('chat');

        try {
            if (socket && socket.connected) {
                socket.emit('enterRoom', { roomId: room.roomId }, (response) => {
                    if (response && response.success) {
                        console.log(`✅ [Socket] 입장 완료`);
                        markRoomAsReadStore(room.roomId);
                    } else {
                        console.error('❌ [Socket] 입장 실패:', response?.error || '알 수 없는 오류');
                        markRoomAsRead(room.roomId)
                            .then(() => {
                                console.log('✅ [Fallback] 읽음 처리 성공');
                                markRoomAsReadStore(room.roomId);
                            })
                            .catch((error) => {
                                console.error('❌ [Fallback] HTTP 실패:', error);
                            });
                    }
                });
            } else {
                console.warn('⚠️ [Fallback] Socket 없음 - HTTP 사용');
                await markRoomAsRead(room.roomId);
                console.log('✅ [HTTP] 읽음 처리 완료');
                markRoomAsReadStore(room.roomId);
            }
        } catch (error) {
            console.error('채팅방 입장 처리 실패:', error);
        }
    }, [user?._id, socket, markRoomAsReadStore]);

    //  cleanup 추가
    useEffect(() => {
        return () => {
            debouncedMarkAsRead.cancel();
        };
    }, []);

    // 친구 삭제 이벤트 처리 (통합 - 기존 2개 useEffect를 1개로 병합)
    useEffect(() => {
        if (!socket) return;

        const handleFriendDeleted = ({ friendId }) => {
            const { user, setUser } = useAuthStore.getState();
            const { removeFriend } = useFriendListStore.getState();
            const { friendRooms, removeFriendRoom, selectedRoomId, setSelectedRoomId } = useFriendChatStore.getState();

            // 1. 친구 목록에서 제거
            removeFriend(friendId);

            // 2. authStore user.friends에서 제거
            if (user && user.friends) {
                setUser({
                    ...user,
                    friends: user.friends.filter(id => id !== friendId)
                });
            }

            // 3. store에서 해당 친구의 채팅방 조회 후 제거
            //    (서버는 roomId를 보내지 않으므로 store에서 직접 조회)
            const targetRoom = friendRooms.find(r => r.friend?._id === friendId);
            if (targetRoom) {
                removeFriendRoom(targetRoom.roomId);
                if (selectedRoomId === targetRoom.roomId) {
                    setSelectedRoomId(null);
                }
            }

            // 4. 채팅방 목록 캐시 무효화
            queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
        };

        socket.on('friendDeleted', handleFriendDeleted);

        return () => {
            socket.off('friendDeleted', handleFriendDeleted);
        };
    }, [socket, queryClient]);

    // 실시간 메시지 수신 처리
    useEffect(() => {
        if (!socket || !user?._id || !friendRooms) return;

        const handleReceiveMessage = (message) => {
            if (!message || !message.chatRoom) return;

            const isFromFriendRoom = friendRooms.some(room =>
                room && room.roomId === message.chatRoom
            );

            if (!isFromFriendRoom) return;

            const senderId = message.sender?._id || message.sender?.id;
            const isFromOther = senderId !== user._id;
            const isCurrentRoom = selectedRoom?.roomId === message.chatRoom &&
                activeRightTab === 'chat';

            // ✅ 현재 채팅방이면 읽음 처리만
            if (isCurrentRoom && isFromOther) {
                debouncedMarkAsRead(message.chatRoom);
                markRoomAsReadStore(message.chatRoom);
            }

            // ✅ 메시지 내용만 업데이트 (Socket이 개수 관리)
            updateRoomMessage(message.chatRoom, {
                text: message.text || '',
                timestamp: message.createdAt || Date.now(),
                isFromOther: isCurrentRoom ? false : isFromOther
            });
        };

        socket.on("receiveMessage", handleReceiveMessage);

        return () => {
            socket.off("receiveMessage", handleReceiveMessage);
        };
    }, [socket, user?._id, friendRooms, updateRoomMessage, selectedRoom, activeRightTab, debouncedMarkAsRead, markRoomAsReadStore]);

    const { selectedRoomId: storeSelectedRoomId } = useFriendChatStore();
    useEffect(() => {
        if (storeSelectedRoomId === null) {
            setSelectedRoom(null);
        }
    }, [storeSelectedRoomId]);


    // 외부 신호로 패널 열기
    useEffect(() => {
        if (shouldOpenPanel && targetRoomId && user?._id) {
            setShowPanel(true);
            setMobileTab('chats'); // ✅ 모바일 탭 채팅으로 전환
            const targetRoom = friendRooms?.find(room =>
                room && room.roomId === targetRoomId
            );

            if (targetRoom) {
                handleSelectChat(targetRoom);
            } else if (targetFriendInfo) {
                const newRoom = { roomId: targetRoomId, friend: targetFriendInfo };
                setSelectedRoom(newRoom);
                setActiveRightTabLocal('chat');

                if (socket && socket.connected) {
                    socket.emit('enterRoom', { roomId: targetRoomId }, (response) => {
                        if (response && response.success) {
                            console.log(`✅ [외부신호-Socket] 읽음 처리 완료`);
                            markRoomAsReadStore(targetRoomId);
                        } else {
                            console.error('❌ [외부신호-Socket] 실패:', response?.error || '알 수 없는 오류');
                            markRoomAsRead(targetRoomId)
                                .then(() => {
                                    console.log('✅ [외부신호-Fallback] 성공');
                                    markRoomAsReadStore(targetRoomId);
                                })
                                .catch((error) => {
                                    console.error('❌ [외부신호-Fallback] 실패:', error);
                                });
                        }
                    });
                } else {
                    markRoomAsRead(targetRoomId)
                        .then(() => {
                            console.log('✅ [외부신호-HTTP] 완료');
                            markRoomAsReadStore(targetRoomId);
                        })
                        .catch(console.error);
                }
            }
            clearOpenSignal();
        }
    }, [shouldOpenPanel, targetRoomId, targetFriendInfo, friendRooms, clearOpenSignal, user?._id, socket, markRoomAsReadStore, handleSelectChat]);

    // 스토어 상태 동기화
    useEffect(() => setSidePanelOpen(showPanel), [showPanel, setSidePanelOpen]);
    useEffect(() => setActiveRightTab(activeRightTab), [activeRightTab, setActiveRightTab]);
    useEffect(() => setSelectedRoomId(selectedRoom?.roomId || null), [selectedRoom, setSelectedRoomId]);

    // 외부 클릭 시 패널 닫기
    useEffect(() => {
        if (!showPanel) return;
        const handlePointerDown = (e) => {
            const clickedInsidePanel = panelRef.current?.contains(e.target);
            const modalRoot = document.getElementById('modal-root');
            const clickedInsideModal = modalRoot?.contains(e.target);

            if (!clickedInsidePanel && !clickedInsideModal) {
                handleClosePanel();
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [showPanel]);

    // user 로그인 시 친구 채팅방 목록 자동 로드
    // user가 로그인되면 자동으로 친구 채팅방 데이터를 가져옴
    // user 변경 시 채팅방 목록 재로드
    // useEffect(() => {
    //     if (user?._id) {
    //         loadRooms();
    //     }
    // }, [user?._id, loadRooms]);


    // 친구요청 탭 클릭 시에만 전체 목록 로드 (지연 로딩)
    // 사용자가 탭을 클릭하기 전까지는 상세 정보를 불러오지 않음
    // 불필요한 API 호출 방지 → 성능 최적화
    useEffect(() => {
        if (user?._id && activeTab === 'requests') {
            loadFriendReqFromServer();
        }
    }, [user?._id, activeTab, friendRequestListData, loadFriendReqFromServer]);

    // 채팅방 목록이 준비되면 각 방의 요약 정보 로드
    // 마지막 메시지, 안읽은 개수 등을 배치로 조회
    // friendRooms가 로드된 후에 실행되도록 의존성 체인 형성
    useEffect(() => {
        if (user?._id) {
            loadRoomSummaries();
        }
    }, [user?._id, loadRoomSummaries]);

    // 친구 요청 알림 처리
    useEffect(() => {
        if (!notifications || !Array.isArray(notifications)) return;

        const incoming = notifications
            .filter((n) => n?.type === 'FRIEND_REQUEST' && n?.requestId)
            .map((n, idx) => ({
                _id: n.requestId,
                sender: {
                    _id: n.senderId || n.sender?._id,
                    nickname: n.senderNickname || n.sender?.nickname || '알 수 없음',
                },
                _notiIdx: idx,
            }))
            .filter(req => req?._id && req?.sender?._id);

        if (incoming.length > 0) {
            queryClient.setQueryData(['friendRequestCount', user._id], (old = 0) => old + incoming.length);
            setFriendRequests((prev) => {
                const ids = new Set((prev || []).map((r) => r?._id).filter(Boolean));
                const merged = [...(prev || [])];
                incoming.forEach((r) => {
                    if (r?._id && !ids.has(r._id)) merged.unshift(r);
                });
                return merged;
            });
        }
    }, [notifications]);

    // 🆕 Socket Push: 안읽은 개수 업데이트 리스너
    useEffect(() => {
        if (!socket || !user?._id) return;

        console.log('🔌 [Socket] unreadCountUpdated 리스너 등록');
        socket.on('unreadCountUpdated', handleUnreadCountUpdate);

        return () => {
            console.log('🔌 [Socket] unreadCountUpdated 리스너 해제');
            socket.off('unreadCountUpdated', handleUnreadCountUpdate);
        };
    }, [socket, user?._id, handleUnreadCountUpdate]);

    // 🆕 Socket Push: 재연결 시 배지 재동기화
    useEffect(() => {
        if (!socket) return;

        const handleReconnect = () => {
            console.log('🔄 [Socket] 재연결됨 - 배지 재동기화 시작');

            // 1. 채팅방 요약 정보 재로드
            loadRoomSummaries();

            // 2. 친구 요청 개수 캐시 무효화 (React Query가 자동으로 다시 fetch)
            if (user?._id) {
                queryClient.invalidateQueries({
                    queryKey: ['friendRequestCount', user._id]
                });
            }

            // 3. 채팅방 목록 캐시 무효화 (재연결 시 최신 상태 동기화)
            queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
        };

        socket.on('connect', handleReconnect);

        return () => {
            socket.off('connect', handleReconnect);
        };
    }, [socket, loadRoomSummaries, queryClient, user?._id]);

    // ✅ 조건부 렌더링을 모든 hooks 호출 후에 수행
    if (!user || !user._id) {
        return (
            <div className="relative">
                <button className="relative p-2 text-gray-400 cursor-not-allowed rounded-lg">
                    <UserGroupIcon className="w-6 h-6" />
                </button>
            </div>
        );
    }

    // 나머지 이벤트 핸들러들
    const afterHandled = (reqId, notiIdx) => {
        if (!reqId) return;
        setFriendRequests((prev) => prev.filter((r) => r?._id !== reqId));
        if (typeof notiIdx === 'number') removeNotification(notiIdx);
    };

    const handleAccept = async (reqId, notiIdx) => {
        console.log('🎯 [친구수락] 시작:', { reqId, notiIdx, userId: user?._id });

        if (!user?._id || !reqId) {
            console.error('❌ [친구수락] 필수 정보 없음');
            return;
        }

        // ✅ 1. 롤백용 데이터 저장
        const targetRequest = friendRequests.find(r => r._id === reqId);

        try {
            // 1) 백엔드 API 호출
            console.log('📡 [친구수락] acceptFriendRequest 호출...');
            // ✅ 2. Mutation Hook 사용 (낙관적 업데이트 자동 처리!)
            const result = await acceptMutation.mutateAsync({
                userId: user._id,
                requestId: reqId
            });

            // ✅ 응답 데이터 검증 강화
            if (!result) {
                throw new Error('응답 데이터가 없습니다.');
            }
            console.log('✅ [친구수락] 백엔드 수락 완료');

            // 2) UI 업데이트
            afterHandled(reqId, notiIdx);
            console.log('✅ [친구수락] UI 요청 제거 완료');


            console.log('✅ [친구수락] UI 요청 제거 완료');

            // 3) 친구 정보 가져오기
            const accepted = targetRequest
            console.log('🔍 [친구수락] 수락한 요청:', accepted);

            if (!accepted?.sender?._id) {
                throw new Error('친구 요청을 찾을 수 없습니다.');
            }

            console.log('📡 [친구수락] 친구 정보 조회 시작:', accepted.sender._id);
            const friendInfo = await getUserFriendProfile(accepted.sender._id);

            // ✅ 친구 정보 검증
            if (!friendInfo?._id || !friendInfo?.nickname) {
                throw new Error('친구 정보가 올바르지 않습니다.');
            }
            console.log('✅ [친구수락] 친구 정보 조회 완료:', friendInfo);

            // 4) 전역 상태 업데이트
            console.log('📝 [친구수락] 전역 상태 업데이트 시작');
            addFriend(friendInfo);
            console.log('✅ [친구수락] addFriend 완료');

            setAuthUser((prevUser) => {
                const updated = {
                    ...prevUser,
                    friends: [...(prevUser?.friends || []), friendInfo._id],
                };
                console.log('✅ [친구수락] setAuthUser 완료:', updated.friends.length, '명');
                return updated;
            });

            console.log(`🎉 [친구수락 성공] ${friendInfo.nickname}님과 친구가 되었습니다.`);

        } catch (e) {
            console.error('❌ [친구수락 실패]', e);
            console.error('❌ [친구수락] 에러 상세:', e.message);

            // ✅ Mutation Hook이 자동으로 롤백하지만, local state도 복원
            if (targetRequest) {
                setFriendRequests(prev => [targetRequest, ...prev]);
            }

            // ✅ 에러 종류별 처리
            let userMessage = '친구 요청 수락 중 오류가 발생했습니다.';

            if (e.message?.includes('찾을 수 없습니다')) {
                userMessage = '친구 요청을 찾을 수 없습니다. 이미 처리되었거나 취소되었을 수 있습니다.';
            } else if (e.message?.includes('이미 처리된')) {
                userMessage = '이미 처리된 친구 요청입니다.';
            } else if (e.message?.includes('네트워크') || e.code === 'ERR_NETWORK') {
                userMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
            } else if (e.message?.includes('응답 데이터가 없습니다')) {
                userMessage = '서버 응답이 올바르지 않습니다. 잠시 후 다시 시도해주세요.';
            } else if (e.message?.includes('친구 정보가 올바르지 않습니다')) {
                userMessage = '친구 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.';
            }

            setAlertMessage(userMessage);
            setIsAlertOpen(true);
        }
    };

    const handleDecline = async (reqId, notiIdx) => {
        if (!user?._id || !reqId) return;

        // ✅ 1. 롤백용 데이터 저장
        const targetRequest = friendRequests.find(r => r._id === reqId);

        // ✅ 2. 즉시 UI 업데이트 (낙관적)
        afterHandled(reqId, notiIdx);


        try {
            // ✅ 3. Mutation Hook 사용 (낙관적 업데이트 자동 처리!)
            await declineMutation.mutateAsync({
                userId: user._id,
                requestId: reqId
            });
        } catch (e) {
            console.error('❌ 친구 요청 거절 실패', e);

            // ✅ 4. 실패 시 UI 롤백
            if (targetRequest) {
                setFriendRequests(prev => [targetRequest, ...prev]);
                queryClient.setQueryData(['friendRequestCount', user._id], (old = 0) => old + 1);
            }

            // ✅ 5. 사용자 피드백
            setAlertMessage('친구 요청 거절에 실패했습니다. 네트워크를 확인하고 다시 시도해주세요.');
            setIsAlertOpen(true);
        }
    };



    const handleClosePanel = () => {
        setShowPanel(false);
        setSelectedRoom(null);
        setActiveRightTabLocal('chatlist');
    };




    return (
        <>
            {/* 패널 열기 버튼 */}
            <div className="relative">
                <button
                    onClick={() => setShowPanel(!showPanel)}
                    className="relative p-2 text-white hover:text-gray-400 rounded-lg transition-colors"
                >
                    <UserGroupIcon className="w-6 h-6" />
                    {/* ✅ 전체 배지 개수 표시 (친구 요청 + 안읽은 메시지) */}
                    {badgeCnt > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {badgeCnt > 9 ? '9+' : badgeCnt}
                        </span>
                    )}
                </button>
            </div>

            {/* 사이드패널 */}
            {showPanel && (
                <div
                    ref={panelRef}
                    className={`fixed right-0 top-0 h-full bg-white shadow-2xl z-50 flex flex-col md:flex-row transition-all duration-300 ${
                        selectedRoom ? 'w-full md:w-[65vw]' : 'w-full md:w-[40vw]'
                    }`}
                >
                    {/* 모바일 상단 탭 (모바일에서만 표시) */}
                    <div className="md:hidden flex border-b bg-gray-50">
                        <button
                            onClick={() => setMobileTab('friends')}
                            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                                mobileTab === 'friends' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                            }`}
                        >
                            <UserGroupIcon className="w-5 h-5" />
                            친구
                            {friendRequestCount > 0 && (
                                <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                    {friendRequestCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setMobileTab('chats')}
                            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                                mobileTab === 'chats' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                            }`}
                        >
                            <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
                            채팅
                            {totalUnreadCount > 0 && (
                                <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                    {totalUnreadCount}
                                </span>
                            )}
                        </button>
                        <button onClick={handleClosePanel} className="px-4 text-gray-400">
                            <XMarkOutlineIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* 왼쪽: 친구목록/친구요청 */}
                    <div className={`${mobileTab === 'friends' ? 'flex' : 'hidden'} md:flex border-r border-gray-200 flex-col transition-all duration-300 h-full w-full ${
                        selectedRoom ? 'md:w-1/4' : 'md:w-2/5'
                    }`}>
                        <div className="p-4 border-b bg-gray-50 flex items-center justify-between hidden md:flex">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActiveTab('friendlist')}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        activeTab === 'friendlist'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <UserGroupIcon className="w-4 h-4"/>
                                    친구목록
                                </button>
                                <button
                                    onClick={() => setActiveTab('requests')}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                                        activeTab === 'requests'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <UserPlusIcon className="w-4 h-4" />
                                    친구요청
                                    {/* ✅ 친구 요청만의 배지 (내부 탭용) */}
                                    {friendRequestCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                            {friendRequestCount > 9 ? '9+' : friendRequestCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                            <button
                                onClick={handleClosePanel}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-lg"
                            >
                                <XMarkOutlineIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* 모바일용 친구/요청 서브탭 (친구 탭일 때만 표시) */}
                        <div className="md:hidden flex p-2 bg-gray-100 gap-2">
                            <button
                                onClick={() => setActiveTab('friendlist')}
                                className={`flex-1 py-1 text-xs rounded ${activeTab === 'friendlist' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                            >
                                목록
                            </button>
                            <button
                                onClick={() => setActiveTab('requests')}
                                className={`flex-1 py-1 text-xs rounded ${activeTab === 'requests' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                            >
                                요청 {friendRequestCount > 0 && `(${friendRequestCount})`}
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            {activeTab === 'friendlist' && (
                                <div className="h-full">
                                    <FriendListPanel />
                                </div>
                            )}

                            {activeTab === 'requests' && (
                                <div className="p-4 space-y-3 h-full overflow-y-auto">
                                    {friendRequests.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            <UserPlusIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                            <p className="text-lg font-medium mb-2">새로운 친구 요청이 없습니다</p>
                                            <p className="text-sm">친구 요청이 오면 여기에 표시됩니다</p>
                                        </div>
                                    ) : (
                                        friendRequests.map((req) => {
                                            if (!req || !req._id) return null;

                                            return (
                                                <div
                                                    key={req._id}
                                                    className="bg-gray-50 rounded-lg border p-4"
                                                >
                                                    {/* 상단: 프로필 정보 */}
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <ProfileButton
                                                            profile={req.sender}
                                                            size="sm"
                                                            area='친구요청'
                                                            requestId={req._id}
                                                            onAccept={() => handleAccept(req._id, req._notiIdx)}
                                                            onDecline={() => handleDecline(req._id, req._notiIdx)}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-gray-900 truncate">
                                                                {req.sender?.nickname || '알 수 없음'}
                                                            </p>
                                                            <p className="text-sm text-gray-500">친구 요청을 보냈습니다</p>
                                                        </div>
                                                    </div>

                                                    {/* 하단: 버튼 영역 */}
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => handleAccept(req._id, req._notiIdx)}
                                                            className="px-4 py-2 text-sm bg-green-500 text-white hover:bg-green-600 rounded-md transition-colors flex items-center gap-1 font-medium"
                                                        >
                                                            <CheckIcon className="w-4 h-4" />
                                                            수락
                                                        </button>
                                                        <button
                                                            onClick={() => handleDecline(req._id, req._notiIdx)}
                                                            className="px-4 py-2 text-sm bg-red-500 text-white hover:bg-red-600 rounded-md transition-colors flex items-center gap-1 font-medium"
                                                        >
                                                            <XMarkIcon className="w-4 h-4" />
                                                            거절
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 오른쪽: 채팅 영역 */}
                    <div className={`${(mobileTab === 'chats' || (selectedRoom && mobileTab === 'chats')) ? 'flex' : 'hidden'} md:flex transition-all duration-300 h-full w-full ${
                        selectedRoom ? 'md:w-3/4' : 'md:w-3/5'
                    }`}>
                        {/* 왼쪽: 채팅목록 영역 (모바일에서는 채팅방 선택되면 숨김) */}
                        <div className={`${selectedRoom ? 'hidden md:flex md:w-2/5' : 'w-full'} ${selectedRoom ? 'md:border-r border-gray-200' : ''} flex flex-col transition-all duration-300`}>
                            <div className="p-4 border-b bg-gray-50 flex items-center justify-between hidden md:flex">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <ChatBubbleLeftEllipsisIcon className="w-5 h-5"/>
                                    채팅
                                </h3>
                                {/* ✅ 채팅 섹션에 안읽은 메시지 개수 표시 */}
                                {totalUnreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {totalUnreadCount}개의 안읽은 메시지
                        </span>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {!friendRooms || friendRooms.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <ChatBubbleLeftEllipsisIcon className="w-16 h-16 mx-auto mb-4 text-gray-300"/>
                                        <p className="text-lg font-medium mb-2">활성화된 채팅방이 없습니다</p>
                                        <p className="text-sm">친구와 채팅을 시작해보세요</p>
                                    </div>
                                ) : (
                                    friendRooms.map((room) => {
                                        if (!room || !room.roomId || !room.friend) return null;

                                        const summary = roomSummaries?.[room.roomId] || {};
                                        const isSelected = selectedRoom?.roomId === room.roomId;

                                        return (
                                            <div
                                                key={room.roomId}
                                                onClick={() => handleSelectChat(room)}
                                                className={`w-full flex items-start gap-3 p-4 border rounded-lg hover:shadow-sm transition-all cursor-pointer relative
                                        ${isSelected
                                                    ? 'bg-blue-50 border-blue-300 shadow-sm'
                                                    : 'bg-white hover:border-blue-300'
                                                }`}
                                            >
                                                <div className="relative">
                                                    <ProfileButton profile={room.friend} size="md" modalDisabled={true}/>
                                                    {(summary.unreadCount || 0) > 0 && (
                                                        <span
                                                            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                {summary.unreadCount > 9 ? '9+' : summary.unreadCount}
                                            </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="font-medium text-gray-900 truncate">
                                                            {room.friend?.nickname || '알 수 없음'}
                                                        </p>
                                                        {summary.lastMessageTime && (
                                                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                                    {formatDateTime(summary.lastMessageTime)}
                                                </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 truncate">
                                                        {summary.lastMessage ? (wordFilterEnabled ? filterProfanity(summary.lastMessage) : summary.lastMessage) : '채팅을 시작해보세요'}
                                                    </p>
                                                </div>
                                                <ChatBubbleLeftEllipsisIcon
                                                    className="w-5 h-5 text-gray-400 flex-shrink-0"/>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* 오른쪽: 채팅창 영역 */}
                        {selectedRoom && (
                            <div className="w-full md:w-3/5 flex flex-col h-full absolute md:relative top-0 left-0 bg-white z-50 md:z-auto">
                                <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setSelectedRoom(null)}
                                            className="p-2 text-gray-600 hover:text-gray-900 transition-colors hover:bg-gray-100 rounded-lg md:hidden"
                                        >
                                            <ArrowLeftIcon className="w-5 h-5"/>
                                        </button>
                                        <ProfileButton profile={selectedRoom.friend} size="sm" modalDisabled={true}/>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {selectedRoom.friend?.nickname || '채팅'}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedRoom(null);
                                        }}
                                        className="p-2 text-gray-600 hover:text-gray-900 transition-colors hover:bg-gray-100 rounded-lg"
                                        title="채팅창 닫기"
                                    >
                                        <XMarkIcon className="w-5 h-5"/>
                                    </button>
                                </div>

                                <div className="flex-1 overflow-hidden">
                                    <ChatOverlay
                                        roomId={selectedRoom.roomId}
                                        friend={selectedRoom.friend}
                                        isSidePanel={true}
                                        // onMessageSent={handleMessageSent}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <CommonModal
                isOpen={isAlertOpen}
                onClose={() => setIsAlertOpen(false)}
                title="알림"
                onConfirm={() => setIsAlertOpen(false)}
                showCancel={false}
            >
                {alertMessage}
            </CommonModal>
        </>
    );
};

export default FriendChatSidePanel;
