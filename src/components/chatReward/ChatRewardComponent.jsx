import React, { useState, useEffect } from 'react';
import useAuthStore from '../../stores/authStore';
import * as adminRewardAPI from '../../api/adminRewardAPI';
import CommonModal from '../../common/CommonModal';
import LoadingComponent from '../../common/LoadingComponent';

// 분리된 하위 컴포넌트들 임포트
import RewardSearchFilter from './RewardSearchFilter';
import LogSearchFilter from './LogSearchFilter';
import UserListTable from './UserListTable';
import RewardLogTable from './RewardLogTable';
import GiveRewardModal from './GiveRewardModal';
import RewardDetailModal from './RewardDetailModal';

const ChatRewardComponent = () => {
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    
    // 👥 사용자 목록 관련 상태
    const [users, setUsers] = useState([]);
    const [searchNickname, setSearchNickname] = useState('');
    const [searchStartDate, setSearchStartDate] = useState('');
    const [searchEndDate, setSearchEndDate] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [userPagination, setUserPagination] = useState({ page: 1, totalPages: 1, total: 0 });

    // 📜 보상 기록 관련 상태
    const [rewardLogs, setRewardLogs] = useState([]);
    const [logPagination, setLogPagination] = useState({ page: 1, totalPages: 1 });
    
    // 보상 내역 검색 필터 상태
    const [logFilter, setLogFilter] = useState({
        adminNickname: '',
        startDate: '',
        endDate: '',
        reason: ''
    });

    // 🏗️ 모달 제어 상태
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [rewardMode, setRewardMode] = useState('selected'); 
    const [rewardAmount, setRewardAmount] = useState(10);
    const [rewardReason, setRewardReason] = useState('관리자 보상');
    
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [selectedLogItems, setSelectedLogItems] = useState([]);
    const [cancelReason, setCancelReason] = useState('관리자 취소');

    // 🔔 알림 및 확인용 모달 상태
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '' });
    const [confirmModal, setConfirmModal] = useState({ 
        isOpen: false, title: '', message: '', onConfirm: () => {}, isLoading: false 
    });

    useEffect(() => {
        if (user && user.userLv >= 2) {
            fetchUsers();
            fetchLogs();
        }
    }, [user]);

    const showAlert = (title, message) => setAlertModal({ isOpen: true, title, message });
    const closeAlert = () => setAlertModal({ ...alertModal, isOpen: false });

    const showConfirm = (title, message, onConfirm) => {
        setConfirmModal({ isOpen: true, title, message, onConfirm, isLoading: false });
    };
    const closeConfirm = () => setConfirmModal({ ...confirmModal, isOpen: false });

    // 🔎 사용자 목록 가져오기 (기간 검색 적용)
    const fetchUsers = async (page = 1) => {
        setIsLoading(true);
        try {
            const data = await adminRewardAPI.searchUsersForReward({ 
                nickname: searchNickname, 
                startDate: searchStartDate,
                endDate: searchEndDate,
                page, 
                limit: 10 
            });
            setUsers(data.users);
            setUserPagination(data.pagination);
        } catch (error) { showAlert('오류', '사용자 목록을 불러오는 중 오류가 발생했습니다.'); } 
        finally { setIsLoading(false); }
    };

    // 🔎 보상 내역 가져오기
    const fetchLogs = async (page = 1) => {
        try {
            const data = await adminRewardAPI.getRewardLogs({ 
                page, 
                limit: 10,
                adminNickname: logFilter.adminNickname,
                startDate: logFilter.startDate,
                endDate: logFilter.endDate,
                reason: logFilter.reason
            });
            setRewardLogs(data.logs);
            setLogPagination(data.pagination);
        } catch (error) { console.error('보상 내역 조회 실패:', error); }
    };

    const handleSearch = (e) => { e?.preventDefault(); fetchUsers(1); };
    const handleLogFilterSearch = (e) => { e?.preventDefault(); fetchLogs(1); };

    const handleUserSelect = (userId) => {
        setSelectedUserIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const handleSelectAll = () => {
        const currentPageIds = users.map(u => u._id);
        const isAllSelected = currentPageIds.every(id => selectedUserIds.includes(id));
        if (isAllSelected) {
            setSelectedUserIds(prev => prev.filter(id => !currentPageIds.includes(id)));
        } else {
            setSelectedUserIds(prev => [...new Set([...prev, ...currentPageIds])]);
        }
    };

    const handleOpenRewardModal = (mode) => {
        setRewardMode(mode);
        setShowRewardModal(true);
    };

    const handleGiveReward = async () => {
        setIsLoading(true);
        try {
            let userIdsToReward = [...selectedUserIds];
            if (rewardMode === 'all') {
                const allFoundData = await adminRewardAPI.searchUsersForReward({ 
                    nickname: searchNickname, 
                    startDate: searchStartDate,
                    endDate: searchEndDate,
                    page: 1, 
                    limit: 99999 
                });
                userIdsToReward = allFoundData.users.map(u => u._id);
            }
            if (userIdsToReward.length === 0) {
                showAlert('알림', '보상을 줄 사용자가 없습니다.');
                setIsLoading(false);
                return;
            }
            await adminRewardAPI.giveChatReward({ userIds: userIdsToReward, rewardAmount, reason: rewardReason });
            showAlert('성공', '보상이 성공적으로 지급되었습니다.');
            setShowRewardModal(false);
            setSelectedUserIds([]);
            fetchUsers(userPagination.page);
            fetchLogs(1);
        } catch (error) { showAlert('오류', error.message || '보상 지급 중 오류가 발생했습니다.'); } 
        finally { setIsLoading(false); }
    };

    const handleOpenDetailModal = async (log) => {
        setIsLoading(true);
        try {
            const data = await adminRewardAPI.getRewardLogItems(log._id);
            setSelectedLog(log);
            setSelectedLogItems(data.items);
            setShowDetailModal(true);
        } catch (error) { showAlert('오류', '상세 내역을 불러오지 못했습니다.'); } 
        finally { setIsLoading(false); }
    };

    const executeCancel = async (idOrType) => {
        setConfirmModal(prev => ({ ...prev, isLoading: true }));
        try {
            if (idOrType === 'all') {
                await adminRewardAPI.cancelAllRewards({ logId: selectedLog._id, reason: cancelReason });
            } else {
                await adminRewardAPI.cancelReward({ itemId: idOrType, reason: cancelReason });
            }
            closeConfirm();
            showAlert('성공', '보상이 성공적으로 취소되었습니다.');
            fetchUsers(userPagination.page);
            fetchLogs(logPagination.page);
            const data = await adminRewardAPI.getRewardLogItems(selectedLog._id);
            setSelectedLogItems(data.items);
        } catch (error) { showAlert('오류', error.message || '보상 취소 중 오류가 발생했습니다.'); closeConfirm(); }
    };

    const handleCancelRequest = (idOrType) => {
        const isAll = idOrType === 'all';
        showConfirm('보상 취소 확인', `정말로 이 ${isAll ? '그룹 전체' : '사용자'}의 보상을 취소하시겠습니까?`, () => executeCancel(idOrType));
    };

    if (!user || user.userLv < 2) return <div className="p-10 text-center text-red-500 font-bold">접근 권한이 없습니다.</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen font-sans">
            <h1 className="text-3xl font-extrabold mb-8 text-gray-900 border-b pb-4">🎁 채팅 횟수 보상 시스템</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* 🏠 사용자 영역 (왼쪽) */}
                <div className="flex flex-col">
                    <RewardSearchFilter 
                        searchNickname={searchNickname} setSearchNickname={setSearchNickname} 
                        startDate={searchStartDate} setStartDate={setSearchStartDate}
                        endDate={searchEndDate} setEndDate={setSearchEndDate}
                        onSearch={handleSearch} 
                    />
                    <UserListTable 
                        users={users} selectedUserIds={selectedUserIds} 
                        onSelect={handleUserSelect} onSelectAll={handleSelectAll} 
                        pagination={userPagination} onPageChange={fetchUsers} 
                        onOpenRewardModal={handleOpenRewardModal} 
                    />
                </div>

                {/* 🏠 보상 기록 영역 (오른쪽) */}
                <div className="flex flex-col">
                    <LogSearchFilter 
                        filter={logFilter} setFilter={setLogFilter} 
                        onSearch={handleLogFilterSearch} 
                    />
                    <RewardLogTable 
                        logs={rewardLogs} pagination={logPagination} 
                        onPageChange={fetchLogs} 
                        onSelectLog={handleOpenDetailModal} 
                    />
                </div>
            </div>

            {/* 🏗️ 각종 모달들 */}
            <GiveRewardModal isOpen={showRewardModal} onClose={() => setShowRewardModal(false)} selectedCount={rewardMode === 'all' ? userPagination.total : selectedUserIds.length} rewardAmount={rewardAmount} setRewardAmount={setRewardAmount} rewardReason={rewardReason} setRewardReason={setRewardReason} onGive={handleGiveReward} />
            <RewardDetailModal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} selectedLog={selectedLog} selectedLogItems={selectedLogItems} cancelReason={cancelReason} setCancelReason={setCancelReason} onCancel={handleCancelRequest} />
            <CommonModal isOpen={alertModal.isOpen} onClose={closeAlert} onConfirm={closeAlert} title={alertModal.title} showCancel={false}><div className="py-2">{alertModal.message}</div></CommonModal>
            <CommonModal isOpen={confirmModal.isOpen} onClose={closeConfirm} onConfirm={confirmModal.onConfirm} title={confirmModal.title} isLoading={confirmModal.isLoading} showCancel={true}><div className="py-2 font-medium text-gray-700">{confirmModal.message}</div></CommonModal>

            {isLoading && <LoadingComponent />}
        </div>
    );
};

export default ChatRewardComponent;
