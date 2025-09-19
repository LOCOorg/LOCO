// src/components/DeveloperComponent/UserListItem.jsx - 법적 안전성 향상 버전
// 출생년도 대신 연령대 표시, 가명처리된 이름 사용
import React from "react";

const UserListItem = ({ user, onClick }) => {
    // 🔥 이제 백엔드에서 깔끔하게 정리된 데이터가 오므로 직접 사용
    const displayName = user.displayName || user.name || "-";
    const displayPhone = user.phone || "-";
    const displayAgeGroup = user.displayAgeGroup || "-"; // 출생년도 대신 연령대 표시
    
    // 소셜 성별 정보
    const kakaoGender = user.social?.kakao?.gender || "-";
    const naverGender = user.social?.naver?.gender || "-";
    const socialGenderText = `(K: ${kakaoGender}, N: ${naverGender})`;

    // 🔥 성능 지표 표시
    const isFromCache = user._fromCache;
    const encryptionEnabled = user._debug?.encryptionEnabled;
    const decryptionFailed = user._debug?.decryptionFailed;

    return (
        <div
            onClick={onClick}
            className="cursor-pointer p-3 border-b border-gray-100 hover:bg-gray-100 transition-colors"
        >
            {/* 성능 및 상태 표시 */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                    {isFromCache && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            ⚡ 캐시
                        </span>
                    )}
                    {encryptionEnabled && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            🔐 암호화
                        </span>
                    )}
                    {decryptionFailed && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            ⚠️ 복호화실패
                        </span>
                    )}
                </div>
            </div>

            {/* 기본 사용자 정보 */}
            <div className="space-y-1">
                <div className="flex justify-between items-start">
                    <p><strong>이름:</strong> 
                        <span className={`ml-1 ${displayName === '정보없음' ? 'text-red-500' : 'text-green-600'}`}>
                            {displayName}
                        </span>
                    </p>
                    <span className="text-xs text-gray-400">
                        ID: {user._id.slice(-6)}
                    </span>
                </div>
                
                <p><strong>닉네임:</strong> 
                    <span className="ml-1 text-blue-600">{user.nickname || "-"}</span>
                    {user.status === 'deactivated' && (
                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            탈퇴
                        </span>
                    )}
                </p>
                
                {/* 연령대 표시 (닉네임처럼 깔끔하게) */}
                {displayAgeGroup && displayAgeGroup !== '-' && displayAgeGroup !== '정보없음' && (
                    <p><strong>연령대:</strong>
                        <span className="ml-1 text-purple-600">
                            {displayAgeGroup} {user.isMinor !== null && (user.isMinor ? '(미성년자)' : '(성인)')}
                        </span>
                    </p>
                )}
                
                <p><strong>전화번호:</strong> 
                    <span className={`ml-1 ${displayPhone === '정보없음' ? 'text-red-500' : 'text-green-600'}`}>
                        {displayPhone}
                    </span>
                </p>
                
                <p><strong>성별:</strong> 
                    <span className="ml-1">{user.gender || "비공개"}</span>
                    <span className="text-gray-500 text-sm ml-2">{socialGenderText}</span>
                </p>

                {/* 추가 정보 */}
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                    <span>⭐ {user.star || 0}</span>
                    <span>💰 {user.coinLeft || 0}</span>
                    <span>📊 Lv.{user.userLv || 0}</span>
                    {user.numOfReport > 0 && (
                        <span className="text-red-600">
                            🚨 신고 {user.numOfReport}회
                        </span>
                    )}
                    {user.deactivationCount > 0 && (
                        <span className="text-gray-500">
                            🚪 탈퇴 {user.deactivationCount}회
                        </span>
                    )}
                </div>

                {/* 플랜 정보 */}
                {user.plan?.planType && (
                    <div className="text-xs text-indigo-600 mt-1">
                        📋 플랜: {user.plan.planType}
                    </div>
                )}
            </div>

            {/* 개발 모드에서만 디버깅 정보 표시 */}
            {process.env.NODE_ENV === 'development' && user._debug && (
                <div className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-200">
                    <div>🔧 Debug Info:</div>
                    <div>암호화: {user._debug.encryptionEnabled ? '✅' : '❌'}</div>
                    <div>복호화 실패: {user._debug.decryptionFailed ? '❌' : '✅'}</div>
                    <div>원본명: {user._debug.hasOriginalName ? '있음' : '없음'}</div>
                    <div>가명처리: {user._debug.pseudonymized || '없음'}</div>
                    <div>연령대: {user._debug.ageGroup || '정보없음'}</div>
                    {user._debug.calculatedAge && (
                        <div>만나이: {user._debug.calculatedAge}세 ({user._debug.isMinor ? '미성년자' : '성인'})</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserListItem;