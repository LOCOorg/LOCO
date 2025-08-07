import useAuthStore from '../../stores/authStore.js';
import ProfileButton from "../../components/MyPageComponent/ProfileButton.jsx";

// eslint-disable-next-line react/prop-types
const LeftSidebar = ({ selectedCategory, handleCategoryClick }) => {
    // 현재 사용자 정보 (authStore에 저장되어 있다고 가정)
    const currentUser = useAuthStore((state) => state.user);
    const userNickname = currentUser
        ? currentUser.nickname || currentUser.name || currentUser.email || '사용자'
        : '로그인 해주세요';

    // 사용자 이니셜 (없을 땐 U)
    const userInitial =
        userNickname !== '로그인 해주세요' ? userNickname.charAt(0) : 'U';

    const categories = [
        '전체',
        '자유',
        '유머',
        '질문',
        '사건사고',
        '전적인증',
        '개발요청'
    ];

    return (
        <aside className="w-full lg:w-64 space-y-6 sticky top-20">
            {/* User Card */}
            <div className="flex items-center bg-white shadow-md rounded-lg p-4">
                <ProfileButton/>
                <div className="ml-3">
                    <p className="text-lg font-semibold text-gray-800">
                        {userNickname}님
                    </p>
                    <p className="text-sm text-gray-500">오늘도 좋은 하루 되세요 😊</p>
                </div>
            </div>

            {/* 내 활동 섹션 */}
            <div className="bg-white shadow-md rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-700 mb-3">내 활동</h2>
                <ul className="space-y-2">
                    {[
                        { label: '내가 쓴 글', key: '내 글' },
                        { label: '내가 댓글 쓴 글', key: '내 댓글' },
                    ].map((item) => (
                        <li key={item.key}>
                            <button
                                onClick={() => handleCategoryClick(item.key)}
                                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    selectedCategory === item.key
                                        ? 'bg-blue-500 text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                {item.label}
                                <svg
                                    className={`w-4 h-4 transition-transform ${
                                        selectedCategory === item.key ? 'rotate-90' : ''
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* 카테고리 섹션 */}
            <div className="bg-white shadow-md rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-700 mb-3">카테고리</h2>
                <ul className="space-y-2">
                    {categories.map((cat) => (
                        <li key={cat}>
                            <button
                                onClick={() => handleCategoryClick(cat)}
                                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    selectedCategory === cat
                                        ? 'bg-blue-500 text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                {cat}
                                {selectedCategory === cat && (
                                    <span className="text-xs text-white bg-blue-700 rounded-full px-2 py-0.5">
                    v
                  </span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    );
};

export default LeftSidebar;
