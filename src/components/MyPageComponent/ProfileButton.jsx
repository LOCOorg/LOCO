import React, { useState, useEffect } from 'react';
// import { getUserInfo } from '../../api/userAPI.js';
import { getUserMinimal, getUserFullProfile  } from '../../api/userProfileLightAPI.js';
import useAuthStore from '../../stores/authStore.js';
import SimpleProfileModal from './SimpleProfileModal.jsx';
import { FiUser } from 'react-icons/fi';

const ProfileButton = ({ profile: externalProfile, area = '프로필', onModalToggle, anchor, requestId, onAccept, onDecline, modalDisabled = false }) => {
    const authUser = useAuthStore((state) => state.user);
    const [minimalProfile, setMinimalProfile] = useState(null);
    const [fullProfile, setFullProfile] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);




    // ✅ 초기 로드: externalProfile에 profilePhoto 없으면 getUserMinimal 호출
    useEffect(() => {
        const userId = externalProfile?._id || externalProfile?.id || authUser?._id;
        if (!userId) return;

        // ✅ externalProfile에 이미 profilePhoto가 있으면 API 호출 생략
        if (externalProfile?.profilePhoto) {
            setMinimalProfile(externalProfile);
            return;
        }

        // ✅ profilePhoto가 없으면 getUserMinimal 호출 (3개 필드)
        let cancelled = false;
        getUserMinimal(userId)
            .then((data) => {
                if (!cancelled) {
                    setMinimalProfile(data);
                }
            })
            .catch((err) => {
                console.error('최소 프로필 정보 오류:', err);
            });

        return () => {
            cancelled = true;
        };
    }, [externalProfile, authUser]);

    // ✅ 버튼 표시용 photoUrl
    const photoUrl = minimalProfile?.profilePhoto || externalProfile?.profilePhoto || null;


    /* 모달 열기 - 이때 전체 프로필 로드 */
    const handleOpenModal = async () => {
        if (modalDisabled) return;

        const userId = externalProfile?._id || externalProfile?.id || authUser?._id;
        if (!userId) return;

        setIsModalOpen(true);
        setIsLoadingProfile(true);
        onModalToggle?.(true);

        try {
            // ✅ 모달용 전체 프로필 로드 (8개 필드)
            const data = await getUserFullProfile(userId);
            setFullProfile(data);
        } catch (err) {
            console.error('프로필 모달 정보 로드 실패:', err);
            // 에러 시 minimalProfile 또는 externalProfile 사용 (폴백)
            setFullProfile(minimalProfile || externalProfile);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    /* 모달 닫기 */
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFullProfile(null);  // 메모리 정리
        onModalToggle?.(false);
    };

    return (
        <div>
            <button
                onClick={handleOpenModal}
                className={`p-0 bg-transparent border-none ${modalDisabled ? 'cursor-default' : 'cursor-pointer'}`}
            >
                {photoUrl && !imgError ? (
                    <img
                        src={photoUrl}
                        alt="메인 프로필 사진"
                        onError={() => setImgError(true)}  // 이미지 로드 실패 시 fallback
                        className="w-12 h-12 rounded-full object-cover"
                    />
                ) : (
                    <FiUser  className="w-12 h-12 rounded-full bg-gray-300" />
                )}
            </button>

            {/* 로딩 중 표시 */}
            {isModalOpen && isLoadingProfile && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1500]">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <p className="text-gray-800">프로필 로딩 중...</p>
                    </div>
                </div>
            )}

            {/* 전체 프로필 로드 완료 시에만 모달 표시 */}
            {isModalOpen && !isLoadingProfile && fullProfile && (
                <SimpleProfileModal
                    profile={fullProfile}
                    onClose={handleCloseModal}
                    area={area}
                    anchor={anchor}
                    requestId={requestId}
                    onAccept={onAccept}
                    onDecline={onDecline}
                />
            )}
        </div>
    );
};

export default ProfileButton;
