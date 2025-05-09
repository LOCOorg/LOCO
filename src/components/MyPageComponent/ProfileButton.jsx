import React, { useState, useEffect } from 'react';
import { getUserInfo } from '../../api/userAPI.js';
import useAuthStore from '../../stores/authStore.js';
import SimpleProfileModal from './SimpleProfileModal.jsx';

const ProfileButton = ({ profile: externalProfile }) => {
    const authUser = useAuthStore((state) => state.user);
    const [profile, setProfile] = useState(externalProfile || null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (externalProfile) {
            setProfile(externalProfile);
        } else if (authUser && !externalProfile) {
            getUserInfo(authUser._id)
                .then((data) => setProfile(data))
                .catch((err) => console.error('프로필 정보 오류:', err));
        }
    }, [authUser, externalProfile]);

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    return (
        <div>
            <button
                onClick={handleOpenModal}
                className="p-0 bg-transparent border-none cursor-pointer"
            >
                {profile?.photo?.length > 0 ? (
                    <img
                        src={profile.photo[0]}
                        alt="메인 프로필 사진"
                        className="w-12 h-12 rounded-full object-cover"
                    />
                ) : (
                    <div
                        className="w-12 h-12 rounded-full bg-gray-300"
                    />
                )}
            </button>

            {isModalOpen && (
                <SimpleProfileModal profile={profile} onClose={handleCloseModal} />
            )}
        </div>
    );
};

export default ProfileButton;
