import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loginWithNaver } from '../../api/authAPI.js';
import useAuthStore from "../../stores/authStore.js";
import useNotificationStore from "../../stores/notificationStore.js";
import useReactivationStore from '../../stores/useReactivationStore.js';
import CommonModal from "../../common/CommonModal.jsx";

const NaverLoginHandler = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    const { setUser } = useAuthStore();
    const { syncWithUserPrefs } = useNotificationStore();
    const { triggerReactivation } = useReactivationStore();

    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");

    useEffect(() => {
        if (!(code && state)) return;
        (async () => {
            try {
                const data = await loginWithNaver(code, state);
                if (data.status === 'noUser' || data.status === 'new_registration_required') {
                    navigate('/signupPage');
                } else if (data.status === 'success') {
                    setUser(data.user);
                    await syncWithUserPrefs({
                        friendReqEnabled: data.user.friendReqEnabled ?? true,
                        chatPreviewEnabled: data.user.chatPreviewEnabled ?? true,
                        wordFilterEnabled: data.user.wordFilterEnabled ?? true,
                    });
                    navigate('/');
                } else if (data.status === 'reactivation_possible') {
                    triggerReactivation(data.user, data.socialData);
                    navigate('/');
                }
            } catch (err) {
                console.error('네이버 로그인 처리 에러:', err);
                setAlertMessage(err.response?.data?.message || err.message);
                setIsAlertOpen(true);
            }
        })();
    }, [code, state, navigate, setUser, syncWithUserPrefs, triggerReactivation]);

    const handleAlertClose = () => {
        setIsAlertOpen(false);
        navigate('/');
    };

    return (
        <div>
            네이버 로그인 처리 중...
            <CommonModal
                isOpen={isAlertOpen}
                onClose={handleAlertClose}
                title="알림"
                onConfirm={handleAlertClose}
                showCancel={false}
            >
                {alertMessage}
            </CommonModal>
        </div>
    );
};

export default NaverLoginHandler;