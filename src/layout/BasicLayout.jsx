import { Link } from 'react-router-dom';

const BasicLayout = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
                <Link to="/" className="text-2xl font-bold">
                    LOCO
                </Link>
                <nav>
                    <ul className="flex space-x-4">
                        <li>
                            <Link to="/chat" className="hover:text-gray-300">랜덤채팅</Link>
                        </li>
                        <li>
                            <Link to="/community" className="hover:text-gray-300">커뮤니티</Link>
                        </li>
                        <li>
                            <Link to="/products" className="hover:text-gray-300">플랜보기</Link>
                        </li>
                        <li>
                            <Link to="/qna" className="hover:text-gray-300">QNA</Link>
                        </li>
                    </ul>
                </nav>
            </header>
            <main className="flex-1 p-4">
                {children}
            </main>
            <footer className="bg-gray-100 text-center py-2">
                © 2025 LOCO. All rights reserved.
            </footer>
        </div>
    );
};

export default BasicLayout;
