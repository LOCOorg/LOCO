// src/components/DeveloperComponent/NicknameHistoryList.jsx
import React, { useState, useEffect } from 'react';
import instance from '../../api/axiosInstance';

const NicknameHistoryList = ({ userId, className = "" }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) return;

        const fetchHistory = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await instance.get(`/api/user/${userId}/nickname-history`);
                setHistory(response.data.data || []);
            } catch (err) {
                console.error('닉네임 히스토리 조회 실패:', err);
                setError('닉네임 히스토리를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [userId]);

    const getReasonText = (reason) => {
        const reasonMap = {
            signup: '회원가입',
            user_change: '사용자 변경',
            admin_change: '관리자 변경',
            auto_change: '시스템 자동 변경'
        };
        return reasonMap[reason] || reason;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className={`${className} flex items-center justify-center p-8`}>
                <div className="text-gray-500">닉네임 히스토리를 불러오는 중...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${className} flex items-center justify-center p-8`}>
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className={className}>
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800">닉네임 변경 히스토리</h3>
                <p className="text-sm text-gray-600">총 {history.length}건의 변경 기록</p>
            </div>
            
            {history.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    닉네임 변경 기록이 없습니다.
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map((item, index) => (
                        <div 
                            key={item._id || index} 
                            className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                        {item.oldNickname ? (
                                            <>
                                                <span className="text-red-600 font-medium">
                                                    {item.oldNickname}
                                                </span>
                                                <span className="text-gray-400">→</span>
                                                <span className="text-green-600 font-medium">
                                                    {item.newNickname}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-blue-600 font-medium">
                                                최초 설정: {item.newNickname}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <div>변경 사유: {getReasonText(item.changeReason)}</div>
                                        <div>변경 시간: {formatDate(item.createdAt)}</div>
                                        {item.changedBy?.nickname && (
                                            <div>변경자: {item.changedBy.nickname}</div>
                                        )}
                                        {item.ipAddress && (
                                            <div>IP 주소: {item.ipAddress}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400">
                                    #{index + 1}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NicknameHistoryList;
