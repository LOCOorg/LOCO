// eslint-disable-next-line react/prop-types
const CommunityLayout = ({ leftSidebar, children, rightSidebar }) => {
    return (
        <div className="container mx-auto p-4 flex flex-col lg:flex-row gap-6">
            {/* 왼쪽 사이드바 (모바일에서는 상단) */}
            <aside className="w-full lg:w-64 shrink-0">
                {leftSidebar}
            </aside>

            {/* 메인 콘텐츠 */}
            <main className="flex-1 min-w-0">
                {children}
            </main>

            {/* 오른쪽 사이드바 (모바일에서는 하단) */}
            <aside className="w-full lg:w-80 shrink-0">
                {rightSidebar}
            </aside>
        </div>
    );
};

export default CommunityLayout;
