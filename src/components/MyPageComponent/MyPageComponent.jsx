// src/components/MyPageComponent.jsx
import {useEffect, useRef, useState} from 'react';
import {
    getUserInfo, updateUserPrefs,
    updateUserProfile,
} from "../../api/userAPI"; // declineFriendRequest 추가됨
import {uploadFile} from "../../api/fileUploadAPI";
import useAuthStore from '../../stores/authStore';
import ProfilePhotoSection from './ProfilePhotoSection';
import ProfileDetailSection from './ProfileDetailSection';
import {toast, ToastContainer, Zoom} from "react-toastify";
import useNotificationStore from "../../stores/notificationStore.js";
import {Switch} from "@headlessui/react";
import Toggle from "../../hooks/Toggle.jsx";

const MyPageContent = ({overrideProfile}) => {
    const authUser = useAuthStore((state) => state.user);
    const [profile, setProfile] = useState(overrideProfile || null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});
    const [alertModalOpen, setAlertModalOpen] = useState(false);
    const [alertModalMessage, setAlertModalMessage] = useState("");
    const toastEnabled   = useNotificationStore((s) => s.toastEnabled);
    const setToastEnabled = useNotificationStore((s) => s.setToastEnabled);
    const friendReqEnabled = useNotificationStore((s) => s.friendReqEnabled);
    const setFriendReqEnabled = useNotificationStore((s) => s.setFriendReqEnabled);

    // 앨범용 input ref
    const fileInputRef = useRef(null);
    // 프로필 사진 업로드용 input ref
    const profileInputRef = useRef(null);

    useEffect(() => {
        if (overrideProfile) {
            setProfile(overrideProfile);
            setFormData({
                nickname: overrideProfile.nickname || '',
                info: overrideProfile.info || '',
                gender: overrideProfile.gender || '',
                lolNickname: overrideProfile.lolNickname || '',
                suddenNickname: overrideProfile.suddenNickname || '',
                battleNickname: overrideProfile.battleNickname || '',
                profilePhoto: overrideProfile.profilePhoto || '',
                photo: overrideProfile.photo || [],
            });
        } else if (authUser) {
            getUserInfo(authUser._id)
                .then((data) => {
                    setProfile(data);
                    setFormData({
                        nickname: data.nickname || '',
                        info: data.info || '',
                        gender: data.gender || '',
                        lolNickname: data.lolNickname || '',
                        suddenNickname: data.suddenNickname || '',
                        battleNickname: data.battleNickname || '',
                        profilePhoto: data.profilePhoto || '',
                        photo: data.photo || [],
                    });
                })
                .catch((error) => console.error('프로필 불러오기 에러:', error));
        }
    }, [authUser, overrideProfile]);

    useEffect(() => {
        if (profile?.friendReqEnabled != null) {
            setFriendReqEnabled(profile.friendReqEnabled);
        }
    }, [profile]);


    if (!profile) return <div>로딩 중...</div>;

    const isOwnProfile = !overrideProfile || (authUser && authUser._id === profile._id);

    /* --- 프로필 사진 업로드 핸들러 --- */
    const handleProfileUpload = () => {
        if (profileInputRef.current) {
            profileInputRef.current.click();
        }
    };
    const handleProfileImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const url = await uploadFile(file, window.location.pathname);
            // 0번으로 삽입 + 이전 0번 제거
            setFormData(prev => ({...prev, profilePhoto: url}));
            const updated = await updateUserProfile(authUser._id, {
                ...formData,
                profilePhoto: url
            });
            setProfile(updated);
        } catch (err) {
            console.error('프로필 사진 업로드 중 에러:', err);
            setAlertModalMessage("프로필 사진 업로드에 실패했습니다.");
            setAlertModalOpen(true);
        }
        e.target.value = null;
    };

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    // 사용자가 + 박스를 클릭했을 때 숨겨진 파일 입력을 열어주는 함수
    const handleAddPhotoClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handlePhotoChange = async (e) => {
        const files = Array.from(e.target.files);

        const currentCount = formData.photo.length;

        if (currentCount + files.length > 7) {
            setAlertModalMessage("최대 7장까지 업로드 가능합니다.");
            setAlertModalOpen(true);
            return;
        }

        try {
            // 1) 파일 각각 uploadFile() 호출 → 서버에 저장되고, URL을 받아온다.
            const newPhotoURLs = [];
            for (const file of files) {
                const url = await uploadFile(file, window.location.pathname);
                newPhotoURLs.push(url);
            }

            // 2) formData에 URL 배열을 누적
            const updatedPhotos = [...formData.photo, ...newPhotoURLs];
            setFormData((prev) => ({...prev, photo: updatedPhotos}));

            // 3) updateUserProfile() 호출 → 서버에 profile.photo 필드가 갱신된다.
            const updatedProfile = await updateUserProfile(authUser._id, {
                ...formData,
                photo: updatedPhotos,
            });
            setProfile(updatedProfile);
        } catch (err) {
            console.error('사진 업로드 중 에러 발생:', err);
            setAlertModalMessage("사진 업로드 중 오류가 발생했습니다.");
            setAlertModalOpen(true);
        }

        // 같은 파일을 다시 고를 때에도 이벤트가 트리거되도록 초기화
        e.target.value = null;
    };


    const handleRemovePhoto = async (index) => {
        const filteredPhotos = formData.photo.filter((_, idx) => idx !== index);
        setFormData((prev) => ({...prev, photo: filteredPhotos}));

        try {
            const updatedProfile = await updateUserProfile(authUser._id, {
                ...formData,
                photo: filteredPhotos
            });
            setProfile(updatedProfile);
        } catch (error) {
            console.error('사진 삭제 중 에러 발생:', error);
            setAlertModalMessage("사진 삭제 중 오류가 발생했습니다.");
            setAlertModalOpen(true);
        }
    };

    const handleRemoveProfileImage = async () => {
        try {
            // profilePhoto만 빈 문자열로 갱신
            const updated = await updateUserProfile(authUser._id, {profilePhoto: ''});
            setProfile(updated);
            setFormData(prev => ({...prev, profilePhoto: ''}));
        } catch (err) {
            console.error('프로필 사진 삭제 중 에러:', err);
            setAlertModalMessage("프로필 사진 삭제에 실패했습니다.");
            setAlertModalOpen(true);
        }
    };

    const handleSave = async () => {
        try {
            const updated = await updateUserProfile(authUser._id, formData);
            setProfile(updated);
            setEditMode(false);
            toast.success('수정이 완료되었습니다.');
        } catch (error) {
            console.error('프로필 업데이트 실패:', error);
            toast.error('수정 중 오류가 발생했습니다.');
        }
    };
    const handleFriendReqToggle = async (v) => {
        setFriendReqEnabled(v); // 상태·localStorage 반영

        // 토스트 안내 추가
        toast.info(
            v ? '친구 신청 차단 해제' : '친구 신청 차단'
        );

        // 서버 동기화
        if (authUser?._id) {
            try {
                await updateUserPrefs(authUser._id, { friendReqEnabled: v });
                // 성공: 별도 처리 없이 완료
            } catch (err) {
                setFriendReqEnabled(!v); // 상태 복원
                toast.error('서버 저장에 실패했습니다. 잠시 후 다시 시도하세요.');
            }
        }
    };



    {/* -------------------------------------------------------------------- */
    }


    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* === 알림 설정 구역 === */}
            <div className="space-y-6">
                {/* === 채팅 알림 설정 === */}
                <div className="pt-6">
                    <h3 className="text-lg font-semibold mb-2">채팅/친구신청 알림 설정</h3>
                    <Toggle
                        label="미리보기 알림"
                        checked={toastEnabled}
                        onChange={(v) => {
                            setToastEnabled(v);
                            toast.info(
                                v ? '채팅 미리보기 알림 활성화' : '채팅 미리보기 알림 해제'
                            );
                        }}
                    />
                    {/* === 친구 신청 알림 설정 === */}
                    <div className="flex items-center justify-between pt-4 border-t">
                        <Toggle
                            label="친구 신청 차단"
                            checked={friendReqEnabled}
                            onChange={handleFriendReqToggle}
                        />
                    </div>
                </div>
            </div>

            {/* 왼쪽 섹션 */}
            <h2 className="text-2xl font-bold mb-4">프로필 편집</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                <ProfilePhotoSection
                    profilePhoto={formData.profilePhoto}
                    handleProfileUpload={handleProfileUpload}
                    albumImages={formData.photo}         // 사진 URL 배열
                    onAddToAlbum={handleAddPhotoClick}   // + 클릭 시
                    onRemovePhoto={handleRemovePhoto}    // 삭제 버튼 클릭 시
                    removeProfileImage={handleRemoveProfileImage}
                />

                {/* 숨겨진 파일 input은 부모에 두고 */}
                <input
                    type="file"
                    accept="image/*"
                    ref={profileInputRef}
                    onChange={handleProfileImageChange}
                    className="hidden"
                />
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    className="hidden"
                />
                {/* 왼쪽 끝*/}




                {/* 오른쪽 섹션 (분리된 컴포넌트) */}
                <ProfileDetailSection
                    profile={profile}
                    formData={formData}
                    isOwnProfile={isOwnProfile}
                    editMode={editMode}
                    handleInputChange={handleInputChange}
                    handleSave={handleSave}
                    setEditMode={setEditMode}
                />
            </div>

            {/* 오른쪽 섹션 끝 */}


            <div className="mb-6">

                {/* QnA 내역 */}
                <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-2">본인 QnA 내역</h3>
                    {profile.qnaHistory && profile.qnaHistory.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                            {profile.qnaHistory.map((qna, idx) => (
                                <li key={idx}>{qna}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>등록된 QnA 내역이 없습니다.</p>
                    )}
                </div>
                {/* 수정완료, 실패 알림임 옵션들은 gpt한테 물어보기*/}
                <ToastContainer
                    position="top-center"
                    autoClose={1500}
                    hideProgressBar={false}
                    newestOnTop={true} // true : 새 알림이 맨 위, false 맨 아래
                    closeOnClick
                    pauseOnHover
                    // draggable   //토스트를 “끌어서” 닫을 수 있게 해 주는 옵션
                    pauseOnFocusLoss    //브라우저 창 또는 탭이 포커스를 잃었을 때(다른 탭으로 전환 등) autoClose 카운트다운을 일시정지할지 여부를 결정
                    transition={Zoom}   //Slide, Zoom, Flip, Bounce
                />
            </div>
        </div>
    );
};

export default MyPageContent;
