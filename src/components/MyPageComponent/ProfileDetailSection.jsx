


export default function ProfileDetailSection({
                                                 profile,
                                                 formData,
                                                 isOwnProfile,
                                                 //editMode,
                                                 handleInputChange,
                                                 handleSave,
                                                 //setEditMode,

                                             }) {
    return (
        <div className="bg-white rounded-2xl p-8 space-y-6 shadow-md">
            <p className="mb-4">로코 코인: {profile.coinLeft}</p>
            <p className="mb-4">내 별점: {profile.star}</p>

            {/* 닉네임 */}
            <div className="mb-4 ">
                <strong className="w-32">닉네임</strong>
                {isOwnProfile  ? (
                    <input
                        type="text"
                        name="nickname"
                        value={formData.nickname}
                        onChange={handleInputChange}
                        className="mt-2 w-full bg-gray-100 rounded-lg px-4 py-2 focus:outline-none"
                    />
                ) : (
                    <span>{profile.nickname}</span>
                )}
            </div>

            {/* 자기소개 */}
            <div className="mb-4">
                <strong>자기소개</strong>
                {isOwnProfile  ? (
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

            {/* 성별 */}
            <div className="mb-4 ">
                <strong className="w-32">성별</strong>
                {isOwnProfile  ? (
                    <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="mt-2 w-full bg-gray-100 rounded-lg px-4 py-2 focus:outline-none"
                    >
                        <option value="male">남성</option>
                        <option value="female">여성</option>
                        <option value="select">선택 안함</option>
                    </select>
                ) : (
                    <span>{profile.gender || '미입력'}</span>
                )}
            </div>

            {/*/!* 생년월일 *!/*/}
            {/*<div className="mb-4 flex items-center">*/}
            {/*    <strong className="w-32">생년월일</strong>*/}
            {/*    <span>{profile.birthdate || '미입력'}</span>*/}
            {/*</div>*/}

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
                        onClick={handleSave}
                        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg
                        hover:from-purple-600 hover:to-pink-600
                        transition-colors duration-200 ease-in-out
                        focus:outline-none focus:ring-2 focus:ring-purple-300"
                    >
                        수정
                    </button>

                </div>
            )}
        </div>
    );
}
