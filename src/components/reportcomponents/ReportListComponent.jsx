// ReportListComponent.jsx
import { useState, useEffect } from 'react';
import { fetchReports, deleteReport } from '../../api/reportAPI.js';
import ReportDetailModal from './ReportDetailModal';
import CommonModal from '../../common/CommonModal.jsx';
import useAuthStore from "../../stores/authStore.js";

const ReportListComponent = () => {
    const [pageData, setPageData] = useState(null);
    const [error, setError] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [reportToDelete, setReportToDelete] = useState(null);
    const [filterArea, setFilterArea] = useState("all"); // 전체 구역일 경우 "all"
    const [filterCategory, setFilterCategory] = useState("all"); // 전체 카테고리일 경우 "all"
    const [filterStatus, setFilterStatus] = useState("all"); // 전체 상태일 경우 "all"
    const pageSize = 5;
    const [keyword, setKeyword] = useState('');
    const [searchType, setSearchType] = useState('all');

    const { user } = useAuthStore();

    // 신고 목록 불러오기 (필터 적용)
    const loadReports = async (page) => {
        try {
            const filters = {};
            if (filterArea && filterArea !== "all") {
                filters.reportArea = filterArea;
            }
            if (filterCategory && filterCategory !== "all") {
                filters.reportCategory = filterCategory;
            }
            if (filterStatus && filterStatus !== "all") {
                filters.reportStatus = filterStatus;
            }
            if (keyword.trim()) {
                filters.keyword = keyword.trim();
                filters.searchType = searchType;
            }
            const data = await fetchReports(page, pageSize, filters);
            setPageData(data);
        } catch (err) {
            setError(err.message);
        }
    };

    // currentPage, filterArea, filterCategory, filterStatus가 바뀔 때마다 목록을 다시 불러옴
    useEffect(() => {
        loadReports(currentPage);
    }, [currentPage, filterArea, filterCategory, filterStatus]);

    const handleDeleteClick = (id) => {
        setReportToDelete(id);
        setShowDeleteModal(true);
    };

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

    // ReportDetailModal에서 업데이트된 report 정보를 리스트 상태에 반영하는 함수
    const handleReportUpdated = (updatedReport) => {
        if (pageData) {
            const updatedDtoList = pageData.dtoList.map((report) =>
                report._id === updatedReport._id ? updatedReport : report
            );
            setPageData({ ...pageData, dtoList: updatedDtoList });
        }
    };

    const handleOpenDetail = (report) => setSelectedReport(report);
    const handleCloseDetail = () => setSelectedReport(null);

    // 신고 구역 필터 버튼 클릭 시 실행
    const handleAreaFilterChange = (area) => {
        setFilterArea(area);
        setCurrentPage(1); // 필터 변경 시 첫 페이지로 리셋
    };

    // 신고 카테고리 필터 버튼 클릭 시 실행
    const handleCategoryFilterChange = (category) => {
        setFilterCategory(category);
        setCurrentPage(1); // 필터 변경 시 첫 페이지로 리셋
    };

    // 신고 상태 필터 버튼 클릭 시 실행
    const handleStatusFilterChange = (status) => {
        setFilterStatus(status);
        setCurrentPage(1); // 필터 변경 시 첫 페이지로 리셋
    };

    // 검색 버튼 혹은 Enter 키 눌렀을 때
    const handleSearch = () => {
        setCurrentPage(1);
        loadReports(1);
    };
    // ★ 삭제 버튼 렌더링 함수 추가
    const renderDeleteBtn = (reportId) => {
        // 로그인 안 했거나 userLv 3 미만이면 아무것도 반환하지 않음
        if (!user || user.userLv < 3) return null;

        return (
            <button
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded"
                onClick={() => handleDeleteClick(reportId)}
            >
                삭제
            </button>
        );
    };


    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">신고 목록</h2>
            </div>

            {/* 신고 구역 필터 버튼 */}
            <div className="mb-4 flex space-x-2">
                <button
                    onClick={() => handleAreaFilterChange("all")}
                    className={`px-3 py-1 rounded ${filterArea === "all" ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    전체 구역
                </button>
                <button
                    onClick={() => handleAreaFilterChange("친구채팅")}
                    className={`px-3 py-1 rounded ${filterArea === "친구채팅" ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    친구 채팅
                </button>
                <button
                    onClick={() => handleAreaFilterChange("랜덤채팅")}
                    className={`px-3 py-1 rounded ${filterArea === "랜덤채팅" ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    랜덤 채팅
                </button>
                <button
                    onClick={() => handleAreaFilterChange("커뮤니티")}
                    className={`px-3 py-1 rounded ${filterArea === "커뮤니티" ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    커뮤니티
                </button>
            </div>

            {/* 신고 카테고리 필터 버튼 */}
            <div className="mb-4 flex space-x-2">
                <button
                    onClick={() => handleCategoryFilterChange("all")}
                    className={`px-3 py-1 rounded ${filterCategory === "all" ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    전체 카테고리
                </button>
                <button
                    onClick={() => handleCategoryFilterChange("욕설, 모욕, 혐오발언")}
                    className={`px-3 py-1 rounded ${filterCategory === "욕설, 모욕, 혐오발언" ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    욕설/모욕
                </button>
                <button
                    onClick={() => handleCategoryFilterChange("스팸, 도배, 거짓정보")}
                    className={`px-3 py-1 rounded ${filterCategory === "스팸, 도배, 거짓정보" ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    스팸
                </button>
                <button
                    onClick={() => handleCategoryFilterChange("부적절한 메세지(성인/도박/마약 등)")}
                    className={`px-3 py-1 rounded ${filterCategory === "부적절한 메세지(성인/도박/마약 등)" ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    부적절 메시지
                </button>
                <button
                    onClick={() => handleCategoryFilterChange("규칙에 위반되는 프로필/모욕성 닉네임")}
                    className={`px-3 py-1 rounded ${filterCategory === "규칙에 위반되는 프로필/모욕성 닉네임" ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    프로필
                </button>
                <button
                    onClick={() => handleCategoryFilterChange("음란물 배포(이미지)")}
                    className={`px-3 py-1 rounded ${filterCategory === "음란물 배포(이미지)" ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                    음란물
                </button>
            </div>

            {/* 신고 상태 필터 버튼 */}
            <div className="mb-4 flex space-x-2">
                <button
                    onClick={() => handleStatusFilterChange("all")}
                    className={`px-3 py-1 rounded ${filterStatus === "all" ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    전체 상태
                </button>
                <button
                    onClick={() => handleStatusFilterChange("pending")}
                    className={`px-3 py-1 rounded ${filterStatus === "pending" ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    대기
                </button>
                <button
                    onClick={() => handleStatusFilterChange("reviewed")}
                    className={`px-3 py-1 rounded ${filterStatus === "reviewed" ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    검토
                </button>
                <button
                    onClick={() => handleStatusFilterChange("resolved")}
                    className={`px-3 py-1 rounded ${filterStatus === "resolved" ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    해결
                </button>
                <button
                    onClick={() => handleStatusFilterChange("dismissed")}
                    className={`px-3 py-1 rounded ${filterStatus === "dismissed" ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    경고처리
                </button>
            </div>

            {/* 검색창 */}
            <div className="mb-4 flex items-center space-x-2">
                <select
                    value={searchType}
                    onChange={e => setSearchType(e.target.value)}
                    className="border rounded px-2 py-1"
                >
                    <option value="all">전체</option>
                    <option value="title">제목</option>
                    <option value="content">내용</option>
                    <option value="admin">관리자</option>
                    <option value="offender">가해자</option>
                </select>
                <input
                    type="text"
                    placeholder="검색어 입력"
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="flex-1 border rounded px-3 py-1"
                />
                <button
                    onClick={handleSearch}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
                >
                    검색
                </button>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}
            {pageData && (
                <>
                    <ul>
                        {pageData.dtoList.map((report) => (
                            <li key={report._id} className="bg-white shadow rounded mb-4 p-4">
                                <h3 className="text-xl font-bold mb-2">제목: {report.reportTitle}</h3>
                                <p className="mb-1">
                                    <span className="font-semibold">신고 구역:</span> {report.reportArea}
                                </p>
                                <p className="mb-1">
                                    <span className="font-semibold">내용:</span> {report.reportContants}
                                </p>
                                <p className="mb-1">
                                    <span className="font-semibold">신고일:</span> {new Date(report.reportDate).toLocaleString()}
                                </p>
                                <p className="mb-1">
                                    <span className="font-semibold">가해자:</span> {report.offenderId.nickname}
                                </p>
                                {report.adminId?.nickname && (
                                    <p className="mb-1">
                                        <span className="font-semibold">처리 관리자:</span> {report.adminId.nickname}
                                    </p>
                                )}
                                <div className="flex justify-end space-x-2 mt-2">
                                    <button
                                        onClick={() => handleOpenDetail(report)}
                                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded"
                                    >
                                        상세 보기
                                    </button>
                                    {/* 🚫 userLv 3 이상에게만 보임 */}
                                    {renderDeleteBtn(report._id)}
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
            {selectedReport && (
                <ReportDetailModal
                    report={selectedReport}
                    onClose={handleCloseDetail}
                    onUpdateReport={handleReportUpdated}
                />
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
