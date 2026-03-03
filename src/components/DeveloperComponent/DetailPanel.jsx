// File: /src/components/DeveloperComponent/DetailPanel.jsx
// 이 컴포넌트는 우측 상세 정보 패널로, 선택된 유저의 정보를 편집하고 저장할 수 있도록 합니다.
// "이름", "전화번호", "생년월일" 필드는 readOnly로 처리되어 있으며,
// 저장 버튼 클릭 시 PATCH 요청을 통해 서버에 수정된 내용을 저장합니다.
import React, { useState, useEffect } from "react";
import instance from "../../api/axiosInstance.js";
import CommonModal from "../../common/CommonModal";

// 연령대 계산 함수
const getDetailedAgeGroup = (age) => {
    if (!age || age < 0 || age > 120) return '정보없음';
    
    // 미성년자 구분
    if (age < 10) return '유아';
    if (age >= 10 && age <= 13) return '10대 초반';
    if (age >= 14 && age <= 16) return '10대 중반';
    if (age >= 17 && age <= 19) return '10대 후반';
    
    // 성인 연령대 세분화
    const decade = Math.floor(age / 10) * 10;
    const ageInDecade = age - decade;
    
    let subGroup;
    if (ageInDecade <= 3) {
        subGroup = '초반';
    } else if (ageInDecade <= 6) {
        subGroup = '중반';
    } else {
        subGroup = '후반';
    }
    
    // 60세 이상은 단순화
    if (age >= 60) {
        return age >= 70 ? '70세 이상' : '60대';
    }
    
    return `${decade}대 ${subGroup}`;
};

const modes = [
    { key: "friends", label: "친구내역" },
    { key: "photos",  label: "사진 업로드내역" },
    { key: "nickname-history", label: "닉네임 히스토리" },
    { key: "gender-history", label: "성별 히스토리" },
    { key: "blocked-users", label: "차단목록" },
    // { key: "logs",    label: "활동 내역" },  // 예시로 추가 가능
];



const DetailPanel = ({ user, view, setView }) => {
    const [formData, setFormData] = useState(user || {});
    const [productNames, setProductNames] = useState([]);

    // 알림 모달 상태 추가
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    // 마운트 시에 /api/product/names 호출
    useEffect(() => {
        instance
            .get("/api/product/names")
            .then(res => setProductNames(res.data))
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        if (user) {
            setFormData(user);
        }
    }, [user]);

    if (!user) {
        return (
            <div className="w-1/3 p-6 overflow-y-auto">
                <h2 className="mb-4 text-2xl font-semibold border-b border-gray-300 pb-2">User Details</h2>
                <p>Please select a user from the search list.</p>
            </div>
        );
    }

    // 입력 필드 변경 이벤트 처리
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === "checkbox") {
            setFormData(prev => ({ ...prev, plan: { ...prev.plan, [name]: checked } }));
        } else if (name.startsWith("plan.")) {
            const key = name.split(".")[1];
            setFormData(prev => ({ ...prev, plan: { ...prev.plan, [key]: value } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // 저장 버튼 클릭 시 PATCH 요청 실행
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // PATCH 요청: 선택된 유저의 _id를 경로에 포함
            const response = await instance.patch(`/api/developer/users/${formData._id}`, formData);
            setAlertMessage("User info saved successfully!");
            setIsAlertOpen(true);
            // 필요에 따라 response 데이터를 이용해 state를 업데이트할 수 있습니다.
        } catch (err) {
            setAlertMessage("Update failed: " + err.message);
            setIsAlertOpen(true);
        }
    };

    return (
        <div className="w-1/3 p-6 bg-white overflow-y-auto">
            <h2 className="mb-4 text-2xl font-semibold border-b border-gray-300 pb-2">User Details</h2>
            <div className="flex flex-wrap gap-2 mb-4">
                    {modes.map(modeItem => (
                        <button
                            key={modeItem.key}
                            onClick={() => setView(modeItem.key)}
                            className={`px-3 py-1 rounded whitespace-nowrap ${
                                view === modeItem.key
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-200 text-gray-700"
                            }`}
                        >
                            {modeItem.label}
                        </button>
                    ))}
                </div>
                <div className="space-y-4 max-w-xl">
                {/* 프로필 사진 */}
                <div>
                    <label className="block font-bold mb-1">Profile Photo:</label>
                    {formData.profilePhoto
                        ? <img src={formData.profilePhoto} alt="Profile" className="w-32 h-32 object-cover rounded-md" />
                        : <span>No photo available</span>
                    }
                </div>
                {/* 가명처리된 이름 (readOnly) */}
                <div>
                    <label className="block font-bold mb-1">Name (가명처리):</label>
                    <div className="flex flex-col gap-2">
                        <input
                            type="text"
                            value={formData.displayName || '정보없음'}
                            readOnly
                            placeholder="가명처리된 이름 (성 제거 + 모음변경 + 배치섞기)"
                            className="bg-purple-50 cursor-not-allowed w-full p-3 border border-purple-300 rounded-md"
                        />
                        <span className="text-sm text-purple-600">
                            🎭 성 제거 + 2단계 가명처리 (법적 안전)
                        </span>
                        {formData.calculatedAge && (
                            <span className="text-sm text-green-600">
                                만 {formData.calculatedAge}세
                            </span>
                        )}
                        {process.env.NODE_ENV === 'development' && formData._debug && (
                            <div className="text-xs text-gray-500">
                                디버깅: {formData._debug.decryptedOriginal} → {formData._debug.pseudonymized}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* 마스킹된 전화번호 (readOnly) */}
                <div>
                    <label className="block font-bold mb-1">Phone (마스킹처리):</label>
                    <div className="flex flex-col gap-2">
                        <input
                            type="text"
                            value={formData.phone || '정보없음'}
                            readOnly
                            placeholder="마스킹된 전화번호 (예: ***-****-5678)"
                            className="bg-blue-50 cursor-not-allowed w-full p-3 border border-blue-300 rounded-md"
                        />
                        <span className="text-sm text-blue-600">
                            📱 개인정보 최소화 - 마지막 4자리만 표시
                        </span>
                    </div>
                </div>
                {/* 닉네임 (수정 가능) */}
                <div>
                    <label className="block font-bold mb-1">Nickname:</label>
                    <input
                        type="text"
                        name="nickname"
                        value={formData.nickname || ""}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                {/* 연령대 표시 (readOnly) */}
                <div>
                    <label className="block font-bold mb-1">Age Group:</label>
                    <div className="flex flex-col gap-2">
                        <input
                            type="text"
                            value={formData.displayAgeGroup || '정보없음'}
                            readOnly
                            placeholder="연령대 표시 (예: 20대 초반, 30대 중반)"
                            className="bg-green-50 cursor-not-allowed w-full p-3 border border-green-300 rounded-md"
                        />
                        <span className="text-sm text-green-600">
                            🎨 세분화된 연령대 (최소화 원칙 준수 + 재식별 위험 감소)
                        </span>
                        {/* 미성년자 여부 표시 */}
                        {formData.isMinor !== null && (
                            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded border">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    formData.isMinor ? 'bg-orange-200 text-orange-800' : 'bg-green-200 text-green-800'
                                }`}>
                                    {formData.isMinor ? '미성년자' : '성인'}
                                </span>
                                <span className="text-xs text-gray-600">
                                    ({formData.isMinor ? '성인 콘텐츠 제한' : '성인 콘텐츠 접근 가능'})
                                </span>
                            </div>
                        )}
                        {process.env.NODE_ENV === 'development' && formData._debug && (
                            <div className="text-xs text-gray-500">
                                디버깅: 나이 {formData._debug.calculatedAge}세 → {formData._debug.ageGroup}
                            </div>
                        )}
                    </div>
                </div>
                {/* 성별 (readOnly) */}
                <div>
                    <label className="block font-bold mb-1">Gender:</label>
                    <input
                        type="text"
                        value={formData.displayGender === 'male' ? '남성' : 
                               formData.displayGender === 'female' ? '여성' : 
                               formData.displayGender === 'select' ? '선택안함' : '정보없음'}
                        readOnly
                        className="bg-blue-50 cursor-not-allowed w-full p-3 border border-blue-300 rounded-md"
                    />
                    <span className="text-sm text-blue-600">
                        👤 성별 정보 (서비스 운영용)
                    </span>
                </div>
                {/* 남은 재화 */}
                <div>
                    <label className="block font-bold mb-1">Coin Left:</label>
                    <input
                        type="number"
                        name="coinLeft"
                        value={formData.coinLeft || 0}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                {/* 구독 정보 */}
                {formData.plan && (
                    <>
                        <div>
                            <label className="block font-bold mb-1">Plan Name:</label>
                            <select
                                name="plan.planName"
                                value={formData.plan.planName || ""}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">-- Select Plan --</option>
                                {productNames.map(p => (
                                    <option key={p._id} value={p.productName}>
                                        {p.productName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block font-bold mb-1">Plan Type:</label>
                            <select
                                name="plan.planType"
                                value={formData.plan.planType || "none"}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="none">None</option>
                                <option value="basic">Basic</option>
                                <option value="standard">Standard</option>
                                <option value="premium">Premium</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block font-bold mb-1">Plan Active:</label>
                            <input
                                type="checkbox"
                                name="isPlan"
                                checked={!!formData.plan.isPlan}
                                onChange={handleChange}
                                className="mr-2"
                            />
                            <span>Active</span>
                        </div>
                        <div>
                            <label className="block font-bold mb-1">Plan Start:</label>
                            <input
                                type="date"
                                name="plan.startDate"
                                value={formData.plan.startDate ? formData.plan.startDate.split("T")[0] : ""}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block font-bold mb-1">Plan End:</label>
                            <input
                                type="date"
                                name="plan.endDate"
                                value={formData.plan.endDate ? formData.plan.endDate.split("T")[0] : ""}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </>
                )}
                {/* 연동 계정 정보 */}
                <div>
                    <label className="block font-bold mb-1">Account Link:</label>
                    <input
                        type="text"
                        name="accountLink"
                        value={formData.accountLink || ""}
                        readOnly
                        //className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        className="bg-gray-100 cursor-not-allowed w-full p-3 border border-gray-300 rounded-md"
                    />
                </div>
                {/* 소셜 로그인 연동 상태 (간단한 표시) */}
                <div>
                    <label className="block font-bold mb-1">Social Login (연동상태):</label>
                    <div className="space-y-2">
                        {/* 카카오 연동 상태 */}
                        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded border">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-yellow-800">카카오:</span>
                                <span className={`px-2 py-1 rounded text-sm font-medium ${
                                    formData.social?.kakao?.providerId_hash ? 
                                    'bg-green-100 text-green-800' : 
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                    {formData.social?.kakao?.providerId_hash ? '연동됨' : '연동안됨'}
                                </span>
                            </div>
                        </div>
                        
                        {/* 네이버 연동 상태 */}
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded border">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-green-800">네이버:</span>
                                <span className={`px-2 py-1 rounded text-sm font-medium ${
                                    formData.social?.naver?.providerId_hash ? 
                                    'bg-green-100 text-green-800' : 
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                    {formData.social?.naver?.providerId_hash ? '연동됨' : '연동안됨'}
                                </span>
                            </div>
                        </div>
                        
                        {/* 연돐 계정 요약 */}
                        <div className="mt-3 p-2 bg-blue-50 rounded">
                            <div className="text-sm text-blue-700">
                                <span className="font-medium">연동 계정 수:</span> 
                                {(
                                    (formData.social?.kakao?.providerId_hash ? 1 : 0) + 
                                    (formData.social?.naver?.providerId_hash ? 1 : 0)
                                )}개
                            </div>
                        </div>
                    </div>
                </div>
                {/* 별점 */}
                <div>
                    <label className="block font-bold mb-1">Rating:</label>
                    <input
                        type="number"
                        name="star"
                        value={formData.star || 0}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                {/* 유저 레벨 */}
                <div>
                    <label className="block font-bold mb-1">User Level:</label>
                    <input
                        type="number"
                        name="userLv"
                        value={formData.userLv || 1}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                {/* 신고 횟수 */}
                <div>
                    <label className="block font-bold mb-1">Reports:</label>
                    <input
                        type="number"
                        name="numOfReport"
                        value={formData.numOfReport || 0}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                {/* 저장 버튼 */}
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={handleSave}
                        className="w-full py-3 bg-indigo-500 text-white rounded-md shadow-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        Save
                    </button>
                </div>
            </div>
            <CommonModal
                isOpen={isAlertOpen}
                onClose={() => setIsAlertOpen(false)}
                title="알림"
                onConfirm={() => setIsAlertOpen(false)}
                showCancel={false}
            >
                {alertMessage}
            </CommonModal>
        </div>
    );
};

export default DetailPanel;
