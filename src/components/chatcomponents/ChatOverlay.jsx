import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../../hooks/useSocket.js";
import { fetchMessages } from "../../api/chatAPI.js";
import { getUserInfo } from "../../api/userAPI.js";
import useAuthStore from "../../stores/authStore.js";
import useFriendChatStore from "../../stores/useFriendChatStore.js";
import ProfileButton from "../MyPageComponent/ProfileButton.jsx";

// eslint-disable-next-line react/prop-types
function ChatOverlay({ roomId: propRoomId, customStyle = {}, onClose, friend }) {
    const { roomId: routeRoomId } = useParams();
    const roomId = propRoomId || routeRoomId;
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [userName, setUserName] = useState("");
    const socket = useSocket();
    const authUser = useAuthStore((state) => state.user);
    const senderId = authUser?._id;

    const messagesContainerRef = useRef(null);
    const [isMinimized] = useState(false);
    const hiddenRoomIds = useFriendChatStore((s) => s.hiddenRoomIds);
    const toggleHideChat = useFriendChatStore((s) => s.toggleHideChat);

    const [isProfileOpen, setIsProfileOpen] = useState(false);


    // textTime을 HH:MM 형식으로 포맷하는 헬퍼 함수
    const formatTime = (textTime) => {
        if (!textTime) return "";
        const date = new Date(textTime);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // 날짜를 "YYYY-MM-DD" 형태로 포맷하는 헬퍼 함수 (그룹 헤더용)
    const formatDate = (textTime) => {
        if (!textTime) return "";
        const date = new Date(textTime);
        return date.toLocaleDateString();
    };

    // 메시지를 날짜별로 그룹화하는 함수
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

    // 사용자 정보 불러오기
    useEffect(() => {
        if (!senderId) return;
        const fetchUserInfoAsync = async () => {
            try {
                const user = await getUserInfo(senderId);
                setUserName(user.name);
            } catch (error) {
                console.error("유저 정보 불러오기 실패:", error);
            }
        };

        fetchUserInfoAsync();
    }, [senderId]);

    // 채팅방 참여 및 메시지 수신 처리
    useEffect(() => {
        if (socket && roomId) {
            socket.emit("joinRoom", roomId);
            socket.on("receiveMessage", (message) => {
                const normalizedMessage = {
                    ...message,
                    sender: message.sender.id
                        ? { _id: message.sender.id, name: message.sender.name, nickname: message.sender.nickname }
                        : message.sender,
                };

                setMessages((prevMessages) => {
                    const messageSet = new Set(prevMessages.map((msg) => msg._id));
                    if (!messageSet.has(normalizedMessage._id)) {
                        return [...prevMessages, normalizedMessage];
                    }
                    return prevMessages;
                });
            });

            return () => {
                socket.off("receiveMessage");
            };
        }
    }, [socket, roomId]);

    // 채팅방 기존 메시지 불러오기
    useEffect(() => {
        if (roomId) {
            const loadMessages = async () => {
                try {
                    const data = await fetchMessages(roomId);
                    setMessages(data);
                } catch (error) {
                    console.error("채팅 메시지 불러오기 실패:", error);
                }
            };

            loadMessages();
        }
    }, [roomId]);

    // 스크롤 최신화
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleMessageChange = (e) => {
        setNewMessage(e.target.value);
    };

    // 메시지 전송 함수
    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (newMessage.trim() && socket && roomId && senderId) {
            try {
                const messageData = {
                    chatRoom: roomId,
                    sender: senderId,
                    text: newMessage,
                };

                socket.emit("sendMessage", messageData, (response) => {
                    if (response.success) {
                        const normalizedMessage = {
                            ...response.message,
                            sender: response.message.sender.id
                                ? { _id: response.message.sender.id, name: response.message.sender.name }
                                : response.message.sender,
                        };

                        setMessages((prevMessages) => {
                            const messageSet = new Set(prevMessages.map((msg) => msg._id));
                            if (!messageSet.has(normalizedMessage._id)) {
                                return [...prevMessages, normalizedMessage];
                            }
                            return prevMessages;
                        });
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

    const handleClose = () => {
        if (onClose) {
            onClose(roomId);
        }
    };

    const groupedMessages = groupMessagesByDate(messages);


    if (isMinimized) return null;
    /* 숨김 상태면 컴포넌트 자체를 렌더하지 않음 */
    if (hiddenRoomIds.includes(roomId)) return null;

    return (
        <div className="fixed bottom-5 right-5 w-[350px] h-[400px] bg-white shadow-lg
                 rounded-lg flex flex-col overflow-hidden z-[900]"
             style={customStyle}>
            {/* ── 헤더 ── */}
            <div className="bg-[#0084ff] text-white p-2.5 flex items-center justify-between select-none">
                {/* 왼쪽 : 프로필 버튼 + 상대방 이름 */}
                <div className="flex items-center space-x-2">
                    {/* 상대방 정보가 있을 때만 표시 */}
                    <div className="text-black">
                    {friend && (
                        <ProfileButton
                            profile={friend}
                            area="친구채팅"
                            onModalToggle={setIsProfileOpen}
                        />
                    )}
                    </div>
                    <span>{friend?.nickname || friend?.name || "채팅"}</span>
                </div>

                {/* 오른쪽 : 최소화 / 닫기 */}
                <div className="flex items-center space-x-2">
                    <button
                        className="bg-transparent text-white text-base leading-none"
                        onClick={() => toggleHideChat(roomId)}
                    >
                        ▼
                    </button>
                    <button
                        className="bg-transparent text-white text-base leading-none"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClose();
                        }}
                    >
                        X
                    </button>
                </div>
            </div>
            {!isMinimized && (
                <>
                    <div ref={messagesContainerRef} className="flex-1 p-2.5 overflow-y-auto bg-gray-100 h-[300px]">
                        {Object.keys(groupedMessages).map((date) => (
                            <div key={date}>
                                <div className="text-center my-[10px] text-xs text-gray-600">
                                    {date}
                                </div>
                                <ul className="list-none p-0 m-0">
                                    {groupedMessages[date].map((message) => {
                                        const isMyMessage = message.sender._id === senderId;

                                        return (
                                            <li
                                                key={message._id}
                                                className={`flex items-end gap-2 mb-2 ${
                                                    isMyMessage ? "justify-end" : "justify-start"
                                                }`}
                                            >
                                                {/* 상대방 메시지일 때만 프로필 노출 */}
                                                {!isMyMessage && (
                                                    <ProfileButton profile={message.sender} area="친구채팅"
                                                                   onModalToggle={setIsProfileOpen}/>
                                                )}

                                                {/* 말풍선 */}
                                                <div
                                                    className={`py-2 px-3 rounded-[16px] max-w-[70%] ${
                                                        isMyMessage
                                                            ? "bg-[#0084ff] text-white"
                                                            : "bg-[#e4e6eb] text-black"
                                                    }`}
                                                >
                                                    <strong className="text-xs">{message.sender.nickname}</strong>
                                                    <div className="text-sm mt-1">{message.text}</div>
                                                    <div
                                                        className={`text-xs mt-1 ${
                                                            isMyMessage ? "text-right" : "text-left"
                                                        }`}
                                                    >
                                                        {formatTime(message.textTime)}
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>

                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleSendMessage} className="flex border-t border-gray-300">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={handleMessageChange}
                            placeholder="메시지를 입력하세요..."
                            className="flex-1 p-2.5 border-none outline-none"
                        />
                        <button type="submit"
                                className="py-2.5 px-3.5 bg-[#0084ff] text-white border-0 cursor-pointer">
                            전송
                        </button>
                    </form>
                </>
            )}
        </div>
    );
}

export default ChatOverlay;
