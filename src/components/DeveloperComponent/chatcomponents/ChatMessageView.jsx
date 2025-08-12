import React from 'react';

// 날짜를 YYYY.MM.DD로 포맷
const formatDate = date => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
};

// 시간을 HH:MM 형식으로 포맷
const formatTime = date =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const ChatMessageView = ({ messages, selectedRoom, currentUser }) => (
    <div className="w-1/3 p-4 overflow-y-auto bg-white flex flex-col">
        <h2 className="text-xl font-semibold mb-2">대화 내용</h2>

        {!selectedRoom ? (
            <p className="text-gray-500">채팅방을 선택해주세요</p>
        ) : messages.length > 0 ? (
            messages.map((msg, idx) => {
                const msgDate = new Date(msg.textTime);
                const prevDate =
                    idx > 0 ? new Date(messages[idx - 1].textTime) : null;
                const showDateSeparator =
                    idx === 0 || formatDate(msgDate) !== formatDate(prevDate);
                const dateString = formatDate(msgDate);
                const timeString = formatTime(msgDate);

                const senderId = msg.sender?._id || msg.sender;
                const isMe =
                    !!currentUser &&
                    senderId &&           // null 방지
                    senderId.toString() === currentUser._id.toString();

                // 닉네임과 실제 이름을 함께 표시
                const nick = msg.sender?.nickname;
                const real = msg.sender?.name;
                const displayName =
                    nick && real
                        ? `${nick}(${real})`
                        : nick || real || '알 수 없음';

                // System 메시지 체크
                const isSystemMessage = msg.isSystem || msg.sender?.nickname === 'system';

                if (isSystemMessage) {
                    // System 메시지는 TailwindCSS로 중앙 정렬 스타일
                    return (
                        <div key={idx}>
                            {showDateSeparator && (
                                <div className="text-center my-2.5 py-1 text-gray-400 text-xs border-b border-gray-200">
                                    {dateString}
                                </div>
                            )}
                            <div className="text-center my-2 mx-auto max-w-[80%] px-3 py-1.5 bg-gray-100 rounded-xl text-sm text-gray-600">
                                <div className="text-xs text-gray-400 mb-0.5">
                                    {timeString}
                                </div>
                                <div className="italic">
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    );
                }

                return (
                    <React.Fragment key={msg._id}>
                        {showDateSeparator && (
                            <div className="w-full text-center text-xs text-gray-400 my-2">
                                -------- {dateString} --------
                            </div>
                        )}

                        <div
                            className={`mb-1 flex w-full ${
                                isMe ? 'justify-end' : 'justify-start'
                            }`}
                        >
                            {isMe && (
                                // 내 메시지는 말풍선 왼쪽에 시간
                                <p className="text-[10px] text-gray-500 mr-2 self-end">
                                    {timeString}
                                </p>
                            )}

                            <div
                                className={`max-w-[80%] px-4 py-2 whitespace-pre-wrap rounded-xl ${
                                    isMe
                                        ? 'bg-yellow-200 text-black rounded-bl-none'
                                        : 'bg-gray-100 text-gray-900 rounded-br-none'
                                }`}
                            >
                                {/* 말풍선 안에 닉네임(실제 이름) */}
                                <p
                                    className={`text-xs font-semibold mb-1 ${
                                        isMe ? 'text-right' : 'text-left'
                                    }`}
                                >
                                    {displayName}
                                </p>

                                {/* 메시지 본문 */}
                                <p className="whitespace-pre-wrap">{msg.text}</p>

                                {/* 삭제 표시 */}
                                {msg.isDeleted && (
                                    <p className="text-[10px] text-gray-500 mt-1">
                                        • 삭제됨
                                    </p>
                                )}
                            </div>

                            {!isMe && (
                                // 상대 메시지는 말풍선 오른쪽에 시간
                                <p className="text-[10px] text-gray-500 ml-2 self-end">
                                    {timeString}
                                </p>
                            )}
                        </div>
                    </React.Fragment>
                );
            })
        ) : (
            <p className="text-gray-500">메시지가 없습니다</p>
        )}
    </div>
);

export default ChatMessageView;
