import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import CommonModal from '../../common/CommonModal';
import instance from '../../api/axiosInstance';

const UserLeaveComponent = () => {
    const [isChecked, setIsChecked] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { logout } = useAuthStore();

    const handleDeactivate = async () => {
        setIsModalOpen(false);
        try {
            await instance.post('/api/user/deactivate');
            logout();
            alert('회원 탈퇴가 처리되었습니다.');
            window.location.href = '/'
        } catch (err) {
            setError(err.response?.data?.message || '회원 탈퇴 중 오류가 발생했습니다.');
        }
    };

    const openModal = () => {
        if (isChecked) {
            setIsModalOpen(true);
        } else {
            setError('안내 사항을 확인하고 동의해주세요.');
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-8 mt-10 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">회원 탈퇴</h1>
            
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
                <h2 className="text-lg font-semibold text-gray-700">회원 탈퇴 전 유의사항</h2>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>탈퇴 후 7일 동안은 동일한 계정으로 재가입하거나 로그인할 수 없습니다.</li>
                    <li>회원님의 개인정보 및 서비스 이용 기록은 관련 법령 및 개인정보처리방침에 따라 처리됩니다.</li>
                    <li>소셜 로그인 정보는 삭제되지 않으며, LOCO 서비스와 관련된 정보만 비활성화됩니다.</li>
                    <li>탈퇴 후에는 작성하신 게시물이나 댓글 등을 직접 삭제할 수 없습니다.</li>
                </ul>
            </div>

            <div className="mt-6">
                <label className="flex items-center">
                    <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => setIsChecked(!isChecked)} 
                        className="h-5 w-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="ml-3 text-gray-700">위 내용을 모두 확인했으며, 회원 탈퇴에 동의합니다.</span>
                </label>
            </div>

            <div className="mt-8 text-center">
                <button 
                    onClick={openModal} 
                    disabled={!isChecked}
                    className="w-full px-6 py-3 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    회원 탈퇴
                </button>
            </div>

            <CommonModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleDeactivate}
                title="회원 탈퇴 확인"
            >
                <p>정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            </CommonModal>
        </div>
    );
};

export default UserLeaveComponent;