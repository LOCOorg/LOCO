// src/components/ProfileButton.jsx
import React, { useState, useEffect } from 'react';
import { getUserInfo } from '../../api/userAPI.js';
import useAuthStore from '../../stores/authStore.js';
import SimpleProfileModal from './SimpleProfileModal.jsx';

const ProfileButton = ({ profile: externalProfile }) => {
    const authUser = useAuthStore((state) => state.user);
    // externalProfile prop이 전달되면 해당 데이터를 사용하고, 그렇지 않으면 내 프로필 정보를 가져옵니다.
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
                style={{
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    cursor: 'pointer'
                }}
            >
                {profile && profile.photo && profile.photo.length > 0 ? (
                    <img
                        src={profile.photo[0]}
                        alt="메인 프로필 사진"
                        style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            objectFit: 'cover'
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            backgroundColor: 'lightgray'
                        }}
                    />
                )}
            </button>
            {isModalOpen && <SimpleProfileModal profile={profile} onClose={handleCloseModal} />}
        </div>
    );
};

export default ProfileButton;
