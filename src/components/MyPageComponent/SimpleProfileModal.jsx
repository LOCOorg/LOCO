import React, { useState } from 'react';
import ReportForm from '../reportcomponents/ReportForm.jsx';
import useAuthStore from '../../stores/authStore';
import { sendFriendRequest } from "../../api/userAPI.js";
import CommonModal from '../../common/CommonModal.jsx';

const SimpleProfileModal = ({ profile, onClose }) => {
    const authUser = useAuthStore((state) => state.user);
    const [isReportModalVisible, setIsReportModalVisible] = useState(false);
    // alert 모달 상태 추가
    const [alertModalOpen, setAlertModalOpen] = useState(false);
    const [alertModalMessage, setAlertModalMessage] = useState("");

    if (!profile) return null;

    const mainPhoto = profile.photo && profile.photo[0];
    const subPhotos = profile.photo ? profile.photo.slice(1, 6) : [];

    const handleFriendRequest = async () => {
        if (!authUser || !profile) return;
        try {
            await sendFriendRequest(authUser._id, profile._id);
            // alert("친구 요청을 보냈습니다."); 대신
            setAlertModalMessage("친구 요청을 보냈습니다.");
            setAlertModalOpen(true);
        } catch (error) {
            console.error("친구 요청 보내기 실패:", error);
            // alert("친구 요청 전송에 실패했습니다."); 대신
            setAlertModalMessage("친구 요청 전송에 실패했습니다.");
            setAlertModalOpen(true);
        }
    };

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'relative',
                    background: 'white',
                    width: '400px',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'transparent',
                        border: 'none',
                        fontSize: '20px',
                        color: 'gray',
                        cursor: 'pointer',
                    }}
                >
                    ×
                </button>
                <div style={{ width: '100%', height: '200px', marginBottom: '10px' }}>
                    {mainPhoto ? (
                        <img
                            src={mainPhoto}
                            alt="메인 프로필"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '8px',
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '8px',
                                backgroundColor: '#ccc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#666',
                            }}
                        >
                            사진
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                    {subPhotos.length > 0 ? (
                        subPhotos.map((photoUrl, idx) => (
                            <div
                                key={idx}
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    backgroundColor: '#eee',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                }}
                            >
                                <img
                                    src={photoUrl}
                                    alt={`프로필 추가 사진 ${idx + 1}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                        ))
                    ) : (
                        Array.from({ length: 5 }).map((_, idx) => (
                            <div
                                key={idx}
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    backgroundColor: '#eee',
                                    borderRadius: '4px',
                                }}
                            ></div>
                        ))
                    )}
                </div>
                <div style={{ marginBottom: '8px' }}>
                    <strong>닉네임:</strong> {profile.nickname || '닉네임 없음'}
                    <br />
                    <strong>롤 닉네임:</strong> {profile.lolNickname || '미입력'}
                    <br />
                    <strong>성별:</strong> {profile.gender || '미입력'}
                    <br />
                    <strong>별점:</strong> {profile.star || 0}
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <strong>자기소개</strong>
                    <div
                        style={{
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            padding: '8px',
                            minHeight: '60px',
                            marginTop: '4px',
                            whiteSpace: 'pre-wrap',
                        }}
                    >
                        {profile.info || '자기소개가 없습니다.'}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                        style={{
                            flex: '1',
                            backgroundColor: '#4caf50',
                            color: 'white',
                            border: 'none',
                            padding: '10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                        onClick={handleFriendRequest}
                    >
                        친구신청
                    </button>
                    <button
                        style={{
                            flex: '1',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            padding: '10px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                        onClick={() => setIsReportModalVisible(true)}
                    >
                        신고
                    </button>
                </div>
                {isReportModalVisible && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2000,
                        }}
                    >
                        <div
                            style={{
                                position: 'relative',
                                background: 'white',
                                padding: '20px',
                                borderRadius: '8px',
                                boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                                width: 'auto',
                                maxWidth: '90%',
                            }}
                        >
                            <button
                                onClick={() => setIsReportModalVisible(false)}
                                style={{
                                    position: 'absolute',
                                    top: '10px',
                                    left: '10px',
                                    background: 'transparent',
                                    border: 'none',
                                    fontSize: '16px',
                                    color: 'gray',
                                    cursor: 'pointer',
                                }}
                            >
                                ← 뒤로가기
                            </button>
                            <ReportForm
                                onClose={() => setIsReportModalVisible(false)}
                                reportedUser={profile}
                                onReportCreated={() => {}}
                            />
                        </div>
                    </div>
                )}
                {/* alert 대신 CommonModal 사용 */}
                {alertModalOpen && (
                    <CommonModal
                        isOpen={alertModalOpen}
                        onClose={() => setAlertModalOpen(false)}
                        title="알림"
                        onConfirm={() => setAlertModalOpen(false)}
                        showCancel={false}
                    >
                        {alertModalMessage}
                    </CommonModal>
                )}
            </div>
        </div>
    );
};

export default SimpleProfileModal;
