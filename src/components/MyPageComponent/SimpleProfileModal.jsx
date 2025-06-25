import React, {useMemo, useState} from 'react';
import ReportForm from '../reportcomponents/ReportForm.jsx';
import useAuthStore from '../../stores/authStore';
import {sendFriendRequest, blockUser, deleteFriend} from "../../api/userAPI.js";
import CommonModal from '../../common/CommonModal.jsx';
import PhotoGallery from './PhotoGallery.jsx';
import { useNavigate } from 'react-router-dom';
import useFriendListStore from "../../stores/useFriendListStore.js";


const SimpleProfileModal = ({ profile, onClose }) => {
    const authUser = useAuthStore(state => state.user);
    const isOwnProfile = authUser && profile._id === authUser._id; // 내 프로필인지 확인
    const [isReportModalVisible, setIsReportModalVisible] = useState(false);
    const [alertModalOpen, setAlertModalOpen] = useState(false);
    const [alertModalMessage, setAlertModalMessage] = useState("");
    const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const setUser    = useAuthStore((s) => s.setUser);

    const friends = useFriendListStore((s) => s.friends);              // 추가
    const isFriend = useMemo(
        () => friends.some((f) => f._id === profile?._id),
        [friends, profile?._id]
    );
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

    const navigate = useNavigate();

    if (!profile) return null;

    const photos = profile.photo || [];

    const handleFriendRequest = async () => {
        if (!authUser) return;
        try {
            await sendFriendRequest("6801ee8c483df1269443ce5c", profile._id);
            setAlertModalMessage("친구 요청을 보냈습니다.");
        } catch (error) {
            setAlertModalMessage(error.response?.data?.message || error.message);
        }
        setAlertModalOpen(true);
    };

    const handleDeleteFriend = async () => {
        try {
            await deleteFriend(authUser._id, profile._id);    // 서버 삭제[1]

            // 로컬 상태 즉시 갱신
            const updatedUser = {
                ...authUser,
                friends: authUser.friends.filter((id) => id !== profile._id),
            };
            setUser(updatedUser);                            // Zustand 스토어 업데이트[4]
            useFriendListStore.getState().removeFriend(profile._id);   // 전역 리스트 동기화

            setAlertModalMessage("친구를 삭제했습니다.");
        } catch (error) {
            setAlertModalMessage(error.response?.data?.message || error.message);
        }finally {
            setConfirmDeleteOpen(false);                      // 확인 모달 닫기
            setAlertModalOpen(true);                          // 알림 모달 열기
        }
    };

    const handleBlockUser = async () => {
        try {
            await blockUser(authUser._id, profile._id);
            setAlertModalMessage("사용자를 차단했습니다.");
        } catch (error) {
            setAlertModalMessage(error.response?.data?.message || error.message);
        }
        setAlertModalOpen(true);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white w-96 p-6 rounded-lg shadow-lg relative"
                onClick={e => e.stopPropagation()}
            >
                {/* 닫기 버튼 */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                >
                    ×
                </button>

                {/*프로필 사진, 서브사진*/}
                <PhotoGallery
                    photos={photos}
                    selectedIndex={selectedPhotoIndex}
                    onSelect={setSelectedPhotoIndex}
                />


                {/* 프로필 정보 */}
                <div className="mb-4 space-y-1 text-black">
                    <p><strong>닉네임:</strong> {profile.nickname || '없음'}</p>
                    <p><strong>롤 닉네임:</strong> {profile.lolNickname || '없음'}</p>
                    <p><strong>성별:</strong> {profile.gender || '없음'}</p>
                    <p><strong>별점:</strong> {profile.star || 0}</p>
                </div>

                {/* 자기소개 */}
                <div className="mb-6 text-black">
                    <p className="font-medium mb-1">자기소개</p>
                    <div className="border border-gray-300 rounded-md p-3 min-h-[60px] whitespace-pre-wrap">
                        {profile.info || '자기소개가 없습니다.'}
                    </div>
                </div>

                {/* 액션 버튼 본인이면 액션버튼 다르게 보이기*/}
                <div className="flex gap-3">
                    {!isOwnProfile
                        ? (
                            <>
                                {isFriend ? (
                                    <button
                                        onClick={() => setConfirmDeleteOpen(true)}
                                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-md"
                                    >
                                        친구 삭제
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleFriendRequest}
                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-md"
                                    >
                                        친구 신청
                                    </button>
                                )}
                                <button
                                    onClick={() => setConfirmBlockOpen(true)}
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md"
                                >
                                    차단
                                </button>
                                <button
                                    onClick={() => setIsReportModalVisible(true)}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-md"
                                >
                                    신고
                                </button>
                            </>
                        )
                        : (
                        <button
                        onClick={() => navigate('/mypage')}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-md"
                >
                    프로필 수정
                </button>
                )
                }

                </div>
            </div>

            {/* 신고 모달 */}
            {isReportModalVisible && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60"
                    // overlay 클릭으로도 신고 모달만 닫히도록, 이벤트 버블링 차단 후 setIsReportModalVisible
                    onClick={e => {
                        e.stopPropagation();
                        setIsReportModalVisible(false);
                    }}
                >
                    <div
                        className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md relative"
                        // content 영역 클릭은 overlay close도 막기
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsReportModalVisible(false)}
                            className="absolute top-3 left-3 text-gray-500 hover:text-gray-700"
                        >
                            ← 뒤로
                        </button>
                        <ReportForm
                            onClose={() => setIsReportModalVisible(false)}
                            reportedUser={profile}
                            onReportCreated={() => setIsReportModalVisible(false)}
                        />
                    </div>
                </div>
            )}


            {/* 확인 모달: 차단 */}
            {confirmBlockOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60"
                    // overlay 클릭 시 차단 모달만 닫고, 부모 onClose는 호출하지 않음
                    onClick={e => {
                        e.stopPropagation();
                        setConfirmBlockOpen(false);
                    }}
                >
                    <div
                        className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-sm relative"
                        // content 내부 클릭은 overlay onClick도 막음
                        onClick={e => e.stopPropagation()}
                    >
                        <CommonModal
                            isOpen={confirmBlockOpen}
                            onClose={() => setConfirmBlockOpen(false)}
                            title="사용자 차단"
                            showCancel={true}
                            onConfirm={handleBlockUser}
                        >
                            <p>정말 이 사용자를 차단하시겠습니까?</p>
                        </CommonModal>
                    </div>
                </div>
            )}

            {/* 알림 모달: 친구신청 결과 or 차단 완료 */}
            {alertModalOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60"
                    onClick={e => {
                        e.stopPropagation();
                        setAlertModalOpen(false);
                    }}
                >
                    <div
                        className="bg-white p-6 rounded-lg shadow-lg w-80 relative"
                        onClick={e => e.stopPropagation()}
                    >
                        <CommonModal
                            isOpen={alertModalOpen}
                            onClose={() => setAlertModalOpen(false)}
                            title="알림"
                            showCancel={false}
                            onConfirm={() => setAlertModalOpen(false)}
                        >
                            <p>{alertModalMessage}</p>
                        </CommonModal>
                    </div>
                </div>
            )}

            {/* ---------- 친구 삭제 확인 모달 ---------- */}
            {confirmDeleteOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60"
                    onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteOpen(false);
                    }}
                >
                    <div
                        className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-sm relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CommonModal
                            isOpen={confirmDeleteOpen}
                            onClose={() => setConfirmDeleteOpen(false)}
                            title="친구 삭제"
                            showCancel={true}
                            onConfirm={handleDeleteFriend}
                        >
                            <p>정말 이 친구를 삭제하시겠습니까?</p>
                        </CommonModal>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SimpleProfileModal;
