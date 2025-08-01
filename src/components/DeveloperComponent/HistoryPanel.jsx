// 유저 검색모드에서 마지막 패널
// src/components/DeveloperComponent/HistoryPanel.jsx
import React from "react";
import UserFriendList from "./UserFriendList.jsx";
import PhotoGallery  from "./PhotoGallery";



export default function HistoryPanel({ user, view, className = "" }) {
    if (!user) {
        return (
            <div className={className + " bg-white p-4"}>
                사용자를 선택해주세요
            </div>
        );
    }

    // view에 따라 렌더링할 컴포넌트를 매핑
    const viewComponents = {
        friends: UserFriendList,
        photos:  PhotoGallery,
    };

    const Selected = viewComponents[view];
    if (!Selected) {
        return (
            <div className={className + " bg-white p-4"}>
                준비되지 않은 보기 모드입니다.
            </div>
        );
    }

    return (
        <div className={className + " bg-white p-4 overflow-y-auto"}>
            <Selected
                userId={user._id}
                className="w-full h-full"
            />
        </div>
    );
};