// src/layouts/BasicLayout.jsx
import { Link, Outlet } from 'react-router-dom';
import ChatNotification from "../components/chatcomponents/ChatNotification.jsx";
import useAuthStore from '../stores/authStore';
import FriendChatDropdown from '../components/MyPageComponent/FriendChatDropdown.jsx';
import FriendRequestNotification from '../components/MyPageComponent/FriendRequestNotification.jsx';
import React, {useEffect, useRef, useState} from "react";
//import LogoutButton from '../components/authComponent/LogoutButton.jsx';
//import MyMenus from './layoutMyMenus/MyMenus.jsx';
import MyMenuDrop from "./layoutMyMenus/MyMenuDrop.jsx";
import DropdownTransition from './css/DropdownTransition.jsx';


const BasicLayout = ({ children }) => {
    const { user } = useAuthStore();
    const [overflowOpen, setOverflowOpen] = useState(false);

    // ① 드롭다운 전체를 감쌀 ref
    const dropdownRef = useRef(null);

    // ② 외부 클릭 감지용 useEffect
    useEffect(() => {
        if (!overflowOpen) return;

        const handleClickOutside = (e) => {
            // ref.current가 정의되어 있고, 클릭한 타겟이 그 영역 안에 없으면
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOverflowOpen(false);
            }
        };
        // 드롭다운이 열렸을 때만 리스너 등록
        if (overflowOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [overflowOpen]);



    return (
        <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-50 bg-blue-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
                <Link to="/" className="text-2xl font-bold">LOCO</Link>


                <nav className="relative overflow-hidden">
                    <ul className="flex space-x-4 whitespace-nowrap">
                        <li><Link to="/chat" className="hover:text-gray-300">랜덤채팅</Link></li>
                        <li><Link to="/products" className="hover:text-gray-300">플랜보기</Link></li>
                        <li><Link to="/PR" className="hover:text-gray-300">P R</Link></li>


                        <li><Link to="/community" className="hover:text-gray-300">커뮤니티</Link></li>
                        <li><Link to="/qna" className="hover:text-gray-300">QNA</Link></li>
                        {user && user.userLv >= 2 && (
                            <li ><Link to="/report/list" className="hover:text-gray-300">관리자</Link></li>
                        )}
                        {user && user.userLv >= 3 && (
                            <li ><Link to="/adminproducts" className="hover:text-gray-300">상품등록</Link></li>
                        )}
                        {user && user.userLv >= 3 && (
                            <li ><Link to="/developer" className="hover:text-gray-300">개발자</Link></li>
                        )}
                    </ul>
                </nav>










                 {/*flex-nowrap whitespace-nowrap overflow-x-auto*/}
                <div className="flex items-center space-x-4 flex-nowrap whitespace-nowrap flex-shrink-0">
                    {/* overflow 버튼 */}
                    <ul className="lg:hidden relative" ref={dropdownRef}>
                        <button
                            onClick={() => setOverflowOpen(!overflowOpen)}
                            className="ml-2 px-2 py-1 hover:bg-blue-700 rounded"
                        >
                            …
                        </button>

                        <DropdownTransition
                            show={overflowOpen}
                            as="div"
                            className="absolute right-0 mt-2 w-48 bg-white text-black rounded shadow-sm z-50"
                        >

                            <ul onClick={() => setOverflowOpen(false)}>
                                <li><Link to="/chat" className="block px-4 py-2 hover:bg-gray-100">랜덤채팅</Link></li>
                                <li><Link to="/products" className="block px-4 py-2 hover:bg-gray-100">플랜보기</Link></li>
                                <li><Link to="/PR" className="block px-4 py-2 hover:bg-gray-100">PR</Link></li>
                                <li><Link to="/community" className="block px-4 py-2 hover:bg-gray-100">커뮤니티</Link></li>
                                <li><Link to="/qna" className="block px-4 py-2 hover:bg-gray-100">QNA</Link></li>
                                {user && user.userLv >= 2 && (
                                    <li><Link to="/report/list" className="block px-4 py-2 hover:bg-gray-100">관리자</Link></li>
                                )}
                                {user && user.userLv >= 3 && (
                                    <>
                                        <li><Link to="/adminproducts" className="block px-4 py-2 hover:bg-gray-100">상품등록</Link></li>
                                        <li><Link to="/developer" className="block px-4 py-2 hover:bg-gray-100">개발자</Link></li>
                                    </>
                                )}
                            </ul>
                        </DropdownTransition>
                    </ul>
                    <FriendChatDropdown />
                    <ChatNotification />
                    <FriendRequestNotification />
                    {user ? (
                        //<LogoutButton />
                        // 내부에서 authStore.user._id 로 프로필을 가져와 렌더링
                        <MyMenuDrop user={user} />
                    ) : (
                        <Link to="/loginPage">
                            <button className="hover:text-gray-300 whitespace-nowrap">로그인</button>
                        </Link>
                    )}
                </div>
            </header>

            <main className="flex-1 p-4">{children}
                <Outlet />
            </main>

            <footer className="bg-gray-100 text-center py-2">
                © 2025 LOCO. All rights reserved.
            </footer>
        </div>
    );
};

export default BasicLayout;
