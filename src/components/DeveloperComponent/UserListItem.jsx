// File: /src/components/DeveloperComponent/UserListItem.jsx
// 이 컴포넌트는 검색 결과 목록의 각 유저 항목을 렌더링하며, 클릭 시 해당 유저의 상세 정보를 표시합니다.
import React from "react";

const UserListItem = ({ user, onClick }) => {
    return (
        <div
            onClick={onClick}
            className="cursor-pointer p-3 border-b border-gray-100 hover:bg-gray-100 transition-colors"
        >
            <strong>{user.name}</strong><br />
            <span>Nickname: {user.nickname}</span><br />
            <span>Phone: {user.phone}</span><br />
            <span>Gender: {user.gender}</span>
        </div>
    );
};

export default UserListItem;
