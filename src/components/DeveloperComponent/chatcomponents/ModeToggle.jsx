// C:\Users\wjdtj\WebstormProjects\LOCO\src\components\DeveloperComponent\chatcomponents\ModeToggle.jsx
import React from 'react';

const ModeToggle = ({mode, setMode}) => (
    <div className="flex space-x-4 p-4 bg-white border-b">
        <button
            onClick={() => setMode('user')}
            className={`px-4 py-2 rounded ${
                mode === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
            }`}
        >
            User Search
        </button>
        <button
            onClick={() => setMode('chat')}
            className={`px-4 py-2 rounded ${
                mode === 'chat'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
            }`}
        >
            Chat Search
        </button>
        <button
            onClick={() => setMode('profanity')}
            className={`px-4 py-2 rounded ${
                mode === 'profanity' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700'}`}>
            비속어 관리
        </button>
    </div>
);

export default ModeToggle;
