import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import useReactivationStore from '../../stores/useReactivationStore';
import instance from '../../api/axiosInstance';

const ReactivationModal = () => {
    const navigate = useNavigate();
    const { setUser } = useAuthStore();
    const { isReactivationNeeded, reactivationUser, socialLoginData, clearReactivation } = useReactivationStore();

    const handleReactivate = async () => {
        try {
            const response = await instance.post('/api/user/reactivate', { userId: reactivationUser._id });
            if (response.data.success) {
                setUser(response.data.user);
                alert('계정이 성공적으로 복구되었습니다.');
            }
        } catch (err) {
            console.error('계정 재활성화 에러:', err);
            alert(err.response?.data?.message || '계정 복구에 실패했습니다.');
        } finally {
            clearReactivation();
        }
    };

    const handleStartNew = async () => {
        try {
            // 1. Archive the old account and get deactivationCount
            const archiveRes = await instance.post('/api/user/archive-and-prepare-new', { userId: reactivationUser._id });
            const deactivationCount = archiveRes.data.deactivationCount || 0;

            // 2. Set social data and deactivationCount in session for the new signup
            if (socialLoginData) {
                const provider = socialLoginData.kakaoId ? 'kakao' : 'naver';
                await instance.post('/api/auth/set-social-session', { 
                    socialData: socialLoginData, 
                    provider,
                    deactivationCount
                });
            }
            
            // 3. Clear reactivation state and navigate to signup
            clearReactivation();
            navigate('/signupPage');
        } catch (err) {
            console.error('새 계정 시작 에러:', err);
            alert(err.response?.data?.message || '새 계정으로 시작하는 중 오류가 발생했습니다.');
            clearReactivation();
        }
    };

    if (!isReactivationNeeded || !reactivationUser) {
        return null;
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[2000]">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-4">계정 복구</h2>
                <p className="text-center text-gray-600 mb-6">이전에 탈퇴한 계정이 있습니다. 어떻게 하시겠습니까?</p>
                
                <div className="bg-gray-100 p-4 rounded-md mb-6">
                    <p className="text-center text-lg font-semibold">{reactivationUser.nickname}</p>
                </div>

                <div className="flex flex-col space-y-4">
                    <button
                        onClick={handleReactivate}
                        className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                    >
                        이 계정으로 복구하기
                    </button>
                    <button
                        onClick={handleStartNew}
                        className="w-full px-6 py-3 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        새 계정으로 시작하기
                    </button>
                </div>
                 <button
                    onClick={clearReactivation}
                    className="w-full mt-4 text-sm text-gray-500 hover:underline"
                >
                    취소
                </button>
            </div>
        </div>
    );
};

export default ReactivationModal;
