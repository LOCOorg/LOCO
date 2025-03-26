import { useEffect } from 'react';
import { fetchCurrentUser } from '../../api/authAPI.js';
import useAuthStore from '../../stores/authStore.js';

const AuthInit = () => {
    const setUser = useAuthStore((state) => state.setUser);

    useEffect(() => {
        const initAuth = async () => {
            const currentUser = await fetchCurrentUser(); // /api/auth/me 호출
            if (currentUser) {
                setUser(currentUser);
            }
        };
        initAuth();
    }, [setUser]);

    return null;
};

export default AuthInit;
