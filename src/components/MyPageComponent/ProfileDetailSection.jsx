import {useState, useEffect} from "react";
import {checkNickname, checkChangeAvailability} from "../../api/userAPI";
import {validateNicknameClient} from "../../utils/nicknameValidator.js";


export default function ProfileDetailSection({
                                                 profile,
                                                 formData,
                                                 isOwnProfile,
                                                 //editMode,
                                                 handleInputChange,
                                                 handleSave,
                                                 //setEditMode,

                                             }) {
    // 닉네임 중복 체크 관련 상태
    const [nicknameStatus, setNicknameStatus] = useState({
        available: null, // 초기값을 null로 변경
        message: "",
        loading: false
    });
    const [nicknameCheckTimeout, setNicknameCheckTimeout] = useState(null);
    const [isNicknameModified, setIsNicknameModified] = useState(false); // 닉네임 수정 여부 추가
    
    // 새로 추가: 변경 가능 여부 상태
    const [changeAvailability, setChangeAvailability] = useState({
        nickname: { canChange: true, lastChangeTime: null },
        gender: { canChange: true, lastChangeTime: null }
    });

    // 변경 가능 여부 확인
    useEffect(() => {
        if (profile._id && isOwnProfile) {
            checkChangeAvailability(profile._id)
                .then(response => {
                    setChangeAvailability(response.data);
                })
                .catch(error => {
                    console.error('변경 가능 여부 확인 실패:', error);
                });
        }
    }, [profile._id]); //[profile._id, isOwnProfile]);

    // 닉네임 중복 체크 함수 (기존 함수)
    const handleNicknameCheck = async (nicknameValue) => {
        // 1️⃣ 빈 값 체크
        if (!nicknameValue || nicknameValue.trim() === '') {
            setNicknameStatus({
                available: false,
                message: "닉네임을 입력해주세요.",
                loading: false
            });
            return;
        }

        // 현재 사용자의 닉네임과 같다면 메시지 표시하지 않음 (수정된 부분)
        if (nicknameValue === profile.nickname) {
            setNicknameStatus({
                available: true,
                message: "", // 메시지 없음
                loading: false
            });
            return;
        }

        // ⭐⭐⭐ 3️⃣ 클라이언트 validation (새로 추가!)
        const clientValidation = validateNicknameClient(nicknameValue);

        if (!clientValidation.valid) {
            // ✅ 클라이언트에서 걸러짐 → API 호출 안 함!
            setNicknameStatus({
                available: false,
                message: clientValidation.message,
                loading: false
            });
            return;  // ⭐ 여기서 종료 (API 호출 생략)
        }

        setNicknameStatus(prev => ({ ...prev, loading: true }));

        try {
            const result = await checkNickname(nicknameValue, profile._id);
            setNicknameStatus({
                available: result.available,
                message: result.message,
                loading: false
            });
        } catch (error) {
            setNicknameStatus({
                available: false,
                message: error.response?.data?.message || "닉네임 확인 중 오류가 발생했습니다.",
                loading: false
            });
        }
    };

    // 수정된 닉네임 입력 핸들러
    const handleNicknameChange = (e) => {
        const value = e.target.value;
        
        // 하루 제한 체크
        if (!changeAvailability.nickname.canChange) {
            return; // 입력 자체를 막음
        }
        
        setIsNicknameModified(true);
        handleInputChange(e);

        if (nicknameCheckTimeout) {
            clearTimeout(nicknameCheckTimeout);
        }

        const newTimeout = setTimeout(() => {
            handleNicknameCheck(value);
        }, 500);

        setNicknameCheckTimeout(newTimeout);
    };

    // 수정된 성별 변경 핸들러
    const handleGenderChange = (e) => {
        if (!changeAvailability.gender.canChange) {
            const lastChangeDate = changeAvailability.gender.lastChangeTime 
                ? new Date(changeAvailability.gender.lastChangeTime).toLocaleDateString('ko-KR')
                : '알 수 없음';
            alert(`성별은 하루에 1회만 변경 가능합니다. 마지막 변경일: ${lastChangeDate}`);
            return;
        }
        
        handleInputChange(e);
    };

    // 컴포넌트 마운트 시 초기화 (수정된 부분)
    useEffect(() => {
        // 초기 상태는 메시지 없음
        setNicknameStatus({
            available: true, // 저장 버튼 활성화를 위해 true
            message: "", // 메시지 없음
            loading: false
        });
        setIsNicknameModified(false); // 수정되지 않은 상태로 초기화
    }, [profile.nickname]);

    // 저장 버튼 클릭 시 닉네임 체크 (기존 함수)
    const handleSaveWithNicknameCheck = () => {
        // 닉네임이 수정되었고, 사용 불가능한 경우에만 경고
        if (isNicknameModified && nicknameStatus.available !== true) {
            alert("닉네임을 확인해주세요.");
            return;
        }
        handleSave();
    };

    // 닉네임 상태에 따른 스타일링 (수정된 부분)
    const getNicknameInputStyle = () => {
        let baseStyle = "mt-2 w-full bg-gray-100 rounded-lg px-4 py-2 focus:outline-none ";
        
        if (!changeAvailability.nickname.canChange) {
            return baseStyle + "opacity-50 cursor-not-allowed";
        }
        
        // 닉네임이 수정되지 않았다면 기본 스타일
        if (!isNicknameModified) {
            return baseStyle;
        }
        
        if (nicknameStatus.loading) {
            return baseStyle + "border border-gray-300";
        }
        
        if (nicknameStatus.available === true) {
            return baseStyle + "border border-green-500";
        }
        
        if (nicknameStatus.available === false) {
            return baseStyle + "border border-red-500";
        }
        
        return baseStyle;
    };

    const getNicknameMessageStyle = () => {
        if (nicknameStatus.available === true) {
            return "text-green-600 text-sm mt-1";
        }
        
        if (nicknameStatus.available === false) {
            return "text-red-600 text-sm mt-1";
        }
        
        return "text-gray-500 text-sm mt-1";
    };

    return (
        <div className="bg-white rounded-2xl p-8 space-y-6 shadow-md">
            <p className="mb-4">로코 코인: {profile.coinLeft}</p>
            <p className="mb-4">내 별점: {profile.star}</p>

            {/* 닉네임 (제한 표시 추가) */}
            <div className="mb-4">
                <strong className="w-32">닉네임</strong>
                {isOwnProfile ? (
                    <div>
                        <input
                            type="text"
                            name="nickname"
                            value={formData.nickname}
                            onChange={handleNicknameChange}
                            className={getNicknameInputStyle()}
                            placeholder="2-12자로 입력해주세요"
                            disabled={!changeAvailability.nickname.canChange}
                        />
                        {/* 제한 정보 표시 */}
                        {!changeAvailability.nickname.canChange && (
                            <div className="text-orange-600 text-sm mt-1">
                                ⚠️ 오늘 이미 닉네임을 변경했습니다. 내일 다시 변경 가능합니다.
                                {changeAvailability.nickname.lastChangeTime && (
                                    <span className="block text-gray-500">
                                        마지막 변경: {new Date(changeAvailability.nickname.lastChangeTime).toLocaleDateString('ko-KR')}
                                    </span>
                                )}
                            </div>
                        )}
                        {/* 기존 닉네임 상태 메시지 */}
                        {isNicknameModified && changeAvailability.nickname.canChange && (
                            <div className={getNicknameMessageStyle()}>
                                {nicknameStatus.loading && "닉네임 확인 중..."}
                                {!nicknameStatus.loading && nicknameStatus.message}
                            </div>
                        )}
                    </div>
                ) : (
                    <span>{profile.nickname}</span>
                )}
            </div>

            {/* 자기소개 */}
            <div className="mb-4">
                <strong>자기소개</strong>
                {isOwnProfile ? (
                    <textarea
                        name="info"
                        value={formData.info}
                        onChange={handleInputChange}
                        className="mt-2 w-full bg-gray-100 rounded-lg px-4 py-2 h-24 resize-none focus:outline-none"
                    />
                ) : (
                    <p className="mt-2">{profile.info || '등록된 자기소개가 없습니다.'}</p>
                )}
            </div>

            {/* 성별 (제한 표시 추가) */}
            <div className="mb-4">
                <strong className="w-32">성별</strong>
                {isOwnProfile ? (
                    <div>
                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleGenderChange}
                            className={`mt-2 w-full bg-gray-100 rounded-lg px-4 py-2 focus:outline-none ${
                                !changeAvailability.gender.canChange ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            disabled={!changeAvailability.gender.canChange}
                        >
                            <option value="male">남성</option>
                            <option value="female">여성</option>
                            <option value="select">선택 안함</option>
                        </select>
                        {/* 제한 정보 표시 */}
                        {!changeAvailability.gender.canChange && (
                            <div className="text-orange-600 text-sm mt-1">
                                ⚠️ 오늘 이미 성별을 변경했습니다. 내일 다시 변경 가능합니다.
                                {changeAvailability.gender.lastChangeTime && (
                                    <span className="block text-gray-500">
                                        마지막 변경: {new Date(changeAvailability.gender.lastChangeTime).toLocaleDateString('ko-KR')}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <span>{profile.gender || '미입력'}</span>
                )}
            </div>

            {/* 게임 닉네임들 */}
            {['lolNickname', 'suddenNickname', 'battleNickname'].map((key) => (
                <div key={key} className="mb-4">
                    <strong className="w-32">
                        {{
                            lolNickname: '롤/TFT 닉네임',
                            suddenNickname: '서든닉네임',
                            battleNickname: '배틀그라운드 닉네임'
                        }[key]}
                    </strong>
                    {isOwnProfile ? (
                        <input
                            type="text"
                            name={key}
                            value={formData[key]}
                            onChange={handleInputChange}
                            className="mt-2 w-full bg-gray-100 rounded-lg px-4 py-2 focus:outline-none"
                        />
                    ) : (
                        <span>{profile[key] || '미입력'}</span>
                    )}
                </div>
            ))}

            {/* 버튼 */}
            {isOwnProfile && (
                <div className="mt-6 flex space-x-2">
                    <button
                        onClick={handleSaveWithNicknameCheck}
                        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg
                        hover:from-purple-600 hover:to-pink-600
                        transition-colors duration-200 ease-in-out
                        focus:outline-none focus:ring-2 focus:ring-purple-300
                        disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={isNicknameModified && nicknameStatus.available !== true}
                    >
                        수정
                    </button>
                </div>
            )}
        </div>
    );
}
