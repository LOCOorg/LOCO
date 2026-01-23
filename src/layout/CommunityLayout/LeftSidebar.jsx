// eslint-disable-next-line react/prop-types
const LeftSidebar = ({ selectedCategory, handleCategoryClick }) => {

    const categories = [
        '전체',
        '자유',
        '유머',
        '질문',
        '사건사고',
        '전적인증',
        '개발요청'
    ];

    const myActivities = [
        { label: '내 글', key: '내 글' },
        { label: '내 댓글', key: '내 댓글' },
    ];

    return (
        <aside className="w-full lg:w-64 space-y-4 lg:space-y-6 lg:sticky lg:top-24">

            {/* 내 활동 및 카테고리 통합 섹션 (모바일에서 가로 스크롤) */}
            <div className="lg:bg-white lg:shadow-md lg:rounded-lg lg:p-4 overflow-x-auto custom-scrollbar">
                <div className="flex lg:flex-col gap-2 pb-2 lg:pb-0">
                    <h2 className="hidden lg:block text-lg font-semibold text-gray-700 mb-3">내 활동</h2>
                    {myActivities.map((item) => (
                        <button
                            key={item.key}
                            onClick={() => handleCategoryClick(item.key)}
                            className={`flex items-center justify-between shrink-0 lg:w-full px-4 lg:px-3 py-2 rounded-full lg:rounded-lg text-sm font-medium transition-all ${
                                selectedCategory === item.key
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white lg:bg-transparent text-gray-700 border border-gray-200 lg:border-none hover:bg-gray-100 shadow-sm lg:shadow-none'
                            }`}
                        >
                            <span className="whitespace-nowrap">{item.label}</span>
                            <svg
                                className={`hidden lg:block w-4 h-4 transition-transform ${
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
                    ))}

                    <div className="hidden lg:block border-t border-gray-100 my-4"></div>
                    <h2 className="hidden lg:block text-lg font-semibold text-gray-700 mb-3">카테고리</h2>
                    
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => handleCategoryClick(cat)}
                            className={`flex items-center justify-between shrink-0 lg:w-full px-4 lg:px-3 py-2 rounded-full lg:rounded-lg text-sm font-medium transition-all ${
                                selectedCategory === cat
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-white lg:bg-transparent text-gray-700 border border-gray-200 lg:border-none hover:bg-gray-100 shadow-sm lg:shadow-none'
                            }`}
                        >
                            <span className="whitespace-nowrap">{cat}</span>
                            {selectedCategory === cat && (
                                <span className="hidden lg:inline-flex text-[10px] text-white bg-blue-700 rounded-full w-4 h-4 items-center justify-center">
                                    ✓
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </aside>
    );
};

export default LeftSidebar;
