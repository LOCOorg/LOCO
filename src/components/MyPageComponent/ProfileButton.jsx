import React, { useState, useEffect } from 'react';
import { getUserInfo } from '../../api/userAPI.js';
import useAuthStore from '../../stores/authStore.js';
import SimpleProfileModal from './SimpleProfileModal.jsx';
import { FiUser } from 'react-icons/fi';

const ProfileButton = ({ profile: externalProfile, area = '프로필', onModalToggle }) => {
    const authUser = useAuthStore((state) => state.user);
    const [profile, setProfile] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imgError, setImgError] = useState(false);

    const photoUrl =
        profile?.profilePhoto ||
        null;


    useEffect(() => {
        // 사용할 사용자 ID 결정
        const userId = externalProfile?._id || authUser?._id;
        if (!userId) return;

        let cancelled = false;
        // 전체 프로필 정보 가져오기
        getUserInfo(userId)
            .then((data) => {
                if (!cancelled) {
                    setProfile(data);
                }
            })
            .catch((err) => {
                console.error('프로필 정보 오류:', err);
            });

        // 컴포넌트 언마운트 혹은 userId 변경 시 이전 요청 무시
        return () => {
            cancelled = true;
        };
    }, [externalProfile, authUser]);

    /* 모달 열기 */
    const handleOpenModal = () => {
        setIsModalOpen(true);
        onModalToggle?.(true);
    }
    /* 모달 닫기 */
    const handleCloseModal = () => {
        setIsModalOpen(false);
        onModalToggle?.(false);  // 부모에게 알림
    };

    return (
        <div>
            <button
                onClick={handleOpenModal}
                className="p-0 bg-transparent border-none cursor-pointer"
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

            {isModalOpen && (
                <SimpleProfileModal profile={profile} onClose={handleCloseModal} area={area} />
            )}
        </div>
    );
};

export default ProfileButton;
