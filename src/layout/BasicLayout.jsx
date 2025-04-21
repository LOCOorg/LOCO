import { Link } from 'react-router-dom';
import ChatNotification from "../components/chatcomponents/ChatNotification.jsx";
import useAuthStore from '../stores/authStore';
import FriendRequestNotification from "../components/MyPageComponent/FriendRequestNotification.jsx";

const BasicLayout = ({ children }) => {
    const { user } = useAuthStore();

    return (
        <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-50 bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
            <Link to="/" className="text-2xl font-bold">LOCO</Link>
                <nav>
                    <ul className="flex space-x-4">
                        <li>
                            <Link to="/chat" className="hover:text-gray-300">랜덤채팅</Link>
                        </li>
                        <li>
                            <Link to="/products" className="hover:text-gray-300">플랜보기</Link>
                        </li>
                        <li>
                            <Link to="/community" className="hover:text-gray-300">커뮤니티</Link>
                        </li>
                        <li>
                            <Link to="/qna" className="hover:text-gray-300">QNA</Link>
                        </li>
                        {user && user.userLv >= 2 && (
                            <li>
                                <Link to="/report/list" className="hover:text-gray-300">관리자</Link>
                            </li>
                        )}
                    </ul>
                </nav>
                <ChatNotification />
                <FriendRequestNotification/>
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
