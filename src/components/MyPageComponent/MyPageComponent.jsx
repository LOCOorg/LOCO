// src/components/MyPageComponent.jsx
import { useEffect, useState } from 'react';
import { getUserInfo, updateUserProfile, getFriendRequestList, acceptFriendRequest, declineFriendRequest } from "../../api/userAPI"; // declineFriendRequest 추가됨
import { uploadFile } from "../../api/fileUploadAPI";
import useAuthStore from '../../stores/authStore';
import CommonModal from '../../common/CommonModal.jsx';

const MyPageContent = ({ overrideProfile }) => {
    const authUser = useAuthStore((state) => state.user);
    const [profile, setProfile] = useState(overrideProfile || null);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});
    const [friendRequests, setFriendRequests] = useState([]);
    const [alertModalOpen, setAlertModalOpen] = useState(false);
    const [alertModalMessage, setAlertModalMessage] = useState("");

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
                        photo: data.photo || [],
                    });
                })
                .catch((error) => console.error('프로필 불러오기 에러:', error));
        }
    }, [authUser, overrideProfile]);

    useEffect(() => {
        if (authUser) {
            getFriendRequestList(authUser._id)
                .then((list) => setFriendRequests(list))
                .catch((error) => console.error("친구 요청 목록 로딩 실패:", error));
        }
    }, [authUser]);

    if (!profile) return <div>로딩 중...</div>;

    const isOwnProfile = !overrideProfile || (authUser && authUser._id === profile._id);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = async (e) => {
        const files = Array.from(e.target.files);
        const currentCount = formData.photo.length;
        if (currentCount + files.length > 6) {
            setAlertModalMessage("최대 6장까지 업로드 가능합니다.");
            setAlertModalOpen(true);
            return;
        }
        const newPhotoURLs = [];
        for (const file of files) {
            try {
                const url = await uploadFile(file);
                newPhotoURLs.push(url);
            } catch (err) {
                console.error('파일 업로드 중 에러 발생:', err);
            }
        }
        setFormData(prev => ({ ...prev, photo: [...prev.photo, ...newPhotoURLs] }));
    };

    const handleRemovePhoto = (index) => {
        setFormData(prev => {
            const newPhotos = prev.photo.filter((_, idx) => idx !== index);
            return { ...prev, photo: newPhotos };
        });
    };

    const handleSave = async () => {
        try {
            const updated = await updateUserProfile(authUser._id, formData);
            setProfile(updated);
            setEditMode(false);
        } catch (error) {
            console.error('프로필 업데이트 실패:', error);
        }
    };

    // 친구 요청 수락 처리
    const handleAcceptRequest = async (requestId) => {
        try {
            await acceptFriendRequest(authUser._id, requestId);
            setFriendRequests(prev => prev.filter(req => req._id !== requestId));
            setAlertModalMessage("친구 요청을 수락하였습니다.");
            setAlertModalOpen(true);
        } catch (error) {
            console.error("친구 요청 수락 실패:", error);
            setAlertModalMessage("친구 요청 수락에 실패했습니다.");
            setAlertModalOpen(true);
        }
    };

    // 친구 요청 거절 처리
    const handleDeclineRequest = async (requestId) => {
        try {
            await declineFriendRequest(authUser._id, requestId);
            setFriendRequests(prev => prev.filter(req => req._id !== requestId));
            setAlertModalMessage("친구 요청을 거절하였습니다.");
            setAlertModalOpen(true);
        } catch (error) {
            console.error("친구 요청 거절 실패:", error);
            setAlertModalMessage("친구 요청 거절에 실패했습니다.");
            setAlertModalOpen(true);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-2">프로필 정보</h2>
            <p className="mb-4">로코 코인: {profile.coinLeft}</p>
            <p className="mb-4">내 별점: {profile.star}</p>
            <div className="mb-6">
                <h3 className="text-xl font-semibold">친구 요청 목록</h3>
                {friendRequests.length > 0 ? (
                    friendRequests.map((req) => (
                        <div key={req._id} className="flex items-center justify-between border p-2 mb-2">
                            <div>
                                <p>{req.sender.nickname}님의 친구 요청</p>
                            </div>
                            <div className="flex">
                                <button
                                    onClick={() => handleAcceptRequest(req._id)}
                                    className="px-4 py-1 bg-green-500 text-white rounded mr-2"
                                >
                                    수락
                                </button>
                                <button
                                    onClick={() => handleDeclineRequest(req._id)}
                                    className="px-4 py-1 bg-red-500 text-white rounded"
                                >
                                    거절
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>처리 대기 중인 친구 요청이 없습니다.</p>
                )}
            </div>
            <div className="mb-4">
                <h3 className="text-xl font-semibold">프로필 사진 (최대 6장)</h3>
                <div className="flex flex-wrap gap-2">
                    {formData.photo && formData.photo.length > 0 ? (
                        formData.photo.slice(0, 6).map((url, idx) => (
                            <div key={idx} className="relative">
                                <img
                                    src={url}
                                    alt={`프로필 사진 ${idx + 1}`}
                                    className="w-20 h-20 object-cover rounded cursor-pointer"
                                />
                                {isOwnProfile && editMode && (
                                    <button
                                        onClick={() => handleRemovePhoto(idx)}
                                        className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <p>프로필 사진이 없습니다.</p>
                    )}
                </div>
                {isOwnProfile && editMode && (
                    <div className="mt-2">
                        <input type="file" accept="image/*" multiple onChange={handlePhotoChange}/>
                    </div>
                )}
            </div>
            <div className="mb-2">
                <strong>닉네임:</strong>
                {isOwnProfile && editMode ? (
                    <input type="text" name="nickname" value={formData.nickname} onChange={handleInputChange}
                           className="ml-2 border p-1"/>
                ) : (
                    <span className="ml-2">{profile.nickname}</span>
                )}
            </div>
            <div className="mb-2">
                <strong>자기소개:</strong>
                {isOwnProfile && editMode ? (
                    <textarea name="info" value={formData.info} onChange={handleInputChange}
                              className="ml-2 border p-1"/>
                ) : (
                    <span className="ml-2">{profile.info || '등록된 자기소개가 없습니다.'}</span>
                )}
            </div>
            <div className="mb-2">
                <strong>성별:</strong>
                {isOwnProfile && editMode ? (
                    <select name="gender" value={formData.gender} onChange={handleInputChange}
                            className="ml-2 border p-1">
                        <option value="male">남성</option>
                        <option value="female">여성</option>
                        <option value="select">선택 안함</option>
                    </select>
                ) : (
                    <span className="ml-2">{profile.gender || '미입력'}</span>
                )}
            </div>
            <div className="mb-2">
                <strong>생년월일:</strong>
                <span className="ml-2">{profile.birthdate || '미입력'}</span>
            </div>
            <div className="mb-2">
                <strong>롤/TFT 닉네임:</strong>
                {isOwnProfile && editMode ? (
                    <input type="text" name="lolNickname" value={formData.lolNickname} onChange={handleInputChange}
                           className="ml-2 border p-1"/>
                ) : (
                    <span className="ml-2">{profile.lolNickname || '미입력'}</span>
                )}
            </div>
            <div className="mb-2">
                <strong>서든닉네임:</strong>
                {isOwnProfile && editMode ? (
                    <input type="text" name="suddenNickname" value={formData.suddenNickname}
                           onChange={handleInputChange} className="ml-2 border p-1"/>
                ) : (
                    <span className="ml-2">{profile.suddenNickname || '미입력'}</span>
                )}
            </div>
            <div className="mb-2">
                <strong>배틀그라운드 닉네임:</strong>
                {isOwnProfile && editMode ? (
                    <input type="text" name="battleNickname" value={formData.battleNickname}
                           onChange={handleInputChange} className="ml-2 border p-1"/>
                ) : (
                    <span className="ml-2">{profile.battleNickname || '미입력'}</span>
                )}
            </div>
            <div className="mt-4">
                <h3 className="text-xl font-semibold">본인 QnA 내역</h3>
                {profile.qnaHistory && profile.qnaHistory.length > 0 ? (
                    <ul className="list-disc ml-6">
                        {profile.qnaHistory.map((qna, idx) => (
                            <li key={idx}>{qna}</li>
                        ))}
                    </ul>
                ) : (
                    <p>등록된 QnA 내역이 없습니다.</p>
                )}
            </div>
            {isOwnProfile && (
                <div className="mt-4">
                    {editMode ? (
                        <>
                            <button onClick={handleSave} className="px-4 py-2 bg-green-500 text-white rounded mr-2">
                                저장
                            </button>
                            <button onClick={() => setEditMode(false)}
                                    className="px-4 py-2 bg-gray-500 text-white rounded">
                                취소
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setEditMode(true)} className="px-4 py-2 bg-blue-500 text-white rounded">
                            수정
                        </button>
                    )}
                </div>
            )}
            {alertModalOpen && (
                <CommonModal
                    isOpen={alertModalOpen}
                    onClose={() => setAlertModalOpen(false)}
                    title="알림"
                    onConfirm={() => setAlertModalOpen(false)}
                    showCancel={false}
                >
                    {alertModalMessage}
                </CommonModal>
            )}
        </div>
    );
};

export default MyPageContent;
