import useAuthStore from '../../stores/authStore.js';

const categories = ['전체', '자유', '유머', '질문', '사건사고', '전적인증'];

// eslint-disable-next-line react/prop-types
const LeftSidebar = ({ selectedCategory, handleCategoryClick }) => {
    // 현재 사용자 정보 (authStore에 저장되어 있다고 가정)
    const currentUser = useAuthStore((state) => state.user);
    const userNickname = currentUser
        ? (currentUser.nickname || currentUser.name || currentUser.email || '사용자')
        : '로그인 해주세요';

    return (
        <div>
            {/* 사용자 닉네임 표시 영역 */}
            <div className="mb-6">
                <p className="text-lg font-bold">{userNickname}님</p>
            </div>
            {/* 내 활동 섹션 */}
            <div className="mt-6">
                <h2 className="text-xl font-bold mb-4">내 활동</h2>
                <ul className="space-y-2">
                    <li>
                        <button
                            onClick={() => handleCategoryClick('내 글')}
                            className={`block w-full text-left px-3 py-2 rounded ${
                                selectedCategory === '내 글' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                            }`}
                        >
                            내가 쓴 글
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => handleCategoryClick('내 댓글')}
                            className={`block w-full text-left px-3 py-2 rounded ${
                                selectedCategory === '내 댓글' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                            }`}
                        >
                           내가 댓글 쓴 글
                        </button>
                    </li>
                </ul>
            </div>
            <h2 className="text-xl font-bold mb-4">카테고리</h2>
            <ul className="space-y-2">
                {categories.map((cat) => (
                    <li key={cat}>
                        <button
                            onClick={() => handleCategoryClick(cat)}
                            className={`block w-full text-left px-3 py-2 rounded ${
                                selectedCategory === cat ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                            }`}
                        >
                            {cat}
                        </button>
                    </li>
                ))}
            </ul>

        </div>
    );
};

export default LeftSidebar;
