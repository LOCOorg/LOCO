//src/layout/css/DropdownTransition.jsx

import { Fragment } from "react";
import { Transition } from "@headlessui/react";

/**
 * DropdownTransition
 * 재사용 가능한 드롭다운 애니메이션 컴포넌트입니다.
 *
 * Props:
 *  - show: boolean    // 드롭다운 열림 여부
 *  - as: React.ElementType (optional) // Transition을 감쌀 엘리먼트 타입, 기본은 Fragment
 *  - className: string (optional)     // 래퍼 div의 추가 클래스
 *  - children: React.ReactNode        // 드롭다운 내용
 */
export default function DropdownTransition({
                                               show,
                                               as = Fragment,
                                               className = "",
                                               children,
                                           }) {
    return (
        <Transition
            as={as}
            show={show}
            enter="transition ease-out duration-200 transform"
            enterFrom="opacity-0 scale-95 origin-center"
            enterTo="opacity-100 scale-100 origin-center"
            leave="transition ease-in duration-150 transform"
            leaveFrom="opacity-100 scale-100 origin-center"
            leaveTo="opacity-0 scale-95 origin-center"
        >
            <div className={className}>
                {children}
            </div>
        </Transition>
    );
}
