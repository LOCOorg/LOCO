import { useState, useEffect } from 'react';
import { fetchReports, deleteReport } from '../../api/reportAPI.js';
import ReportForm from './ReportForm';
import ReportDetailModal from './ReportDetailModal';
import CommonModal from '../../common/CommonModal.jsx';

const ReportListComponent = () => {
    const [pageData, setPageData] = useState(null);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [reportToDelete, setReportToDelete] = useState(null);
    const pageSize = 5;

    // 신고 목록 불러오기
    const loadReports = async (page) => {
        try {
            const data = await fetchReports(page, pageSize);
            setPageData(data);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        loadReports(currentPage);
    }, [currentPage]);

    // 삭제 버튼 클릭 시 삭제 모달을 띄우도록 함
    const handleDeleteClick = (id) => {
        setReportToDelete(id);
        setShowDeleteModal(true);
    };

    // 모달의 확인 버튼 클릭 시 실제 삭제 수행
    const confirmDelete = async () => {
        try {
            await deleteReport(reportToDelete);
            loadReports(currentPage);
            setShowDeleteModal(false);
            setReportToDelete(null);
        } catch (err) {
            setError(err.message);
            setShowDeleteModal(false);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleOpenCreateModal = () => setShowCreateModal(true);
    const handleCloseCreateModal = () => setShowCreateModal(false);
    const handleReportCreated = (createdReport) => {
        setCurrentPage(1);
        loadReports(1);
        setShowCreateModal(false);
    };

    const handleOpenDetail = (report) => setSelectedReport(report);
    const handleCloseDetail = () => setSelectedReport(null);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">신고 목록</h2>
                <button
                    onClick={handleOpenCreateModal}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    신고 작성
                </button>
            </div>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {pageData && (
                <>
                    <ul>
                        {pageData.dtoList.map((report) => (
                            <li key={report._id} className="bg-white shadow rounded mb-4 p-4">
                                <h3 className="text-xl font-bold mb-2">{report.reportTitle}</h3>
                                <p className="mb-1">
                                    <span className="font-semibold">구역:</span> {report.reportArea}
                                </p>
                                <p className="mb-1">
                                    <span className="font-semibold">카테고리:</span> {report.reportCategory}
                                </p>
                                <p className="mb-1">
                                    <span className="font-semibold">내용:</span> {report.reportContants}
                                </p>
                                <p className="mb-1">
                                    <span className="font-semibold">신고일:</span> {new Date(report.reportDate).toLocaleString()}
                                </p>
                                <p className="mb-1">
                                    <span className="font-semibold">신고자:</span> {report.reportErId?.nickname || report.reportErId}
                                </p>
                                <p className="mb-1">
                                    <span className="font-semibold">가해자:</span> {report.offenderId?.nickname || report.offenderId}
                                </p>
                                <div className="flex justify-end space-x-2 mt-2">
                                    <button
                                        onClick={() => handleOpenDetail(report)}
                                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded"
                                    >
                                        상세 보기
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(report._id)}
                                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded"
                                    >
                                        삭제
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="flex justify-center mt-4 space-x-2">
                        {pageData.prev && (
                            <button
                                onClick={() => handlePageChange(pageData.prevPage)}
                                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Prev
                            </button>
                        )}
                        {pageData.pageNumList.map((page) => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-1 rounded ${pageData.current === page ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                            >
                                {page}
                            </button>
                        ))}
                        {pageData.next && (
                            <button
                                onClick={() => handlePageChange(pageData.nextPage)}
                                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Next
                            </button>
                        )}
                    </div>
                </>
            )}
            {showCreateModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg relative">
                        <button
                            onClick={handleCloseCreateModal}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
                        >
                            ×
                        </button>
                        <ReportForm onReportCreated={handleReportCreated} onClose={handleCloseCreateModal} />
                    </div>
                </div>
            )}
            {selectedReport && (
                <ReportDetailModal report={selectedReport} onClose={handleCloseDetail} />
            )}
            {showDeleteModal && (
                <CommonModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    title="삭제 확인"
                    onConfirm={confirmDelete}
                >
                    <p>정말 삭제하시겠습니까?</p>
                </CommonModal>
            )}
        </div>
    );
};

export default ReportListComponent;
