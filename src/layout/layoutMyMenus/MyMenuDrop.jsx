//src/layout/layoutMyMenus/MyMenuDrop.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MyMenus from "./MyMenus.jsx";
import LogoutButton from '../../components/authComponent/LogoutButton.jsx';
import DropdownTransition from '../css/DropdownTransition.jsx';


export default function MyMenuDrop({ user }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const closeTimer = useRef(null)


    const handleMouseEnter = () => {
        // 닫기 타이머가 있으면 취소
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
        setOpen(true);
    };

    const handleMouseLeave = () => {
        // 200ms 후에 닫기
        closeTimer.current = setTimeout(() => {
            setOpen(false);
            closeTimer.current = null;
        }, 150);
    };


    // 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = e => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);



    return (
        <div
            ref={ref}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <MyMenus src={user.profilePhoto} size={8} className="w-8 h-8 hover:scale-110" />

            {/* hover 시 나타날 드롭다운 */}
            <DropdownTransition
                show={open}
                as="div"
                className="absolute right-0 mt-2 w-56 bg-white rounded shadow-lg z-50 text-black"
            >
                    <div className="px-4 py-3 border-b">
                        <div className="flex items-center">
                            <MyMenus src={user.profilePhoto} size={10} />
                            <div className="ml-3">
                                <p className="font-semibold">{user.nickname}</p>
                            </div>
                        </div>
                    </div>
                    <ul className="py-1">
                        <li>
                            <Link
                                to="/mypage"
                                className="block px-4 py-2 hover:bg-gray-100 transition"
                            >
                                마이 페이지
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/wallet"
                                className="block px-4 py-2 hover:bg-gray-100 transition"
                            >
                                지갑
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/settings"
                                className="block px-4 py-2 hover:bg-gray-100 transition"
                            >
                                설정
                            </Link>
                        </li>
                        <LogoutButton/>
                        {/*<li onClick={logout}*/}
                        {/*    className="block px-4 py-2 hover:bg-gray-100 transition"*/}
                        {/*    role="button">*/}
                        {/*        로그아웃*/}
                        {/*</li>*/}
                    </ul>
                </DropdownTransition>
        </div>
    );
}
