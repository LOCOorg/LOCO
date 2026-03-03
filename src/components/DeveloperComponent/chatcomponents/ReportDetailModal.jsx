const ReportDetailModal = ({ isOpen, onClose, reportData }) => {
    if (!isOpen || !reportData) return null;

    const formatDate = (dateString) => {
        if (!dateString) return '알 수 없음';
        return new Date(dateString).toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
                {/* 헤더 */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">신고 상세 정보</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                {/* 신고 정보 */}
                <div className="space-y-4">
                    {/* 신고된 메시지 */}
                    <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
                        <h3 className="font-semibold text-red-800 mb-2">신고된 메시지</h3>
                        <div className="text-sm text-gray-700">
                            <p className="mb-1">
                                <span className="font-medium">발신자:</span> 
                                {reportData.message?.sender?.nickname || '알 수 없음'}
                            </p>
                            <p className="break-all bg-white p-2 rounded border">
                                "{reportData.message?.text || reportData.reportContants}"
                            </p>
                        </div>
                    </div>

                    {/* 신고 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                신고한 사람
                            </label>
                            <div className="p-2 bg-gray-50 rounded border text-sm">
                                {reportData.reporter?.nickname || reportData.reportErNickname || '알 수 없음'}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                신고당한 사람
                            </label>
                            <div className="p-2 bg-gray-50 rounded border text-sm">
                                {reportData.offender?.nickname || reportData.offenderNickname || '알 수 없음'}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                신고 사유
                            </label>
                            <div className="p-2 bg-gray-50 rounded border text-sm">
                                {reportData.reportCategory || '알 수 없음'}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                신고 날짜
                            </label>
                            <div className="p-2 bg-gray-50 rounded border text-sm">
                                {formatDate(reportData.createdAt)}
                            </div>
                        </div>
                    </div>

                    {/* 상세 설명 */}
                    {reportData.reportContants && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                상세 설명
                            </label>
                            <div className="p-3 bg-gray-50 rounded border text-sm break-all">
                                {reportData.reportContants}
                            </div>
                        </div>
                    )}

                    {/* 처리 상태 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            처리 상태
                        </label>
                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            reportData.reportStatus === 'resolved' 
                                ? 'bg-green-100 text-green-800' 
                                : reportData.reportStatus === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}>
                            {reportData.reportStatus === 'resolved' && '처리완료'}
                            {reportData.reportStatus === 'rejected' && '기각됨'}
                            {reportData.reportStatus === 'pending' && '처리 대기중'}
                            {!reportData.reportStatus && '알 수 없음'}
                        </div>
                    </div>

                    {/* 채팅방 정보 */}
                    {reportData.anchor && (
                        <div className="pt-4 border-t">
                            <h4 className="font-medium text-gray-700 mb-2">채팅방 정보</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-gray-600">방 ID:</span> 
                                    <span className="ml-2 font-mono text-xs">{reportData.anchor.roomId}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">메시지 ID:</span> 
                                    <span className="ml-2 font-mono text-xs">{reportData.anchor.targetId}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 닫기 버튼 */}
                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportDetailModal;
