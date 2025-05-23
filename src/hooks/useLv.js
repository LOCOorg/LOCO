// src/hooks/useLv.js
import { useEffect } from 'react';
import authStore from '../stores/authStore';
import { fetchCurrentUser } from '../api/authAPI';

export const useLv = () => {
    const { user, setUser, logout } = authStore();

    useEffect(() => {
        // 앱이 시작될 때 또는 user가 아직 없을 때 현재 사용자 정보 불러오기
        if (user === null) {
            fetchCurrentUser()
                .then(fetchedUser => {
                    if (fetchedUser) {
                        setUser(fetchedUser);
                    }
                })
                .catch(err => {
                    console.error('유저 정보 조회 실패:', err);
                });
        }
    }, [user, setUser]);

    return {
        currentUser: user,
        setUser,
        logout,
    };
};

