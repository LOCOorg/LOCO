// src/components/SimpleProfileModal.jsx
import React from 'react';

const SimpleProfileModal = ({ profile, onClose }) => {
    if (!profile) return null;

    // 메인 사진 (맨 위 사진) - profile.photo[0] 사용
    const mainPhoto = profile.photo && profile.photo[0];

    // 나머지 5장 (최대 5장으로 제한)
    const subPhotos = profile.photo ? profile.photo.slice(1, 6) : [];

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
                {/* 닫기 버튼 */}
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

                {/* 메인 사진 영역 */}
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


                {/* 하단에 5개 이미지 (썸네일) */}
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
                        /* 썸네일이 없으면 5칸 회색 박스 표시 */
                        Array.from({ length: 5 }).map((_, idx) => (
                            <div
                                key={idx}
                                style={{
                                    width: '50px',
                                    height: '50px',
                                    backgroundColor: '#eee',
                                    borderRadius: '4px',
                                }}
                            >
                                {/* 빈 썸네일 */}
                            </div>
                        ))
                    )}
                </div>


                {/* 사용자 기본 정보: 닉네임, 롤닉네임, 성별, 별점 */}
                <div style={{ marginBottom: '8px' }}>
                    <strong>닉네임:</strong> {profile.nickname || '닉네임 없음'}<br />
                    <strong>롤 닉네임:</strong> {profile.lolNickname || '미입력'}<br />
                    <strong>성별:</strong> {profile.gender || '미입력'}<br />
                    <strong>별점:</strong> {profile.star || 0}
                </div>

                {/* 자기소개 */}
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

                {/* 친구신청, 신고 버튼 */}
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
                        onClick={() => alert('친구신청 기능은 별도 구현 필요')}
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
                        onClick={() => alert('신고 기능은 별도 구현 필요')}
                    >
                        신고
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SimpleProfileModal;
