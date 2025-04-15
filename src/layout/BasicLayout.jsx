import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from '../stores/authStore';
import ChatNotification from "../components/chatcomponents/ChatNotification.jsx";
import { useSocket } from '../hooks/useSocket.js';
import CommonModal from '../common/CommonModal.jsx';

const BasicLayout = ({ children }) => {
    const { user } = useAuthStore();
    const socket = useSocket();
    const [friendRequestNotification, setFriendRequestNotification] = useState(null);

    useEffect(() => {
        if (socket && user) {
            // 로그인한 사용자의 ID로 소켓 서버에 등록 (룸 가입)
            socket.emit('register', user._id);
            // 서버에서 친구 신청 알림 이벤트 수신
            socket.on('friendRequestNotification', (data) => {
                setFriendRequestNotification(data);
            });
            return () => {
                socket.off('friendRequestNotification');
            };
        }
    }, [socket, user]);

    return (
        <div className="flex flex-col min-h-screen">
            <header className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
                <Link to="/" className="text-2xl font-bold">
                    LOCO
                </Link>
                <nav>
                    <ul className="flex space-x-4">
                        <li>
                            <Link to="/chat" className="hover:text-gray-300">
                                랜덤채팅
                            </Link>
                        </li>
                        <li>
                            <Link to="/products" className="hover:text-gray-300">
                                플랜보기
                            </Link>
                        </li>
                        <li>
                            <Link to="/community" className="hover:text-gray-300">
                                커뮤니티
                            </Link>
                        </li>
                        <li>
                            <Link to="/qna" className="hover:text-gray-300">
                                QNA
                            </Link>
                        </li>
                        {user && user.userLv >= 2 && (
                            <li>
                                <Link to="/report/list" className="hover:text-gray-300">
                                    관리자
                                </Link>
                            </li>
                        )}
                    </ul>
                </nav>
                <ChatNotification />
            </header>
            <main className="flex-1 p-4">
                {children}
            </main>
            <footer className="bg-gray-100 text-center py-2">
                © 2025 LOCO. All rights reserved.
            </footer>

            {/* 친구 신청 알림 모달 */}
            {friendRequestNotification && (
                <CommonModal
                    isOpen={true}
                    onClose={() => setFriendRequestNotification(null)}
                    title="친구 신청 알림"
                    onConfirm={() => setFriendRequestNotification(null)}
                    showCancel={false}
                >
                    {friendRequestNotification.message}
                </CommonModal>
            )}
        </div>
    );
};

export default BasicLayout;
