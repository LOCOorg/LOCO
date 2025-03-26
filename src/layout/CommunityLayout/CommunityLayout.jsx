
// eslint-disable-next-line react/prop-types
const CommunityLayout = ({ leftSidebar, children, rightSidebar }) => {
    return (
        <div className="container mx-auto p-4 flex">
            <aside className="w-64 mr-6">{leftSidebar}</aside>
            <main className="flex-1 mr-6">{children}</main>
            <aside className="w-64">{rightSidebar}</aside>
        </div>
    );
};

export default CommunityLayout;
