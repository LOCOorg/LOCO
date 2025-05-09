// src/components/DeveloperComponent/UserListItem.jsx
import React from "react";

const UserListItem = ({ user, onClick }) => {
    // 소셜에서 가져온 카카오/네이버 성별(raw)
    const kakaoRaw = user.social?.kakao?.gender || "";
    const naverRaw = user.social?.naver?.gender || "";

    // 빈값일 때 대체값
    const kakaoDisplay = kakaoRaw || "-";
    const naverDisplay = naverRaw || "-";

    // 최종 표시할 소셜 성별 문자열
    const socialGenderText = `(K: ${kakaoDisplay}, N: ${naverDisplay})`;

    return (
        <div
            onClick={onClick}
            className="cursor-pointer p-3 border-b border-gray-100 hover:bg-gray-100 transition-colors"
        >
            <p><strong>이름:</strong> {user.name || "-"}</p>
            <p><strong>닉네임:</strong> {user.nickname || "-"}</p>
            <p><strong>전화번호:</strong> {user.phone || "-"}</p>
            <p><strong>생년월일:</strong> {user.birthdate || "-"}</p>
            <p>
                <strong>성별:</strong> {user.gender || "비공개"}{" "}
                <span className="text-gray-500">{socialGenderText}</span>
            </p>
        </div>
    );
};

export default UserListItem;
