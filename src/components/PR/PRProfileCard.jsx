// src/components/pr/PRProfileCard.jsx
import React from "react";

const DEFAULT_PROFILE_IMAGE = import.meta.env.VITE_DEFAULT_PROFILE_IMAGE;

const PRProfileCard = ({ user }) => {
    // 프로필 이미지 URL (없으면 기본 이미지)
    const photoUrl = user.profilePhoto || DEFAULT_PROFILE_IMAGE;

    // 별점을 정수로 반올림, 없으면 0으로 표시
    const rating =
        typeof user.star === "number" && !isNaN(user.star)
            ? Math.round(user.star)
            : 0;

    return (
        <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition p-4">
            <div className="relative mb-4">
                <img
                    src={photoUrl}
                    alt={user.nickname || "프로필"}
                    className="w-full h-48 object-cover rounded-xl"
                />
                {user.isOnline && (
                    <span className="absolute top-2 left-2 bg-green-400 text-white text-xs px-2 py-0.5 rounded-full">
            온라인
          </span>
                )}
            </div>

            <div className="space-y-1 text-center">
                <h3 className="text-lg font-semibold text-gray-800">
                    {user.nickname || "Unnamed"}
                </h3>

                <div className="flex justify-center items-center space-x-3 text-sm text-gray-600">
          <span className="flex items-center">
            {/* 별 아이콘 */}
              <svg
                  className="w-4 h-4 text-yellow-400 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
              >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.966a1 1 0 00.95.69h4.17c.969 0
              1.371 1.24.588 1.81l-3.376 2.455a1 1 0 00-.364
              1.118l1.286 3.966c.3.921-.755
              1.688-1.54 1.118L10 13.347l-3.376
              2.455c-.784.57-1.838-.197-1.54-1.118l1.286-3.966a1
              1 0 00-.364-1.118L2.63
              9.393c-.783-.57-.38-1.81.588-1.81h4.17a1
              1 0 00.95-.69l1.286-3.966z" />
            </svg>
              {rating}
          </span>
                    <span className="italic">{user.gender || "비공개"}</span>
                </div>
            </div>
        </div>
    );
};

export default PRProfileCard;
