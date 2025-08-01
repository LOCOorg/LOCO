// File: /src/components/DeveloperComponent/DetailPanel.jsx
// 이 컴포넌트는 우측 상세 정보 패널로, 선택된 유저의 정보를 편집하고 저장할 수 있도록 합니다.
// "이름", "전화번호", "생년월일" 필드는 readOnly로 처리되어 있으며,
// 저장 버튼 클릭 시 PATCH 요청을 통해 서버에 수정된 내용을 저장합니다.
import React, { useState, useEffect } from "react";
import axios from "axios";


const modes = [
    { key: "friends", label: "친구내역" },
    { key: "photos",  label: "사진 업로드내역" },
    // { key: "logs",    label: "활동 내역" },  // 예시로 추가 가능
];



const DetailPanel = ({ user, view, setView }) => {
    if (!user) {
        return (
            <div className="w-1/3 p-6 overflow-y-auto">
                <h2 className="mb-4 text-2xl font-semibold border-b border-gray-300 pb-2">User Details</h2>
                <p>Please select a user from the search list.</p>
            </div>
        );
    }

    const [formData, setFormData] = useState(user);
    const [productNames, setProductNames] = useState([]);


    // 마운트 시에 /api/product/names 호출
    useEffect(() => {
        axios
            .get("/api/product/names")
            .then(res => setProductNames(res.data))
            .catch(err => console.error(err));
        }, []);


    useEffect(() => {
        setFormData(user);
    }, [user]);

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
            const response = await axios.patch(`/api/developer/users/${formData._id}`, formData);
            alert("User info saved successfully!");
            // 필요에 따라 response 데이터를 이용해 state를 업데이트할 수 있습니다.
        } catch (err) {
            alert("Update failed: " + err.message);
        }
    };

    return (
        <div className="w-1/3 p-6 bg-white overflow-y-auto">
            <h2 className="mb-4 text-2xl font-semibold border-b border-gray-300 pb-2">User Details</h2>
            <div className="space-y-4 max-w-xl">
                <div className="flex space-x-2 mb-4">
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
                {/* 프로필 사진 */}
                <div>
                    <label className="block font-bold mb-1">Profile Photo:</label>
                    {formData.profilePhoto
                        ? <img src={formData.profilePhoto} alt="Profile" className="w-32 h-32 object-cover rounded-md" />
                        : <span>No photo available</span>
                    }
                </div>
                {/* 이름 (수정 불가능) */}
                <div>
                    <label className="block font-bold mb-1">Name:</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name || ""}
                        readOnly
                        className="bg-gray-100 cursor-not-allowed w-full p-3 border border-gray-300 rounded-md"
                    />
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
                {/* 전화번호 (수정 불가능) */}
                <div>
                    <label className="block font-bold mb-1">Phone:</label>
                    <input
                        type="text"
                        name="phone"
                        value={formData.phone || ""}
                        readOnly
                        className="bg-gray-100 cursor-not-allowed w-full p-3 border border-gray-300 rounded-md"
                    />
                </div>
                {/* 생년월일 (수정 불가능) */}
                <div>
                    <label className="block font-bold mb-1">Birthdate:</label>
                    <input
                        type="text"
                        name="birthdate"
                        value={formData.birthdate || ""}
                        readOnly
                        className="bg-gray-100 cursor-not-allowed w-full p-3 border border-gray-300 rounded-md"
                    />
                </div>
                {/* 성별 */}
                <div>
                    <label className="block font-bold mb-1">Gender:</label>
                    <select
                        name="gender"
                        value={formData.gender || ""}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="select">Prefer not to say</option>
                    </select>
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
                {/* 소셜 로그인 정보 */}
                <div>
                    <label className="block font-bold mb-1">Social Info:</label>
                    <textarea
                        name="social"
                        value={formData.social ? JSON.stringify(formData.social, null, 2) : ""}
                        readOnly
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-48"
                    />
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
        </div>
    );
};

export default DetailPanel;
