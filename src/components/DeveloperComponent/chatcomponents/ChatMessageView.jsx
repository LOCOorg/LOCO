// C:\Users\wjdtj\WebstormProjects\LOCO\src\components\DeveloperComponent\chatcomponents\ChatMessageView.jsx
import React from 'react';

const ChatMessageView = ({ messages, selectedRoom }) => (
    <div className="w-1/3 p-4 overflow-y-auto bg-white">
        <h2 className="text-xl font-semibold mb-2">대화 내용</h2>
        {!selectedRoom ? (
            <p className="text-gray-500">채팅방을 선택해주세요</p>
        ) : messages.length > 0 ? (
            messages.map(msg => (
                <div key={msg._id} className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">
                        {new Date(msg.textTime).toLocaleString()}
                    </p>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
            ))
        ) : (
            <p className="text-gray-500">메시지가 없습니다</p>
        )}
    </div>
);

export default ChatMessageView;
