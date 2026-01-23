import React, {useMemo, useState, useEffect} from 'react';
import ReportForm from '../reportcomponents/ReportForm.jsx';
import useAuthStore from '../../stores/authStore';
import {sendFriendRequest, blockUserMinimal, unblockUserMinimal } from "../../api/userAPI.js";
import { useDeleteFriend } from '../../hooks/queries/useFriendQueries';
import CommonModal from '../../common/CommonModal.jsx';
import PhotoGallery from './PhotoGallery.jsx';
import { useNavigate } from 'react-router-dom';
import useFriendListStore from "../../stores/useFriendListStore.js";
import useBlockedStore from "../../stores/useBlockedStore.js";
import {createPortal} from "react-dom";
import useFriendChatStore from "../../stores/useFriendChatStore.js";
import {CheckIcon, XMarkIcon} from "@heroicons/react/24/solid";


const SimpleProfileModal = ({ profile, onClose, area = '프로필', anchor, requestId, onAccept, onDecline }) => {
    const authUser = useAuthStore(state => state.user);
    const blockedUsers = useBlockedStore(state => state.blockedUsers);

    // 🆕 친구 삭제 Mutation Hook
    const deleteFriendMutation = useDeleteFriend();

    const isOwnProfile = authUser && profile._id === authUser._id; // 내 프로필인지 확인
    const isBlocked = blockedUsers.some(blocked => blocked._id === profile._id); // 차단된 사용자인지 확인
    const [isReportModalVisible, setIsReportModalVisible] = useState(false);
    const [alertModalOpen, setAlertModalOpen] = useState(false);
    const [alertModalMessage, setAlertModalMessage] = useState("");
    const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [confirmUnblockOpen, setConfirmUnblockOpen] = useState(false);
    const [localIsFriend, setLocalIsFriend] = useState(false);

    const addBlockedUser = useBlockedStore((s) => s.addBlockedUser);
    const removeBlockedUser = useBlockedStore((s) => s.removeBlockedUser);
    const setUser    = useAuthStore((s) => s.setUser);

    const friends = useFriendListStore((s) => s.friends);              // 추가


    const isFriend = useMemo(() => {
        if (!profile?._id || !authUser?.friends) return false;

        const profileIdStr = profile._id.toString();

        // ✅ authUser.friends 배열에서 확인
        const result = authUser.friends.some(id => {
            if (!id) return false;
            return id.toString() === profileIdStr;
        });

        console.log('🔍 [isFriend 계산]', {
            profileId: profileIdStr,
            profileNickname: profile.nickname,
            result,
            friendsCount: authUser.friends.length
        });

        return result;
    }, [authUser?.friends, profile?._id, profile?.nickname]);



    const needAccept = !!requestId;

    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

    const navigate = useNavigate();

    const { closeFriendChat } = useFriendChatStore();

// ✅✅✅ 여기에 디버깅 코드 추가! ✅✅✅
    useEffect(() => {
        if (!profile?._id) return;

        console.log('=== 🔍 SimpleProfileModal 디버깅 ===');
        console.log('프로필 대상:', profile.nickname, '(', profile._id, ')');
        console.log('\n--- authUser.friends 확인 ---');
        console.log('전체:', authUser?.friends);
        console.log('포함 여부:', authUser?.friends?.includes(profile._id));
        console.log('포함 여부 (toString):', authUser?.friends?.some(id => id?.toString() === profile._id?.toString()));

        console.log('\n--- useFriendListStore.friends 확인 ---');
        console.log('전체:', friends.map(f => ({ _id: f._id, nickname: f.nickname })));
        console.log('포함 여부:', friends.some(f => f._id === profile._id));
        console.log('포함 여부 (toString):', friends.some(f => f._id?.toString() === profile._id?.toString()));

        console.log('\n--- 타입 확인 ---');
        console.log('profile._id 타입:', typeof profile._id);
        console.log('authUser.friends[0] 타입:', typeof authUser?.friends?.[0]);
        console.log('friends[0]._id 타입:', typeof friends?.[0]?._id);

        console.log('\n--- isFriend 계산 결과 ---');
        const byStore = friends.some(f => f._id?.toString() === profile._id?.toString());
        const byAuth = authUser?.friends?.some(id => id?.toString() === profile._id?.toString());
        console.log('byStore:', byStore);
        console.log('byAuth:', byAuth);
        console.log('isFriend (최종):', byStore || byAuth);
        console.log('=========================================\n');
    }, [profile?._id, authUser?.friends, friends]);

    // 초기값 설정
    useEffect(() => {
        if (!profile?._id || !authUser?.friends) {
            setLocalIsFriend(false);
            return;
        }

        const result = authUser.friends.some(
            id => id?.toString() === profile._id.toString()
        );
        setLocalIsFriend(result);
    }, [authUser?.friends, profile?._id]);



    if (!profile) return null;

    /* FriendChatSidePanel(=친구요청·친구채팅목록) 에서 열린 경우 신고 숨김 */
    const hideReport = area === '친구요청';

    const photos = profile.profilePhoto
        ? [ profile.profilePhoto, ...(profile.photo || []) ]
        : (profile.photo || []);

    const handleFriendRequest = async () => {
        if (!authUser) return;
        try {
            await sendFriendRequest(authUser._id, profile._id);
            setAlertModalMessage("친구 요청을 보냈습니다.");
        } catch (error) {
            setAlertModalMessage(error.response?.data?.message || error.message);
        }
        setAlertModalOpen(true);
    };

    const handleDeleteFriend = () => {
        // 🆕 React Query Mutation 사용 (낙관적 업데이트)
        deleteFriendMutation.mutate(
            {
                userId: authUser._id,
                friendId: profile._id,
            },
            {
                onSuccess: () => {
                    console.log('✅ 친구 삭제 성공');

                    // 1️⃣ Zustand 스토어 업데이트 (로컬 상태)
                    const updatedUser = {
                        ...authUser,
                        friends: authUser.friends.filter((id) => id !== profile._id),
                    };
                    setUser(updatedUser);
                    useFriendListStore.getState().removeFriend(profile._id);

                    // 2️⃣ 친구 채팅창 닫기
                    const friendRooms = useFriendChatStore.getState().friendRooms || [];
                    const targetChat = friendRooms.find(c => c.friend._id === profile._id);
                    if (targetChat) {
                        closeFriendChat(targetChat.roomId);
                    }

                    // 3️⃣ 로컬 UI 상태 업데이트
                    setLocalIsFriend(false);

                    // 4️⃣ 성공 메시지
                    setAlertModalMessage("친구를 삭제했습니다.");
                    setConfirmDeleteOpen(false);
                    setAlertModalOpen(true);
                },
                onError: (error) => {
                    console.error('❌ 친구 삭제 실패:', error);

                    // 에러 처리
                    setAlertModalMessage(
                        error.response?.data?.message ||
                        error.message ||
                        "친구 삭제에 실패했습니다."
                    );
                    setConfirmDeleteOpen(false);
                    setAlertModalOpen(true);
                }
            }
        );
    };

    // Line 144-153: handleBlockUser 수정
    const handleBlockUser = async () => {
        try {
            // ✅ minimal API 사용
            const response = await blockUserMinimal(authUser._id, profile._id);

            // ✅ API에서 받은 blockedUser 사용
           // addBlockedUser(response.blockedUser);

            // ✅✅✅ 변경됨: profile prop을 직접 활용!
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // 💡 이미 가진 데이터(profile)를 재사용
            // 💡 네트워크 트래픽 불필요
            // 💡 Backend 변경에 독립적
            addBlockedUser({
                _id: profile._id,
                nickname: profile.nickname,
                profilePhoto: profile.profilePhoto,
                name: profile.name,
                createdAt: profile.createdAt
            });
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

            // ⭐ 핵심: 로컬 상태를 즉시 false로 설정
            setLocalIsFriend(false);


            // 3️⃣ authUser의 friends에서 제거 (중요!)
            const updatedUser = {
                ...authUser,
                friends: authUser.friends.filter((id) => id !== profile._id)
            };
            setUser(updatedUser);

            // 4️⃣ 친구 목록 store에서도 제거
            useFriendListStore.getState().removeFriend(profile._id);

            // 5️⃣ 열려있는 친구 채팅창 닫기
            const friendRooms = useFriendChatStore.getState().friendRooms || [];
            const targetChat = friendRooms.find(c => c.friend._id === profile._id);
            if (targetChat) {
                await closeFriendChat(targetChat.roomId);
            }

            // ✅ API 응답 메시지 사용 (선택사항)
            setAlertModalMessage(response.message || "사용자를 차단했습니다.");
        } catch (error) {
            setAlertModalMessage(error.response?.data?.message || error.message);
        }
        setAlertModalOpen(true);
        onClose();
    };

    // Line 155-164: handleUnblockUser 수정
    const handleUnblockUser = async () => {
        try {
            // ✅ minimal API 사용
            const response = await unblockUserMinimal(authUser._id, profile._id);

            // ✅ ID로 store에서 제거
            removeBlockedUser(profile._id);

            // ✅ API 응답 메시지 사용
            setAlertModalMessage(response.message || "차단이 해제되었습니다.");
        } catch (error) {
            setAlertModalMessage(error.response?.data?.message || error.message);
        } finally {
            setConfirmUnblockOpen(false);
            setAlertModalOpen(true);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1500]"
            onClick={onClose}
            onPointerDown={(e) => e.stopPropagation()}
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
                <div className="mt-6 flex flex-row-reverse flex-wrap gap-2">

                    {/* ─── 내 프로필 수정 ─── */}
                    {isOwnProfile && (
                        <button
                            onClick={() => navigate('/mypage')}
                            className="inline-flex items-center justify-center gap-1 rounded-md
                 bg-orange-500 px-4 py-2 text-sm font-medium text-white
                 shadow-sm transition hover:bg-slate-800 active:scale-95">
                            프로필 수정
                        </button>
                    )}

                    {/* ─── 타인 프로필 ─── */}
                    {!isOwnProfile && (
                        <>
                            {/* 친구 삭제 : 회색 테두리 */}
                            {isFriend && !needAccept && (
                                <button
                                    onClick={() => setConfirmDeleteOpen(true)}
                                    className="inline-flex items-center justify-center gap-1 rounded-md
                     border border-gray-400 bg-white px-4 py-2 text-sm font-medium
                     text-gray-800 shadow-sm transition hover:bg-gray-50 active:scale-95">
                                    친구 삭제
                                </button>
                            )}

                            {/* 수락 : 인디고  /  거절 : 주황 */}
                            {needAccept && (
                                <>
                                    <button
                                        onClick={onDecline}
                                        className="inline-flex items-center justify-center gap-1 rounded-md
                       bg-amber-500 px-4 py-2 text-sm font-medium text-white
                       shadow-sm transition hover:bg-amber-600 active:scale-95">
                                        <XMarkIcon className="h-5 w-5" />
                                        거절
                                    </button>
                                    <button
                                        onClick={onAccept}
                                        className="inline-flex items-center justify-center gap-1 rounded-md
                       bg-indigo-600 px-4 py-2 text-sm font-medium text-white
                       shadow-sm transition hover:bg-indigo-700 active:scale-95">
                                        <CheckIcon className="h-5 w-5" />
                                        수락
                                    </button>
                                </>
                            )}

                            {/* 친구 신청 : 인디고 */}
                            {!isFriend && !needAccept && (
                                <button
                                    onClick={handleFriendRequest}
                                    className="inline-flex items-center justify-center gap-1 rounded-md
                     bg-indigo-600 px-4 py-2 text-sm font-medium text-white
                     shadow-sm transition hover:bg-indigo-700 active:scale-95">
                                    친구 신청
                                </button>
                            )}

                            {/* 차단/차단해제 버튼 */}
                            {isBlocked ? (
                                <button
                                    onClick={() => setConfirmUnblockOpen(true)}
                                    className="inline-flex items-center justify-center gap-1 rounded-md
                     bg-green-600 px-4 py-2 text-sm font-medium text-white
                     shadow-sm transition hover:bg-green-700 active:scale-95"
                                >
                                    차단 해제
                                </button>
                            ) : (
                                <button
                                    onClick={() => setConfirmBlockOpen(true)}
                                    className="inline-flex items-center justify-center gap-1 rounded-md
                     bg-blue-600 px-4 py-2 text-sm font-medium text-white
                     shadow-sm transition hover:bg-rose-700 active:scale-95"
                                >
                                    차단
                                </button>
                            )}

                            {/* 신고 : 빨강 500 */}
                            {!hideReport && (
                                <button
                                    onClick={() => setIsReportModalVisible(true)}
                                    className="inline-flex items-center justify-center gap-1 rounded-md
                     bg-red-500 px-4 py-2 text-sm font-medium text-white
                     shadow-sm transition hover:bg-rose-600 active:scale-95">
                                    신고
                                </button>
                            )}
                        </>
                    )}
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
                            defaultArea={area}
                            anchor={anchor}
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

            {/* ---------- 차단 해제 확인 모달 ---------- */}
            {confirmUnblockOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-60"
                    onClick={(e) => {
                        e.stopPropagation();
                        setConfirmUnblockOpen(false);
                    }}
                >
                    <div
                        className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-sm relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <CommonModal
                            isOpen={confirmUnblockOpen}
                            onClose={() => setConfirmUnblockOpen(false)}
                            title="차단 해제"
                            showCancel={true}
                            onConfirm={handleUnblockUser}
                        >
                            <p>정말 이 사용자를 차단 해제하시겠습니까?</p>
                        </CommonModal>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
};

export default SimpleProfileModal;
