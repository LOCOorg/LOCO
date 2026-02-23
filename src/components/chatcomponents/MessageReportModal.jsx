import { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import useAuthStore from '../../stores/authStore.js';
import CommonModal from '../../common/CommonModal.jsx';

// 신고 사유 카테고리
const REPORT_CATEGORIES = [
    '욕설, 모욕, 명예훼손',
    '성적인 발언',
    '마약관련', 
    '스팸'
];

const MessageReportModal = ({ 
    isOpen, 
    onClose, 
    message, 
    roomType = 'random' // 'random' 또는 'friend'
}) => {
    const { user } = useAuthStore();
    const [selectedCategory, setSelectedCategory] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // 알림 모달 상태
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedCategory) {
            setAlertMessage('신고 사유를 선택해주세요.');
            setIsAlertOpen(true);
            return;
        }

        if (!user || !user._id) {
            setAlertMessage('로그인이 필요합니다.');
            setIsAlertOpen(true);
            return;
        }

        setIsSubmitting(true);
        
        try {
            const reportData = {
                reportErId: user._id,
                reportTitle: `메시지 신고: ${selectedCategory}`,
                reportCategory: selectedCategory,
                reportContants: description.trim() || `메시지 신고: ${selectedCategory}`,
                roomType: roomType
            };

            const response = await axios.post(
                `${import.meta.env.VITE_API_HOST}/api/chat/messages/${message._id}/report`,
                reportData,
                { withCredentials: true }
            );
            
            if (response.data.success) {
                setAlertMessage('신고가 접수되었습니다. 검토 후 조치하겠습니다.');
                setIsAlertOpen(true);
                // 모달 닫기는 확인 버튼 누른 후 처리하거나 여기서 처리
                // 여기서는 alert 확인 후 닫는게 자연스러우므로 상태 유지
            }
        } catch (error) {
            console.error('신고 실패:', error);
            const errorMessage = error.response?.data?.message || '신고 처리 중 오류가 발생했습니다.';
            setAlertMessage(errorMessage);
            setIsAlertOpen(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAlertConfirm = () => {
        setIsAlertOpen(false);
        if (alertMessage === '신고가 접수되었습니다. 검토 후 조치하겠습니다.') {
            handleClose();
        }
    };

    const handleClose = () => {
        setSelectedCategory('');
        setDescription('');
        onClose();
    };

    if (!isOpen || !message) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                {/* 헤더 */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">메시지 신고</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                        disabled={isSubmitting}
                    >
                        ×
                    </button>
                </div>

                {/* 신고 대상 메시지 표시 */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border-l-4 border-red-400">
                    <p className="text-sm text-gray-600 mb-1">
                        <span className="font-semibold">{message.sender?.nickname || '익명'}</span>님의 메시지
                    </p>
                    <p className="text-gray-800 text-sm break-all">
                        "{message.text}"
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* 신고 사유 선택 */}
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            신고 사유를 선택해주세요 <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                            {REPORT_CATEGORIES.map((category) => (
                                <label key={category} className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="reportCategory"
                                        value={category}
                                        checked={selectedCategory === category}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="mr-3 text-blue-600"
                                        disabled={isSubmitting}
                                    />
                                    <span className="text-sm text-gray-700">{category}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 상세 설명 */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            상세 설명 (선택사항)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="신고 사유에 대한 추가 설명을 입력해주세요..."
                            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows="3"
                            maxLength={500}
                            disabled={isSubmitting}
                        />
                        <div className="text-xs text-gray-500 mt-1 text-right">
                            {description.length}/500
                        </div>
                    </div>

                    {/* 버튼 */}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                            disabled={isSubmitting}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting || !selectedCategory}
                        >
                            {isSubmitting ? '신고 중...' : '신고하기'}
                        </button>
                    </div>
                </form>
            </div>
            <CommonModal
                isOpen={isAlertOpen}
                onClose={() => setIsAlertOpen(false)}
                title="알림"
                onConfirm={handleAlertConfirm}
                showCancel={false}
            >
                {alertMessage}
            </CommonModal>
        </div>
    );
};

MessageReportModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    message: PropTypes.object,
    roomType: PropTypes.oneOf(['random', 'friend'])
};

export default MessageReportModal;
