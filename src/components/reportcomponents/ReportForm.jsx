import { useState, useEffect } from 'react';
import { createReport } from '../../api/reportAPI.js';
import { getUserByNickname } from '../../api/userAPI.js';
import useAuthStore from '../../stores/authStore.js';
import CommonModal from '../../common/CommonModal.jsx';


const ReportForm = ({ onReportCreated, onClose, reportedUser, defaultArea = '프로필', anchor }) => {
    // authStore에서 로그인한 사용자 정보 가져오기
    const { user } = useAuthStore();

    // 초기 신고 상태: 신고자 ID는 로그인한 사용자, 가해자는 reportedUser가 있을 경우 기본값 설정
    const [newReport, setNewReport] = useState({
        reportTitle: '',
        reportArea: defaultArea,
        reportCategory: '욕설, 모욕, 혐오발언',
        reportContants: '',
        offenderNickname: reportedUser ? (reportedUser.nickname || reportedUser.name || '') : '',
        reportErId: user ? user._id : ''
    });
    const [error, setError] = useState(null);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [createdReport, setCreatedReport] = useState(null);

    // 로그인 정보가 바뀔 때마다 reportErId 업데이트
    useEffect(() => {
        if (user) {
            setNewReport(prev => ({ ...prev, reportErId: user._id }));
        }
    }, [user]);

    useEffect(() => {
        setNewReport(prev => ({ ...prev, reportArea: defaultArea }));
    }, [defaultArea]);

    // reportedUser prop이 변경되면 offenderNickname 필드를 업데이트
    useEffect(() => {
        if (reportedUser) {
            setNewReport(prev => ({
                ...prev,
                offenderNickname: reportedUser.nickname || reportedUser.name || ''
            }));
        }
    }, [reportedUser]);

    // 입력 값 변경 시 상태 업데이트
    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewReport(prev => ({ ...prev, [name]: value }));
    };

    // 신고 생성 폼 제출 시 API 호출
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let offenderId = reportedUser?._id;

            // 만약 reportedUser._id가 없다면 (드문 경우지만) 기존처럼 닉네임으로 조회 시도
            if (!offenderId && newReport.offenderNickname) {
                const offenderUser = await getUserByNickname(newReport.offenderNickname);
                if (!offenderUser || !offenderUser._id) {
                    throw new Error("해당 별칭을 가진 사용자를 찾을 수 없습니다.");
                }
                offenderId = offenderUser._id;
            }

            if (!offenderId) {
                throw new Error("가해자 정보를 확인할 수 없습니다.");
            }

            // 신고 데이터에 offenderId를 할당 (offenderNickname은 전송하지 않음)
            const reportData = {
                reportTitle: newReport.reportTitle,
                reportArea: newReport.reportArea,
                reportCategory: newReport.reportCategory,
                reportContants: newReport.reportContants,
                reportErId: newReport.reportErId,
                offenderId: offenderId,
                ...(anchor ? { anchor } : {})                // 🔑 있을 때만 포함
            };

            const created = await createReport(reportData);
            setCreatedReport(created);
            setError(null);
            // 폼 초기화 (신고자 ID는 다시 authStore의 값으로 설정하고, reportedUser가 있다면 해당 별칭으로 재설정)
            setNewReport({
                reportTitle: '',
                reportArea: '프로필',
                reportCategory: '욕설, 모욕, 혐오발언',
                reportContants: '',
                offenderNickname: reportedUser ? (reportedUser.nickname || reportedUser.name || '') : '',
                reportErId: user ? user._id : ''
            });
            // 신고 완료 모달 표시
            setShowCompleteModal(true);
        } catch (err) {
            console.error('Report submission error:', err);
            
            const status = err.response?.status;
            const backendMessage = err.response?.data?.message;
            
            let errorMessage = '';

            if (status === 401 || err.message?.includes('401')) {
                errorMessage = '로그인이 필요한 서비스입니다. 로그인 후 다시 시도해주세요.';
            } else if (status === 400 || err.message?.includes('400')) {
                errorMessage = backendMessage || '잘못된 요청입니다. 입력 내용을 확인해주세요.';
            } else {
                errorMessage = backendMessage || err.message || '신고 제출 중 오류가 발생했습니다.';
            }
            
            setError(errorMessage);
        }
    };

    // 신고 완료 모달에서 "확인" 클릭 시 호출되는 함수
    const handleConfirmComplete = () => {
        setShowCompleteModal(false);
        if (onReportCreated) {
            onReportCreated(createdReport);
        }
        onClose();
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-center text-black">신고 생성</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">신고 제목</label>
                    <input
                        type="text"
                        name="reportTitle"
                        value={newReport.reportTitle}
                        onChange={handleChange}
                        required
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">신고 구역</label>
                    <select
                        name="reportArea"
                        value={newReport.reportArea}
                        disabled
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-black-700"
                    >
                        <option value="프로필">프로필</option>
                        <option value="커뮤니티">커뮤니티</option>
                    </select>
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">신고 카테고리(선택)▼</label>
                    <select
                        name="reportCategory"
                        value={newReport.reportCategory}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                    >
                        <option value="욕설, 모욕, 혐오발언">욕설, 모욕, 혐오발언</option>
                        <option value="스팸, 도배, 거짓정보">스팸, 도배, 거짓정보</option>
                        <option value="부적절한 메세지(성인/도박/마약 등)">부적절한 메세지(성인/도박/마약 등)</option>
                        <option value="부적절한 닉네임 / 모욕성 닉네임">부적절한 닉네임 / 모욕성 닉네임</option>
                        <option value="부적절한 프로필 이미지 / 음란물 (이미지)">부적절한 프로필 이미지 / 음란물 (이미지)</option>
                    </select>
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">신고 내용</label>
                    <textarea
                        name="reportContants"
                        value={newReport.reportContants}
                        onChange={handleChange}
                        required
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                    ></textarea>
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">가해자</label>
                    <div className="shadow appearance-none border rounded w-full py-2 px-3
                  bg-gray-100 text-gray-700">
                        {newReport.offenderNickname}
                    </div>
                </div>
                {/* 로그인한 사용자의 정보 표시 (신고자 정보는 자동 적용) */}
                {user && (
                    <div className="mb-4">
                        <p className="text-gray-700 text-sm">
                            신고자: <span className="font-bold">{user.nickname || user.email}</span>
                        </p>
                    </div>
                )}
                <div className="flex justify-center">
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        신고 제출
                    </button>
                </div>
            </form>

            {showCompleteModal && (
                <CommonModal
                    isOpen={showCompleteModal}
                    onClose={() => setShowCompleteModal(false)}
                    onConfirm={handleConfirmComplete}
                    title="신고 완료"
                    showCancel={false}
                >
                    <p>신고가 성공적으로 등록되었습니다.</p>
                </CommonModal>
            )}
        </div>
    );
};

export default ReportForm;
