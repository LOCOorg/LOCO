// src/components/MyPageComponent.jsx
import {useEffect, useRef, useState} from 'react';
import { Link } from 'react-router-dom';
import {uploadFile} from "../../api/fileUploadAPI";
// import { updateUserPrefs } from '../../api/userAPI'; // ❌ 제거
import useAuthStore from '../../stores/authStore';
import { useUpdateUserProfile, useUserForEdit, useUpdateUserPrefs } from '../../hooks/queries/useUserQueries'; // ✅ Hook 추가
import ProfilePhotoSection from './ProfilePhotoSection';
import ProfileDetailSection from './ProfileDetailSection';
import {toast} from "react-toastify";
import QnaHistoryComponent from "./QnaHistoryComponent.jsx";

const MyPageContent = ({overrideProfile}) => {
    const authUser = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);  // 🔥 이 줄 추가

    // Mutation Hook
    const updateProfileMutation = useUpdateUserProfile();
    const updatePrefsMutation = useUpdateUserPrefs(); // ✅ Mutation 사용

    //  Query Hook 추가
    const {
        data: profileData,
        isLoading,
        error
    } = useUserForEdit(overrideProfile ? null : authUser?._id, {
        enabled: !overrideProfile && !!authUser?._id
    });

    const [profile, setProfile] = useState(overrideProfile || null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});
    const [alertModalOpen, setAlertModalOpen] = useState(false);
    const [alertModalMessage, setAlertModalMessage] = useState("");

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
                isPublicPR: overrideProfile.isPublicPR ?? true, // ✅ 추가
            });
        } else if (profileData) {  // ⭐ Hook에서 받은 데이터 사용
            setProfile(profileData);
            setFormData(prev => ({ // ✅ 기존 입력값 유지하면서 서버 데이터 반영
                ...prev,
                nickname: profileData.nickname || '',
                info: profileData.info || '',
                gender: profileData.gender || '',
                lolNickname: profileData.lolNickname || '',
                suddenNickname: profileData.suddenNickname || '',
                battleNickname: profileData.battleNickname || '',
                profilePhoto: profileData.profilePhoto || '',
                photo: profileData.photo || [],
                isPublicPR: profileData.isPublicPR ?? true,
            }));
        }
    }, [profileData, overrideProfile]);  // ⭐ 의존성 변경

    // ✅ 공개 설정 토글 핸들러
    const handlePrivacyToggle = async () => {
        const newValue = !formData.isPublicPR;
        
        // 1. 상태 먼저 업데이트 (Optimistic Update) - UI 즉시 반영
        setFormData(prev => ({ ...prev, isPublicPR: newValue }));

        try {
            // 2. Mutation 실행 (서버 동기화 + 캐시 갱신)
            await updatePrefsMutation.mutateAsync({ 
                userId: authUser._id, 
                prefs: { isPublicPR: newValue } 
            });

            // 3. 성공 알림
            toast.success(`명예의 전당 공개가 ${newValue ? '켜졌습니다' : '꺼졌습니다'}.`);
            
        } catch (error) {
            console.error('공개 설정 변경 실패:', error);
            // 실패 시 롤백
            setFormData(prev => ({ ...prev, isPublicPR: !newValue }));
            toast.error('설정 변경에 실패했습니다.');
        }
    };


    if (isLoading) return <div>로딩 중...</div>;
    if (error) return <div className="text-red-500">프로필을 불러오는데 실패했습니다.</div>;
    if (!profile) return <div>프로필 정보가 없습니다.</div>;

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

            // Mutation Hook 사용
            const updated = await updateProfileMutation.mutateAsync({
                userId: authUser._id,
                formData: { profilePhoto: url }
            });

            setProfile(updated);

            setUser(prev => ({
                ...prev,
                profilePhoto: updated.profilePhoto
            }));

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

            //  Mutation Hook 사용!
            const updatedProfile = await updateProfileMutation.mutateAsync({
                userId: authUser._id,
                formData: { photo: updatedPhotos }
            });

            setProfile(updatedProfile);

            setUser(prev => ({
                ...prev,
                photo: updatedProfile.photo
            }));
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
            // const updatedProfile = await updateUserProfile(authUser._id, {
            //     ...formData,
            //     photo: filteredPhotos
            // }); 현재 컴포넌트의 이 로직을 아래로 다 바꿈
            // const updatedProfile = await updateUserProfile(authUser._id, {
            //     photo: filteredPhotos  // ← 이것만 전송!
            // });
            // Mutation Hook 사용
            const updatedProfile = await updateProfileMutation.mutateAsync({
                userId: authUser._id,
                formData: { photo: filteredPhotos }
            });

            setProfile(updatedProfile);

            setUser(prev => ({
                ...prev,
                photo: updatedProfile.photo
            }));
        } catch (error) {
            console.error('사진 삭제 중 에러 발생:', error);
            setAlertModalMessage("사진 삭제 중 오류가 발생했습니다.");
            setAlertModalOpen(true);
        }
    };

    const handleRemoveProfileImage = async () => {
        try {
            // Mutation Hook 사용
            const updated = await updateProfileMutation.mutateAsync({
                userId: authUser._id,
                formData: { profilePhoto: '' }
            });

            setProfile(updated);
            setFormData(prev => ({...prev, profilePhoto: ''}));

            setUser(prev => ({
                ...prev,
                profilePhoto: ''
            }));
        } catch (err) {
            console.error('프로필 사진 삭제 중 에러:', err);
            setAlertModalMessage("프로필 사진 삭제에 실패했습니다.");
            setAlertModalOpen(true);
        }
    };

    const handleSave = async () => {
        try {
            const updated = await updateProfileMutation.mutateAsync({
                userId: authUser._id,
                formData
            });

            setProfile(updated);

            // 🔥 여기서부터 추가 (authStore 업데이트)
            setUser(prev => ({
                ...prev,
                nickname: updated.nickname,
                info: updated.info,
                gender: updated.gender,
                lolNickname: updated.lolNickname,
                suddenNickname: updated.suddenNickname,
                battleNickname: updated.battleNickname,
                profilePhoto: updated.profilePhoto,
                photo: updated.photo
            }));
            // 🔥 여기까지 추가

            setEditMode(false);
            toast.success('수정이 완료되었습니다.');
        } catch (error) {
            console.error('프로필 업데이트 실패:', error);
            toast.error(error.response?.data?.message || '수정 중 오류가 발생했습니다.');
        }
    };


    {/* -------------------------------------------------------------------- */
    }


    return (
        <div className="max-w-6xl mx-auto p-6">
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
                    handlePrivacyToggle={handlePrivacyToggle} // ✅ 추가
                />
            </div>

            {/* 오른쪽 섹션 끝 */}


            <div className="mb-6">

                {/* QnA 내역 */}
                <QnaHistoryComponent profile={profile} />
                
                <div className="mt-8 text-center">
                    <Link to="/userLeave" className="text-sm text-gray-500 hover:text-red-500 hover:underline">
                        회원 탈퇴
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default MyPageContent;
