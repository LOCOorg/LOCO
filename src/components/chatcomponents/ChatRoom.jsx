import {useEffect, useState, useRef, useMemo, useCallback} from "react";
import {useSocket} from "../../hooks/useSocket.js";
import { leaveChatRoom, getNewMessages} from "../../api/chatAPI.js";
import { useChatMessages, useDeleteMessage } from "../../hooks/queries/useChatQueries.js";
import { useUserMinimal } from '../../hooks/queries/useUserQueries';
import { useQueryClient } from '@tanstack/react-query';
import PropTypes from "prop-types";
import {useNavigate} from "react-router-dom";
import {decrementChatCount,  rateUser} from "../../api/userAPI.js";
import { getLeagueRecord } from "../../api/riotAPI.js";  // 라이엇 전적 API (DB 캐싱)
import { getUserBasic , getUserRiotInfo  } from "../../api/userLightAPI.js";  // 경량 API
import CommonModal from "../../common/CommonModal.jsx";
import ProfileButton from "../../components/MyPageComponent/ProfileButton.jsx";
import LeagueRecordSection from "./LeagueRecordSection.jsx";
import useNotificationStore from '../../stores/notificationStore.js';
import { filterProfanity } from "../../utils/profanityFilter.js";
import MessageReportModal from "./MessageReportModal.jsx";
import { retryWithBackoff } from "../../utils/retryUtils.js";  // 🔄 재시도 유틸리티

const ChatRoom = ({roomId, userId}) => {

    const queryClient = useQueryClient();
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useChatMessages(roomId, 'random', userId);

    const deleteMutation = useDeleteMessage(roomId);

    const [text, setText] = useState("");

    // userName state 제거하고 React Query 훅 사용
    const { data: myProfile } = useUserMinimal(userId);
    const userName = myProfile?.nickname || "";  // 캐시에서 바로 가져옴

    const socket = useSocket();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ratings, setRatings] = useState({});
    const [participants, setParticipants] = useState([]);
    const [capacity, setCapacity] = useState(0);
    const [evaluationUsers,  setEvaluationUsers]= useState([]);  // 매너평가 대상

    const [roomInfo, setRoomInfo] = useState(null);

    const messagesContainerRef = useRef(null);
    const scrollPositionRef = useRef(null);

    // 전적 관련 상태
    const [partnerRecords, setPartnerRecords] = useState([]);
    const [recordsLoading, setRecordsLoading] = useState(true);
    const [recordsError, setRecordsError] = useState(null);
    const participantsRef = useRef(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    // 메시지 신고 모달 관련 상태
    const [showMessageReportModal, setShowMessageReportModal] = useState(false);
    const [reportTargetMessage, setReportTargetMessage] = useState(null);

    // 알림 모달 상태 추가
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const { removeNotificationsByRoom } = useNotificationStore();
    const wordFilterEnabled = useNotificationStore(state => state.wordFilterEnabled);

    const messages = useMemo(() => {
        if (!data?.pages) return [];
        return data.pages.flatMap(page => page.messages);
    }, [data]);

    const scrollToBottom = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        if (scrollPositionRef.current !== null) {
            // 무한 스크롤 후 위치 복원
            container.scrollTop = container.scrollHeight - scrollPositionRef.current;
            scrollPositionRef.current = null;
        } else {
            // 일반적인 경우 맨 아래로
            container.scrollTop = container.scrollHeight;
        }
    }, []);


    useEffect(() => {
        if (roomId) {
            removeNotificationsByRoom(roomId);
        }
    }, [roomId, removeNotificationsByRoom]);

    // 메시지 전송 시간을 포맷하는 헬퍼 함수 (시간:분 형식)
    const formatTime = (dateTime) => {
        if (!dateTime) return "";
        const date = new Date(dateTime);
        return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    };



    const handleReceiveMessage = async (message) => {
        // 현재 채팅방의 메시지만 처리
        if (message.chatRoom !== roomId) return;

        if (typeof message.sender === "string") {

            const senderId = message.sender;

            try {

                // 1️⃣ 먼저 캐시 확인 (즉시 반환, 0ms)
                const cachedUser = queryClient.getQueryData(['userMinimal', senderId]);

                if (cachedUser) {
                    // ✅ 캐시 히트 - API 호출 없이 즉시 사용
                    console.log(`✅ [캐시 히트] ${cachedUser.nickname} 정보 사용`);
                    message.sender = {
                        _id: senderId,
                        nickname: cachedUser.nickname,
                        profilePhoto: cachedUser.profilePhoto
                    };
                } else {
                    // ⚠️ 캐시 미스 - API 호출 후 캐시에 저장
                    console.log(`⚠️ [캐시 미스] ${senderId} API 조회`);
                    const user = await getUserBasic(senderId);

                    if (user && user.nickname) {
                        message.sender = {_id: senderId, ...user};

                        // 2️⃣ 수동으로 캐시에 저장 (다음부터는 캐시 히트)
                        queryClient.setQueryData(['userMinimal', senderId], {
                            _id: senderId,
                            nickname: user.nickname,
                            profilePhoto: user.profilePhoto
                        });
                        console.log(`💾 [캐시 저장] ${user.nickname} 정보 저장됨`);
                    } else {
                        console.error("수신 메시지의 sender 정보 조회 실패");
                        return;
                    }
                }
            } catch (error) {
                console.error("sender 정보 조회 중 오류:", error);
                return;
            }
        }

        //  중복 체크 (1단계)
        const currentMessages = queryClient.getQueryData(['chat-messages', roomId]);

        if (currentMessages?.pages) {
            const allMessages = currentMessages.pages.flatMap(p => p.messages);
            const exists = allMessages.some(m => m._id === message._id);

            if (exists) {
                console.log(`⚠️ [Socket] 중복 메시지 무시: ${message._id}`);
                return;  // ✅ 조기 종료
            }
        }

        // React Query 캐시에 메시지
        if (message.sender._id !== userId) {
            queryClient.setQueryData(['chat-messages', roomId], (old) => {
                if (!old?.pages) {
                    console.log(`⚠️ [Socket] 캐시 없음 - 초기 구조 생성`);
                    // 캐시가 없으면 초기 구조 생성
                    return {
                        pages: [{ messages: [message], nextCursor: null }],
                        pageParams: [null]
                    };
                }

                const lastPage = old.pages[old.pages.length - 1];

                // ✅ 중복 체크 (2단계)
                if (lastPage.messages.some(m => m._id === message._id)) {
                    console.log(`⚠️ [Socket] 중복 메시지 무시 (2단계): ${message._id}`);
                    return old;
                }

                // ✅ 불변성 유지: 새로운 객체로 생성
                const newPages = old.pages.map((page, index) => {
                    if (index === old.pages.length - 1) {
                        return {
                            ...page,
                            messages: [...page.messages, message]
                        };
                    }
                    return page;
                });

                console.log(`✅ [Socket] 메시지 추가: ${message.text?.slice(0, 30)}...`);

                return { ...old, pages: newPages };
            });
        }
    };

    // 채팅 종료 버튼 클릭 시 채팅방 정보를 불러와 참가자와 초기 따봉 상태(0)를 세팅
    const handleLeaveRoom = async () => {
        try {

            if (roomInfo && roomInfo.chatUsers) {
                setEvaluationUsers(roomInfo.chatUsers);        // UI-리스트는 그대로 두고
                const init = {};
                roomInfo.chatUsers.forEach(u => {
                    const id = typeof u === "object" ? u._id : u;
                    if (id !== userId) init[id] = 0;
                });
                setRatings(init);
            }
        } catch (err) {
            console.error("채팅방 정보 가져오기 오류:", err);
        }
        setIsModalOpen(true);
    };


    // 매너 평가 토글 함수
    const handleRatingToggle = (participantId) => {
        setRatings((prev) => ({
            ...prev,
            [participantId]: prev[participantId] === 1 ? 0 : 1,
        }));
    };




    const confirmLeaveRoom = async () => {
        if (isLeaving) return; // 중복 실행 방지
        setIsLeaving(true);

        try {
            /* 0) 현재 방 상태 재조회 ― 활성화됐는지 확인 */
            const isChatActive =
                roomInfo?.isActive ||
                roomInfo?.status === "active" ||
                (roomInfo?.activeUsers?.length ?? 0) >= roomInfo?.capacity;

            /* 1) 매너 평가(채팅이 실제로 진행된 경우에만) */
            if (isChatActive) {
                await Promise.all(
                    Object.keys(ratings).map(async (participantId) => {
                        if (ratings[participantId] === 1) {
                            await rateUser(participantId, 1);
                        }
                    })
                );
            }

            /* 2) 방 나가기 (핵심 동작) */
            const leaveResponse = await retryWithBackoff(
                () => leaveChatRoom(roomId, userId),
                {
                    maxRetries: 3,
                    delayMs: 1000,
                    exponentialBackoff: true,
                    onRetry: ({ attempt, maxRetries, delay }) => {
                        console.warn(
                            `🔄 방 나가기 재시도 중... ` +
                            `(${attempt}/${maxRetries}) ` +
                            `다음 재시도: ${delay}ms 후`
                        );
                    }
                }
            );

            if (leaveResponse.success) {
                if (socket) socket.emit("leaveRoom", { roomId, userId, status: roomInfo?.status || 'active' });

                /* 3) 채팅 횟수 차감 (실패해도 나가기에 영향 없음) */
                if (isChatActive) {
                    retryWithBackoff(
                        () => decrementChatCount(userId),
                        {
                            maxRetries: 3,
                            delayMs: 1000,
                            exponentialBackoff: true,
                            onRetry: ({ attempt, maxRetries, delay, error }) => {
                                console.warn(
                                    `🔄 채팅 횟수 차감 재시도 중... ` +
                                    `(${attempt}/${maxRetries}) ` +
                                    `다음 재시도: ${delay}ms 후` +
                                    `❌ 오류 원인: ${error.response?.data?.message || error.message || '알 수 없는 오류'}`
                                );
                            }
                        }
                    ).then(result => {
                        // 차감 결과를 React Query 캐시에 반영 → 복귀 시 최신 데이터 표시
                        if (result?.success) {
                            queryClient.setQueryData(['chat-status', userId], (old) =>
                                old ? { ...old, numOfChat: result.numOfChat, maxChatCount: result.maxChatCount, nextRefillAt: result.nextRefillAt } : old
                            );
                        }
                    }).catch(err => {
                        console.error('❌ 채팅 횟수 차감 최종 실패 (나가기는 완료됨):', err);
                    });
                }

                // 채팅방 목록 캐시 제거 (RandomChatComponent의 자동 리다이렉트 방지)
                queryClient.removeQueries({ queryKey: ['chat-rooms'] });

                setIsModalOpen(false);
                navigate("/chat", { replace: true });
            }
        } catch (error) {
            // ✅ 이 시점에 도달했다는 건 leaveChatRoom이 3번 재시도 후 최종 실패!
            console.error("❌ [최종 실패] 채팅방 나가기 실패:", error);

            const errorCode = error.response?.data?.errorCode;
            const errorMessage = error.response?.data?.message;

            // ✅ errorCode로 에러 타입 구분
            switch (errorCode) {
                // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                // 4xx 에러 (재시도 불가능)
                // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                case 'ROOM_NOT_FOUND':
                case 'USER_NOT_FOUND':
                    // ❌ 리소스를 찾을 수 없음 - 재시도 불가
                    setAlertMessage('채팅방을 찾을 수 없습니다.\n페이지를 새로고침해주세요.');
                    setIsAlertOpen(true);
                    break;

                case 'INVALID_ID':
                case 'INVALID_OBJECT_ID':
                case 'BAD_REQUEST':
                case 'MISSING_USER_ID':
                    // ❌ 잘못된 요청 - 재시도 불가
                    setAlertMessage('잘못된 요청입니다.\n페이지를 새로고침해주세요.');
                    setIsAlertOpen(true);
                    break;

                case 'ALREADY_LEFT':
                    // ✅ 이미 퇴장 - 성공으로 간주 (재시도 불필요)
                    console.log('✅ [이미 퇴장] 성공으로 간주');
                    if (socket) socket.emit("leaveRoom", { roomId, userId, status: roomInfo?.status || 'active' });
                    queryClient.removeQueries({ queryKey: ['chat-rooms'] });
                    setIsModalOpen(false);
                    navigate("/chat", { replace: true });
                    return;

                case 'NOT_A_MEMBER':
                case 'FORBIDDEN':
                    // ❌ 권한 없음 - 재시도 불가
                    setAlertMessage('이 채팅방에 접근할 권한이 없습니다.');
                    setIsAlertOpen(true);
                    break;

                // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                // 5xx 에러 (재시도 가능 - 이미 3번 재시도함)
                // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                case 'INTERNAL_ERROR':
                case 'SERVICE_UNAVAILABLE':
                    // ✅ 서버 오류 - 이미 3번 재시도했으므로 최종 실패 안내
                    setAlertMessage(
                        '서버 오류가 발생했습니다.\n' +
                        '(자동으로 3번 재시도했으나 실패)\n\n' +
                        '잠시 후 다시 시도해주세요.'
                    );
                    setIsAlertOpen(true);
                    break;

                case 'TOO_MANY_REQUESTS':
                    // ✅ 요청 과다 - 이미 3번 재시도했으므로 최종 실패 안내
                    setAlertMessage(
                        '요청이 너무 많습니다.\n' +
                        '(자동으로 3번 재시도했으나 실패)\n\n' +
                        '잠시 후 다시 시도해주세요.'
                    );
                    setIsAlertOpen(true);
                    break;

                // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                // 기타 에러
                // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                default:
                    // 네트워크 오류 체크
                    if (error.message?.includes('Network') ||
                        error.code === 'ECONNABORTED' ||
                        error.code === 'ECONNRESET' ||
                        error.code === 'ETIMEDOUT') {
                        // ✅ 네트워크 오류 - 이미 3번 재시도
                        setAlertMessage(
                            '네트워크 오류가 발생했습니다.\n' +
                            '(자동으로 3번 재시도했으나 실패)\n\n' +
                            '인터넷 연결을 확인하고\n' +
                            '다시 시도해주세요.'
                        );
                        setIsAlertOpen(true);
                    } else {
                        // 기타 알 수 없는 오류
                        setAlertMessage(errorMessage || '채팅방 나가기 중 오류가 발생했습니다.');
                        setIsAlertOpen(true);
                    }
            }
            // ❌ 에러 시 모달을 닫지 않음 — 사용자가 다시 "확인"을 누를 수 있도록 유지
        } finally {
            setIsLeaving(false);
        }
    };


    const cancelLeaveRoom = () => {
        setIsModalOpen(false);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!text.trim() || !socket || !userName) {
            return;
        }

        const emitMessage = { chatRoom: roomId, sender: userId, text, roomType: "random" };

        socket.emit("sendMessage", emitMessage, (response) => {
            if (response.success) {
                // 서버로부터 받은 필터링된 메시지로 상태를 업데이트합니다.
                const receivedMessage = {
                    ...response.message,
                    sender: { _id: userId, nickname: userName } // sender 정보를 프론트엔드 형식에 맞게 재구성
                };

                // ✅ React Query 캐시에 메시지 추가 (불변성 유지)
                queryClient.setQueryData(['chat-messages', roomId], (old) => {
                    if (!old?.pages) {
                        // ✅ 캐시가 없으면 초기 구조 생성
                        return {
                            pages: [{ messages: [receivedMessage], nextCursor: null }],
                            pageParams: [null]
                        };
                    }

                    // ✅ 불변성 유지: 새로운 객체로 생성 (handleReceiveMessage와 동일한 방식)
                    const newPages = old.pages.map((page, index) => {
                        if (index === old.pages.length - 1) {
                            // 중복 체크
                            if (page.messages.some(m => m._id === receivedMessage._id)) {
                                return page;
                            }
                            return {
                                ...page,
                                messages: [...page.messages, receivedMessage]
                            };
                        }
                        return page;
                    });

                    return { ...old, pages: newPages };
                });

                setText("");
            } else {
                console.error("메시지 전송 실패", response);
            }
        });
    };

// 삭제 버튼 클릭 시 모달 열기
    const onDeleteButtonClick = (messageId) => {
        setDeleteTargetId(messageId);
        setShowDeleteModal(true);
    };

// 모달에서 “확인” 클릭 시 실제 삭제
    const confirmDelete = async () => {
        try {

            // React Query 낙관적 업데이트
            await deleteMutation.mutateAsync({ messageId: deleteTargetId });

            if (socket) {
                socket.emit("deleteMessage", { messageId: deleteTargetId, roomId });
            }
        } catch (error) {
            console.error("메시지 삭제 중 오류 발생:", error);

            // 사용자 친화적 에러 메시지
            if (error.response?.status === 404) {
                setAlertMessage('이미 삭제된 메시지입니다.');
                setIsAlertOpen(true);
            } else if (error.response?.status === 400) {
                setAlertMessage('잘못된 요청입니다.');
                setIsAlertOpen(true);
            } else {
                setAlertMessage('메시지 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
                setIsAlertOpen(true);
            }
        } finally {
            setShowDeleteModal(false);
            setDeleteTargetId(null);
        }

    };

// 모달에서 “취소” 클릭 시 닫기
    const cancelDelete = () => {
        setShowDeleteModal(false);
        setDeleteTargetId(null);
    };

// ============================================================================
//   🚨 메시지 신고 관련 함수들
// ============================================================================

    // 메시지 신고 모달 열기
    const openMessageReportModal = (message) => {
        setReportTargetMessage(message);
        setShowMessageReportModal(true);
    };

    // 메시지 신고 모달 닫기
    const closeMessageReportModal = () => {
        setReportTargetMessage(null);
        setShowMessageReportModal(false);
    };

    const handleUserLeft = ({ userId: leftId }) => {
        setParticipants(prev =>
            prev.filter(u =>
                (typeof u === "object" ? u._id : u) !== leftId
            )
        );
    };

    const handleSystemMessage = (msg) => {
        queryClient.setQueryData(['chat-messages', roomId], (old) => {
            if (!old?.pages) return old;

            const newPages = old.pages.map((page, index) => {
                if (index === old.pages.length - 1) {
                    // 중복 체크
                    if (page.messages.some(m => m._id === msg._id)) {
                        return page;
                    }
                    // 새 페이지 객체 생성 (불변성 유지)
                    return {
                        ...page,
                        messages: [...page.messages, msg]
                    };
                }
                return page;
            });

            return { ...old, pages: newPages };
        });
    };

    // 무한 스크롤 핸들러
    const handleScroll = () => {
        const container = messagesContainerRef.current;
        if (container && container.scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
            scrollPositionRef.current = container.scrollHeight;
            fetchNextPage();
        }
    };


    useEffect(() => {
        // ✅ 소켓이 없으면 조기 반환
        if (!socket) {
            console.log('⚠️ [ChatRoom] 소켓 없음 - 이벤트 리스너 등록 대기');
            return;
        }

        console.log('✅ [ChatRoom] 소켓 이벤트 리스너 등록 시작:', socket.id);

        // ✅ 소켓 연결 시 방 참가 실행
        const handleConnect = () => {
            console.log('✅ [ChatRoom] 소켓 연결됨 - joinRoom 실행:', socket.id);
            socket.emit("joinRoom", roomId, "random");
        };

        // ✅ 항상 connect 이벤트 리스너 등록 (재연결 대비)
        socket.on('connect', handleConnect);

        // ✅ 이미 연결된 상태라면 즉시 joinRoom 호출
        if (socket.connected) {
            socket.emit("joinRoom", roomId, "random");
        }

        // ✅ roomJoined 핸들러
        const handleRoomJoined = async ({
            roomId: eventRoomId,
            chatUsers,
            activeUsers,
            capacity: roomCapacity,
            isActive,
            status
        }) => {
            try {
                if (eventRoomId !== roomId) {
                    console.log("⚠️ 다른 방의 이벤트 무시:", eventRoomId);
                    return;
                }

                console.log("✅ roomJoined 이벤트 수신:", {
                    chatUsers: chatUsers?.length,
                    activeUsers: activeUsers?.length,
                    capacity: roomCapacity,
                    isActive,
                    status
                });

                setRoomInfo({ chatUsers, activeUsers, capacity: roomCapacity, isActive, status });

                // 캐시 활용: 먼저 캐시 확인, 없으면 API 호출
                const participantsWithNames = await Promise.all(
                    activeUsers.map(async u => {
                        const id = typeof u === "object" ? u._id : u;

                        // 1️⃣ 캐시 확인
                        const cachedUser = queryClient.getQueryData(['userMinimal', id]);

                        if (cachedUser) {
                            return {
                                _id: id,
                                nickname: cachedUser.nickname,
                                profilePhoto: cachedUser.profilePhoto
                            };
                        } else {
                            const userInfo = await getUserBasic(id);

                            // 2️⃣ 캐시에 저장
                            queryClient.setQueryData(['userMinimal', id], {
                                _id: id,
                                nickname: userInfo.nickname,
                                profilePhoto: userInfo.profilePhoto
                            });

                            return {
                                _id: id,
                                nickname: userInfo.nickname || "알 수 없음",
                                profilePhoto: userInfo.profilePhoto
                            };
                        }
                    })
                );

                setParticipants(participantsWithNames);
                setCapacity(roomCapacity);
            } catch (err) {
                console.error("참가자 정보 조회 오류:", err);
            }
        };

        // ✅ messageDeleted 핸들러
        const handleMessageDeleted = ({ messageId }) => {
            queryClient.setQueryData(['chat-messages', roomId], (old) => {
                if (!old?.pages) return old;

                return {
                    ...old,
                    pages: old.pages.map(page => ({
                        ...page,
                        messages: page.messages.map(msg =>
                            msg._id === messageId
                                ? { ...msg, isDeleted: true, text: '[삭제된 메시지입니다]' }
                                : msg
                        ),
                    })),
                };
            });
        };

        // ✅ 이벤트 리스너 등록
        socket.on("roomJoined", handleRoomJoined);
        socket.on("receiveMessage", handleReceiveMessage);
        socket.on("userLeft", handleUserLeft);
        socket.on("systemMessage", handleSystemMessage);
        socket.on("messageDeleted", handleMessageDeleted);

        console.log('✅ [ChatRoom] 모든 이벤트 리스너 등록 완료');

        // ✅ Cleanup: 소켓이 변경되거나 컴포넌트 언마운트 시
        return () => {
            console.log('🧹 [ChatRoom] 이벤트 리스너 정리:', socket.id);
            socket.off('connect', handleConnect);
            socket.off("roomJoined", handleRoomJoined);
            socket.off("receiveMessage", handleReceiveMessage);
            socket.off("userLeft", handleUserLeft);
            socket.off("systemMessage", handleSystemMessage);
            socket.off("messageDeleted", handleMessageDeleted);
        };

    }, [roomId, socket, userId, queryClient]);


    // 증분 동기화 (불변성 준수 + 소켓 재연결 감지 + 백업 폴링)
    useEffect(() => {
        if (!roomId) {
            console.log('⚠️ [증분동기화] roomId 없음');
            return;
        }

        let isCancelled = false;

        const syncNewMessages = async () => {
            if (isCancelled) {
                console.log('⚠️ [증분동기화] 취소됨 (cleanup)');
                return;
            }

            try {
                // 1. 현재 캐시에서 데이터 조회 (data 변수 의존 안 함!)
                const currentData = queryClient.getQueryData(['chat-messages', roomId]);

                if (!currentData?.pages) {
                    console.log('⚠️ [증분동기화] 캐시 데이터 없음');
                    return;
                }

                // 2. 마지막 메시지 ID 찾기
                const allMessages = currentData.pages.flatMap(p => p.messages);
                const lastMessage = allMessages[allMessages.length - 1];

                if (!lastMessage) {
                    console.log('⚠️ [증분동기화] 메시지 없음 (첫 로딩)');
                    return;
                }

                console.log(`🔄 [증분동기화] 시작 - lastId: ${lastMessage._id}`);

                // 3. API 호출: "이 ID 이후 메시지만 주세요"
                const result = await getNewMessages(roomId, lastMessage._id);

                if (isCancelled) {
                    console.log('⚠️ [증분동기화] API 응답 받았지만 취소됨');
                    return;
                }

                // 4. 새 메시지 처리
                if (result.messages && result.messages.length > 0) {
                    console.log(`✅ [증분동기화] 새 메시지 ${result.messages.length}개 발견!`);

                    queryClient.setQueryData(['chat-messages', roomId], (old) => {
                        if (!old?.pages) return old;

                        // ✅ 불변성 준수: 배열과 객체를 새로 생성
                        const newPages = [...old.pages];
                        const lastPageIndex = newPages.length - 1;
                        const lastPage = newPages[lastPageIndex];

                        // 중복 제거
                        const existingIds = new Set(lastPage.messages.map(m => m._id));
                        const uniqueMessages = result.messages.filter(m => !existingIds.has(m._id));

                        if (uniqueMessages.length === 0) {
                            console.log('✅ [증분동기화] 모두 중복 메시지 (이미 있음)');
                            return old;
                        }

                        // ✅ 핵심: 새 객체로 교체 (원본 수정 안 함)
                        newPages[lastPageIndex] = {
                            ...lastPage,
                            messages: [...lastPage.messages, ...uniqueMessages]
                        };

                        console.log(`✅ [증분동기화] ${uniqueMessages.length}개 캐시에 추가 완료`);

                        return { ...old, pages: newPages };
                    });
                } else {
                    console.log(`✅ [증분동기화] 새 메시지 없음 (이미 최신)`);
                }
            } catch (error) {
                console.error('❌ [증분동기화] 실패:', error);
            }
        };

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 실행 시점: 마운트 시 (다른 페이지 갔다 돌아올 때)
        // - 주기적 폴링 제거 (랜덤채팅은 소켓 실시간으로 충분)
        // - 이벤트 리스너 해제 → 재등록 사이에 놓친 메시지만 동기화
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        console.log('🔄 [증분동기화] 컴포넌트 마운트 - 놓친 메시지 동기화');
        syncNewMessages();

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // Cleanup
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        return () => {
            console.log('🧹 [증분동기화] Cleanup');
            isCancelled = true;
        };

    }, [roomId, queryClient, socket?.connected]);
//   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//   의존성 설명:
//   - roomId: 방이 바뀌면 재실행
//   - queryClient: 안정적 (변경 안 됨)
//   - socket?.connected: false → true 되면 재실행 (재연결 감지!)
//==========================================================================


    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);


    // ────────── ③ participants 변경 시 상대 소환사명으로 전적 조회 ──────────
    // ChatRoom.jsx의 useEffect 부분을 다음과 같이 수정
    useEffect(() => {
        if (participants.length < 2 || participantsRef.current) return;

        participantsRef.current = true;

        const otherParticipants = participants.filter(p => p._id !== userId);

        setRecordsLoading(true);
        setRecordsError(null);

        Promise.all(
            otherParticipants.map(async participant => {
                const participantId = participant._id;
                const userInfo = { nickname: participant.nickname }; // 참가자 정보에서 닉네임 사용

                try {
                    // 1️⃣ Riot ID 캐시 확인
                    let riotInfo = queryClient.getQueryData(['user-riot-info', participantId]);

                    if (!riotInfo) {
                        // 캐시 미스 - API 호출
                        console.log(`⚠️ [전적-Riot정보] ${participantId} 조회`);
                        riotInfo = await getUserRiotInfo(participantId);

                        // 캐시에 저장
                        queryClient.setQueryData(['user-riot-info', participantId], riotInfo);
                    } else {
                        console.log(`✅ [전적-Riot정보-캐시히트] ${participantId}`);
                    }

                    if (riotInfo && riotInfo.riotGameName && riotInfo.riotTagLine) {
                        const { riotGameName, riotTagLine } = riotInfo;
                        userInfo.riotGameName = riotGameName;
                        userInfo.riotTagLine = riotTagLine;

                        // 2️⃣ 전적 캐시 확인
                        let leagueRecord = queryClient.getQueryData(['league-record', riotGameName, riotTagLine]);

                        if (!leagueRecord) {
                            // 캐시 미스 - API 호출
                            console.log(`⚠️ [전적-리그정보] ${riotGameName}#${riotTagLine} 조회`);
                            leagueRecord = await getLeagueRecord(riotGameName, riotTagLine);

                            // 캐시에 저장 (5분)
                            queryClient.setQueryData(['league-record', riotGameName, riotTagLine], leagueRecord);
                            console.log(`💾 [전적-리그정보-저장] ${riotGameName}#${riotTagLine}`);
                        } else {
                            console.log(`✅ [전적-리그정보-캐시히트] ${riotGameName}#${riotTagLine}`);
                        }

                        return { participantId, userInfo, leagueRecord, error: null };
                    } else {
                        return {
                            participantId,
                            userInfo,
                            leagueRecord: null,
                            error: "Riot ID가 연동되지 않은 유저입니다."
                        };
                    }
                } catch (err) {
                    console.error('전적 조회 오류:', err);
                    return { participantId, userInfo, leagueRecord: null, error: err.message };
                }
            })
        )
            .then(results => {
                setPartnerRecords(results);
                setRecordsLoading(false);
                console.log('✅ [전적] 전체 조회 완료');
            })
            .catch(err => {
                console.error('전적 조회 전체 오류:', err);
                setRecordsError(err.message);
                setRecordsLoading(false);
            });
    }, [participants, userId, queryClient]);


    return (
        <div
            className="max-w-6xl mx-auto h-[calc(100vh-80px)] flex flex-col md:flex-row p-4 space-y-4 md:space-y-0 md:space-x-8 bg-gradient-to-br from-indigo-50 to-purple-50">
            {/* ─── 채팅 섹션 ─── */}
            <section className="flex-1 flex flex-col bg-white shadow-2xl rounded-xl overflow-hidden">
                <header className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6">

                    {/* 참가자 리스트 */}
                    <div className="mt-2 flex flex-wrap gap-2 text-sm">
                        {participants.filter(user => user && user._id).map(user => (
                            <div key={user._id} className="flex items-center bg-white bg-opacity-20 rounded px-3 py-1 text-black">
                                <ProfileButton profile={user} className="mr-1" area="프로필" onModalToggle={setIsProfileOpen}/>
                                <span className="text-white">{user.nickname}</span>
                            </div>
                        ))}
                    </div>

                </header>

                {/* ─── 공지사항 배너 ─── */}
                <div className="bg-yellow-50 border-b border-yellow-100 px-6 py-3 text-center">
                    <p className="text-xs text-yellow-700 font-medium break-keep">
                        ⚠️ 개인정보 노출(실명, 연락처 등) 및 만남 유도 행위는 차단될 수 있습니다.
                    </p>
                </div>

                        <div
                            ref={messagesContainerRef}
                            onScroll={handleScroll}
                            className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50"
                        >
                            {isFetchingNextPage && (  // ✅ 로딩 표시 추가
                                <div className="text-center text-gray-500 py-2">
                                    이전 메시지 로딩 중...
                                </div>
                            )}
                            {messages.filter(msg => msg && (msg.isSystem || msg.sender)).map(msg => {
                                /* 시스템-메시지라면 중앙 정렬 회색 글씨로 */
                                if (msg.isSystem) {
                                    return (
                                        <div key={msg._id} className="text-center text-gray-500 text-sm">
                                            {msg.text}
                                        </div>
                                    );
                                }
                                // ✅ isDeleted가 없으면 false로 처리
                                const isDeleted = msg.isDeleted ?? false;

                                const isMe = msg.sender._id === userId;
                                return (
                                    <div
                                        key={`${msg._id}-${msg.createdAt}`}
                                        className={`flex items-start gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {/* 프로필 */}
                                        {!isMe && (
                                            <ProfileButton
                                                profile={msg.sender}
                                                area="프로필"
                                                onModalToggle={setIsProfileOpen}
                                            />
                                        )}

                                        {/* 닉네임과 메시지 컨테이너 */}
                                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            {/* 닉네임 */}
                                            {!isMe && (
                                                <span className="text-sm font-semibold text-gray-800 mb-1">
                                                    {msg.sender.nickname}
                                                </span>
                                            )}

                                            {/* 말풍선과 시간 */}
                                            <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                <div
                                                    className={`relative max-w-full p-3 rounded-lg shadow ${isMe ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'}`}
                                                >
                                                    <p className="whitespace-pre-wrap break-all">
                                                        {isDeleted ? '삭제된 메시지입니다.' : (wordFilterEnabled ? filterProfanity(msg.text) : msg.text)}
                                                    </p>
                                                    
                                                    {/* 상대방 메시지에 신고 버튼 추가 */}
                                                    {!isMe && !msg.isDeleted && !msg.isSystem && (
                                                        <button
                                                            onClick={() => openMessageReportModal(msg)}
                                                            className="absolute -top-1 -right-1 bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 rounded-full w-6 h-6 flex items-center justify-center text-xs transition-colors"
                                                            title="메시지 신고"
                                                        >
                                                            ⋯
                                                        </button>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-400 pb-1">
                                                    {formatTime(msg.createdAt)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* 내 메시지일 때 프로필 & 삭제 버튼 */}
                                        {isMe && !msg.isDeleted && (
                                            <button
                                                onClick={() => onDeleteButtonClick(msg._id)}
                                                className="ml-2 text-red-600 hover:text-red-800 focus:outline-none self-end"
                                                title="메시지 삭제"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <CommonModal
                            isOpen={showDeleteModal}
                            onClose={cancelDelete}
                            title="메시지 삭제 확인"
                            onConfirm={confirmDelete}
                        >
                            <p>이 메시지를 정말 삭제하시겠습니까?</p>
                        </CommonModal>


                        {/* 입력 폼 */}
                        {!isProfileOpen && (
                        <form
                            onSubmit={handleSendMessage}
                            className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex items-center space-x-3"
                        >
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={text}
                                    onChange={e => {
                                        if (e.target.value.length <= 100) {
                                            setText(e.target.value);
                                        }
                                    }}
                                    placeholder="메시지를 입력하세요…"
                                    maxLength={100}
                                    className="w-full border border-gray-300 rounded-full px-5 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition pr-20"
                                />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                    {text.length}/100
                                </span>
                            </div>
                            <button
                                type="submit"
                                className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full shadow-lg hover:from-indigo-600 hover:to-purple-600 focus:outline-none transition"
                            >
                                전송
                            </button>
                        </form>
                            )}

            </section>

            {/* 채팅 종료 버튼 */}
            <button
                onClick={handleLeaveRoom}
                className="fixed bottom-6 right-6 bg-red-500 text-white p-4 rounded-full shadow-2xl hover:bg-red-600 focus:outline-none transition"
                title="채팅 종료"
            >
                🚪 채팅 종료
            </button>

            <CommonModal
                isOpen={isModalOpen}
                onClose={cancelLeaveRoom}
                title={
                    evaluationUsers.filter((user) => {
                        const participantId = typeof user === "object" ? user._id : user;
                        return participantId !== userId;
                    }).length > 0
                        ? "채팅방 종료 및 매너 평가"
                        : "채팅 종료"
                }
                onConfirm={confirmLeaveRoom}
                isLoading={isLeaving}
            >
                {evaluationUsers.filter((user) => {
                    const participantId = typeof user === "object" ? user._id : user;
                    return participantId !== userId;
                }).length > 0 ? (
                    <div>
                        <p className="mb-4">
                            채팅 종료 전,
                            다른 참가자들의 매너를 평가 해주세요.
                        </p>
                        {evaluationUsers.filter(user => user && user._id)
                            .filter((user) => {
                                const participantId = typeof user === "object" ? user._id : user;
                                return participantId !== userId;
                            })
                            .map((user) => {
                                const participantId = typeof user === "object" ? user._id : user;
                                const participantNickname =
                                    typeof user === "object" ? user.nickname : user;
                                const isRated = ratings[participantId] === 1;
                                return (
                                    <div key={participantId} className="my-2 flex items-center space-x-2">
                                        <span className="block font-medium">
                                            {participantNickname}
                                        </span>
                                        <button
                                            onClick={() => handleRatingToggle(participantId)}
                                            className={`border rounded px-2 py-1 focus:outline-none ${
                                                isRated ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
                                            }`}
                                        >
                                            👍
                                        </button>
                                    </div>
                                );
                            })}
                    </div>
                ) : (
                    <div>
                        <p className="mb-4">채팅을 종료 하시겠습니까?</p>
                    </div>
                )}
            </CommonModal>
            
            {/* 메시지 신고 모달 */}
            <MessageReportModal
                isOpen={showMessageReportModal}
                onClose={closeMessageReportModal}
                message={reportTargetMessage}
                roomType="random"
            />
            
            {/* ─── 전적 섹션 ─── */}
            <LeagueRecordSection
                partnerRecords={partnerRecords}
                loading={recordsLoading}
                error={recordsError}
                onRecordUpdate={(gameName, tagLine, newData) => {
                    // 갱신된 데이터로 partnerRecords 상태 업데이트
                    setPartnerRecords(prev => prev.map(record => {
                        if (record.userInfo?.riotGameName === gameName &&
                            record.userInfo?.riotTagLine === tagLine) {
                            return { ...record, leagueRecord: newData };
                        }
                        return record;
                    }));
                    // React Query 캐시도 업데이트
                    queryClient.setQueryData(['league-record', gameName, tagLine], newData);
                }}
            />
            <CommonModal
                isOpen={isAlertOpen}
                onClose={() => setIsAlertOpen(false)}
                title="알림"
                onConfirm={() => setIsAlertOpen(false)}
                showCancel={false}
            >
                {alertMessage}
            </CommonModal>
        </div>
    );
};

ChatRoom.propTypes = {
    roomId: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
};

export default ChatRoom;
