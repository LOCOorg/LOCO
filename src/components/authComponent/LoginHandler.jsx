import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginWithKakao } from '../../api/authAPI.js';
import useAuthStore from "../../stores/authStore.js";
import useNotificationStore from "../../stores/notificationStore.js";
import { loadFullUser } from '../../utils/loadFullUser.js';
import useReactivationStore from "../../stores/useReactivationStore.js";
import CommonModal from "../../common/CommonModal.jsx";

const LoginHandler = () => {
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
        if (!code) return;

        // H-08 보안 조치: OAuth state 파라미터 검증 (CSRF 방지)
        const savedState = sessionStorage.getItem('oauth_state');
        sessionStorage.removeItem('oauth_state');
        if (!state || !savedState || state !== savedState) {
            setAlertMessage('로그인 요청이 유효하지 않습니다. 다시 시도해 주세요.');
            setIsAlertOpen(true);
            return;
        }

        (async () => {
            try {
                const data = await loginWithKakao(code);
                if (data.status === 'noUser' || data.status === 'new_registration_required') {
                    // 서버 세션에 소셜 데이터가 저장되므로 바로 이동
                    navigate('/signupPage');
                } else if (data.status === 'success') {
                    await loadFullUser(data.user);
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
                console.error('카카오 로그인 처리 에러:', err);
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
            로그인 처리 중...
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

export default LoginHandler;
