// File: /src/components/DeveloperComponent/DeveloperComponent.jsx
// 이 컴포넌트는 개발자 페이지의 메인 화면으로, 좌측 검색 패널(40%)과 우측 상세 정보 패널(60%)으로 구성되어 있습니다.
import React, { useState } from "react";
import search from "../../hooks/Search.js";
import SearchPanel from "./SearchPanel.jsx";
import DetailPanel from "./DetailPanel.jsx";

const DeveloperComponent = () => {
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    // '/api/developer/users' API를 호출하여 유저 목록, 총 결과 수, 로딩 상태 및 에러를 받아옴
    const { results: users, total, loading, error } = search("/api/developer/users", query, page, 30);
    const [selectedUser, setSelectedUser] = useState(null);

    // 검색 결과 목록에서 유저를 선택하면 상세 정보 패널에 해당 유저 정보가 표시됩니다.
    const handleUserClick = (user) => {
        setSelectedUser(user);
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* 좌측 검색 패널 (40% 폭) */}
            <SearchPanel
                query={query}
                setQuery={setQuery}
                page={page}
                setPage={setPage}
                users={users}
                total={total}
                loading={loading}
                error={error}
                onUserClick={handleUserClick}
            />
            {/* 우측 상세 정보 패널 (60% 폭) */}
            <DetailPanel user={selectedUser} />
        </div>
    );
};

export default DeveloperComponent;




















//
// src/components/DeveloperComponent/DeveloperComponent.jsx
// import React, { useState } from 'react';
// import search from '../../hooks/Search.js';
//
// const DeveloperComponent = () => {
//     const [query, setQuery] = useState("");
//     const [page, setPage] = useState(1);
//     // 개발자 페이지에서는 고정 엔드포인트 '/api/developer/users'를 사용
//     const { results: users, total, loading, error } = search('/api/developer/users', query, page, 30);
//     const [selectedUser, setSelectedUser] = useState(null);
//
//     const handleUserClick = (user) => {
//         setSelectedUser(user);
//     };
//
//     return (
//         <div style={{ display: 'flex', height: '100vh' }}>
//             {/* 좌측 패널: 유저 검색 목록 */}
//             <div style={{ width: '30%', borderRight: '1px solid #ccc', padding: '10px', overflowY: 'auto' }}>
//                 <h2>유저 검색</h2>
//                 <input
//                     type="text"
//                     value={query}
//                     placeholder="검색어를 입력하세요."
//                     onChange={(e) => { setQuery(e.target.value); setPage(1); }}
//                     style={{ width: '100%', marginBottom: '10px' }}
//                 />
//                 {loading && <p>검색 중...</p>}
//                 {error && <p>에러 발생: {error.message}</p>}
//                 <p>총 {total} 건의 결과</p>
//                 <ul style={{ listStyle: "none", padding: 0 }}>
//                     {users.map(user => (
//                         <li
//                             key={user._id || user.id}
//                             style={{ cursor: 'pointer', borderBottom: '1px solid #eee', padding: '5px' }}
//                             onClick={() => handleUserClick(user)}
//                         >
//                             <strong>{user.name}</strong>
//                             <p>닉네임: {user.nickname}</p>
//                             <p>전화번호: {user.phone}</p>
//                             <p>성별: {user.gender}</p>
//                         </li>
//                     ))}
//                 </ul>
//                 {total > page * 30 && (
//                     <button onClick={() => setPage(page + 1)} style={{ width: '100%', padding: '8px' }}>
//                         더 보기
//                     </button>
//                 )}
//             </div>
//
//             {/* 우측 패널: 선택된 유저 상세정보 및 편집폼 */}
//             <div style={{ width: '70%', padding: '20px', overflowY: 'auto' }}>
//                 <h2>유저 상세정보</h2>
//                 {selectedUser ? (
//                     <UserDetail user={selectedUser} />
//                 ) : (
//                     <p>좌측 목록에서 유저를 선택하세요.</p>
//                 )}
//             </div>
//         </div>
//     );
// };
//
// const UserDetail = ({ user }) => {
//     const [formData, setFormData] = useState(user);
//
//     React.useEffect(() => {
//         setFormData(user);
//     }, [user]);
//
//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         // name이 중첩 필드일 경우 별도 파싱 로직 필요
//         setFormData(prev => ({
//             ...prev,
//             [name]: value
//         }));
//     };
//
//     const handleSave = async (e) => {
//         e.preventDefault();
//         try {
//             // 실제 API 호출: 예) axios.patch(`/api/developer/users/${formData._id}`, formData);
//             alert("유저 정보 저장 (API 호출 구현 필요)");
//         } catch (err) {
//             alert("업데이트 실패");
//         }
//     };
//
//     return (
//         <form onSubmit={handleSave}>
//             {/* 프로필 사진 */}
//             <div style={{ marginBottom: '10px' }}>
//                 <label>프로필 사진: </label>
//                 {formData.photo && formData.photo.length > 0 ? (
//                     <img src={formData.photo[0]} alt="Profile" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
//                 ) : (
//                     <p>사진 없음</p>
//                 )}
//             </div>
//             {/* 이름 */}
//             <div style={{ marginBottom: '10px' }}>
//                 <label>이름: </label>
//                 <input type="text" name="name" value={formData.name || ""} onChange={handleChange} />
//             </div>
//             {/* 닉네임 */}
//             <div style={{ marginBottom: '10px' }}>
//                 <label>닉네임: </label>
//                 <input type="text" name="nickname" value={formData.nickname || ""} onChange={handleChange} />
//             </div>
//             {/* 전화번호 */}
//             <div style={{ marginBottom: '10px' }}>
//                 <label>전화번호: </label>
//                 <input type="text" name="phone" value={formData.phone || ""} onChange={handleChange} />
//             </div>
//             {/* 생년월일 */}
//             <div style={{ marginBottom: '10px' }}>
//                 <label>생년월일: </label>
//                 <input type="text" name="birthdate" value={formData.birthdate || ""} onChange={handleChange} />
//             </div>
//             {/* 사용자 설정 성별 */}
//             <div style={{ marginBottom: '10px' }}>
//                 <label>성별: </label>
//                 <select name="gender" value={formData.gender || ""} onChange={handleChange}>
//                     <option value="male">남성</option>
//                     <option value="female">여성</option>
//                     <option value="select">선택안함</option>
//                 </select>
//             </div>
//             {/* 남은 재화 */}
//             <div style={{ marginBottom: '10px' }}>
//                 <label>남은 재화: </label>
//                 <input type="number" name="coinLeft" value={formData.coinLeft || 0} onChange={handleChange} />
//             </div>
//             {/* 구독정보 */}
//             <div style={{ marginBottom: '10px' }}>
//                 <label>구독정보: </label>
//                 {formData.plan ? (
//                     <div>
//                         <div>
//                             <label>구독 타입: </label>
//                             <input type="text" name="plan.planType" value={formData.plan.planType || ""} onChange={handleChange} />
//                         </div>
//                         <div>
//                             <label>구독 여부: </label>
//                             <input type="checkbox" name="plan.isPlan" checked={!!formData.plan.isPlan} onChange={(e) => {
//                                 setFormData(prev => ({
//                                     ...prev,
//                                     plan: { ...prev.plan, isPlan: e.target.checked }
//                                 }));
//                             }} />
//                         </div>
//                         <div>
//                             <label>시작일: </label>
//                             <input type="date" name="plan.startDate" value={formData.plan.startDate ? formData.plan.startDate.split('T')[0] : ""} onChange={handleChange} />
//                         </div>
//                         <div>
//                             <label>종료일: </label>
//                             <input type="date" name="plan.endDate" value={formData.plan.endDate ? formData.plan.endDate.split('T')[0] : ""} onChange={handleChange} />
//                         </div>
//                     </div>
//                 ) : (
//                     <p>구독 정보 없음</p>
//                 )}
//             </div>
//             {/* 연동된 계정정보 */}
//             <div style={{ marginBottom: '10px' }}>
//                 <label>연동된 계정정보: </label>
//                 <input type="text" name="accountLink" value={formData.accountLink || ""} onChange={handleChange} />
//             </div>
//             {/* 소셜 로그인 정보 */}
//             <div style={{ marginBottom: '10px' }}>
//                 <label>소셜 로그인 정보: </label>
//                 <textarea
//                     name="social"
//                     value={formData.social ? JSON.stringify(formData.social, null, 2) : ""}
//                     onChange={handleChange}
//                     style={{ width: "100%", height: "100px" }}
//                 />
//             </div>
//             {/* 별점 */}
//             <div style={{ marginBottom: '10px' }}>
//                 <label>별점: </label>
//                 <input type="number" name="star" value={formData.star || 0} onChange={handleChange} />
//             </div>
//             {/* 유저 등급 */}
//             <div style={{ marginBottom: '10px' }}>
//                 <label>유저 등급: </label>
//                 <input type="number" name="userLv" value={formData.userLv || 1} onChange={handleChange} />
//             </div>
//             {/* 신고 누적횟수 */}
//             <div style={{ marginBottom: '10px' }}>
//                 <label>신고 누적 횟수: </label>
//                 <input type="number" name="numOfReport" value={formData.numOfReport || 0} onChange={handleChange} />
//             </div>
//
//             <button type="submit">저장</button>
//         </form>
//     );
// };
//
// export default DeveloperComponent;
