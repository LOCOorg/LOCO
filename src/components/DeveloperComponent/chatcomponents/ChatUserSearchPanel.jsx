// C:\Users\wjdtj\WebstormProjects\LOCO\src\components\DeveloperComponent\chatcomponents\ChatUserSearchPanel.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import UserListItem from '../UserListItem.jsx';

const ChatUserSearchPanel = ({ selectedUser, setSelectedUser }) => {
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState([]);

    useEffect(() => {
        axios
            .get(`/api/developer/users?query=${encodeURIComponent(query)}`)
            .then(res => setUsers(res.data.results || []))
            .catch(console.error);
    }, [query]);

    return (
        <div className="w-1/3 border-r p-4 overflow-y-auto bg-white">
            <h2 className="text-xl font-semibold mb-2">회원 검색</h2>
            <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="검색어 입력..."
                className="w-full mb-4 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            {users.length > 0 ? (
                users.map(u => (
                    <div
                        key={u._id}
                        onClick={() => setSelectedUser(u)}
                        className={`p-2 mb-1 rounded cursor-pointer ${
                            selectedUser?._id === u._id
                                ? 'bg-blue-100'
                                : 'hover:bg-gray-100'
                        }`}
                    >
                        <UserListItem user={u} />
                    </div>
                ))
            ) : (
                <p className="text-gray-500">결과가 없습니다</p>
            )}
        </div>
    );
};

export default ChatUserSearchPanel;
