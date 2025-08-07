// src/components/layout/NotificationToggleButton.jsx
import { useRef, useState, useEffect } from 'react';
import DropdownTransition     from '../../src/layout/css/DropdownTransition.jsx';
import NotificationDropdown   from './NotificationDropdown.jsx';
import { IoSettingsOutline }  from 'react-icons/io5';

const NotificationToggleButton = () => {
    const [open, setOpen] = useState(false);
    const btnRef = useRef(null);

    /* ───────── 외부 클릭 시 드롭다운 닫기 ───────── */
    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e) => {
            if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    return (
        <div className="relative" ref={btnRef}>
            {/* 버튼: 종(벨) → 톱니바퀴로 교체 */}
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-center hover:text-gray-400 p-2 text-white focus:outline-none"
            >
                <IoSettingsOutline className="h-6 w-6" />   {/* ← 아이콘 한 줄만 남기면 끝 */}
            </button>

            {/* 드롭다운 */}
            <DropdownTransition show={open} className="absolute right-0 mt-2">
                <NotificationDropdown />
            </DropdownTransition>
        </div>
    );
};

export default NotificationToggleButton;
