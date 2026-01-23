import React, { useState } from 'react';
// import { getUserInfo } from '../../api/userAPI.js';
// import { getUserMinimal, getUserFullProfile  } from '../../api/userProfileLightAPI.js';
import { useUserMinimal, useUserFullProfile } from '../../hooks/queries/useUserQueries';
import useAuthStore from '../../stores/authStore.js';
import SimpleProfileModal from './SimpleProfileModal.jsx';
import { FiUser } from 'react-icons/fi';

const ProfileButton = ({ profile: externalProfile, area = '프로필', onModalToggle, anchor, requestId, onAccept, onDecline, modalDisabled = false }) => {
    const authUser = useAuthStore((state) => state.user);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imgError, setImgError] = useState(false);

    // 🆕 사용자 ID 결정
    const userId = externalProfile?._id || externalProfile?.id || authUser?._id;

    // 🆕 최소 프로필 조회 (프로필 사진용)
    const {
        data: minimalProfile,
        isLoading: isMinimalLoading
    } = useUserMinimal(userId, {
        enabled: !!userId && !externalProfile?.profilePhoto,  // profilePhoto 있으면 스킵
        initialData: externalProfile?.profilePhoto ? externalProfile : undefined  // 초기 데이터
    });

    // 🆕 전체 프로필 조회 (모달용, 모달 열릴 때만)
    const {
        data: fullProfile,
        isLoading: isFullLoading,
        refetch: refetchFullProfile
    } = useUserFullProfile(userId, {
        enabled: false  // 수동 호출 (모달 열 때만)
    });

    // ✅ 버튼 표시용 photoUrl
    const photoUrl = minimalProfile?.profilePhoto || externalProfile?.profilePhoto || null;

    /* 모달 열기 - React Query로 전체 프로필 로드 */
    const handleOpenModal = async () => {
        if (modalDisabled) return;
        if (!userId) return;

        setIsModalOpen(true);
        onModalToggle?.(true);

        // 🆕 React Query refetch (캐시가 있으면 즉시 반환, 없으면 fetch)
        await refetchFullProfile();
    };

    /* 모달 닫기 */
    const handleCloseModal = () => {
        setIsModalOpen(false);
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
                        onError={() => setImgError(true)}
                        className="w-12 h-12 rounded-full object-cover"
                    />
                ) : (
                    <FiUser className="w-12 h-12 rounded-full bg-gray-300" />
                )}
            </button>

            {/* 로딩 중 표시 */}
            {isModalOpen && isFullLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1500]">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <p className="text-gray-800">프로필 로딩 중...</p>
                    </div>
                </div>
            )}

            {/* 전체 프로필 로드 완료 시에만 모달 표시 */}
            {isModalOpen && !isFullLoading && fullProfile && (
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
