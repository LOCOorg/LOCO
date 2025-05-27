// src/components/MainComponent.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore.js';
import FriendListPanel from './MyPageComponent/FriendListPanel.jsx';
import MyPageButton    from './MyPageComponent/MyPageButton.jsx';
import PlanButton      from './product/PlanButton.jsx';
import PRButton        from './PR/PRButton.jsx';
import PaymentStatusModal     from './pay/PaymentStatusModal.jsx';
import ReportNotificationModal from './reportcomponents/ReportNotificationModal.jsx';

import RightSidebar from '../layout/CommunityLayout/RightSidebar.jsx';
import useSidebarData from '../hooks/useSidebarData.js';
import RandomChatComponent from "./chatcomponents/RandomChatComponent.jsx";

function MainComponent() {
    const navigate = useNavigate();
    const authUser = useAuthStore((state) => state.user);
    const logout   = useAuthStore((state) => state.logout);

    // 훅으로 사이드바 상태·데이터 모두 가져오기
    const { sideTab, setSideTab, topViewed, topCommented } = useSidebarData();

    return (
        <>
            <PaymentStatusModal />
            <ReportNotificationModal />

            <div className="flex flex-col lg:flex-row items-start justify-start min-h-screen bg-gray-50 p-6 lg:space-x-6">
                {/* 왼쪽: 친구 목록 */}
                <FriendListPanel />

                <div className="w-full lg:w-1/3">
                    <RandomChatComponent />
                </div>

                {/* 중앙: 주요 액션 버튼 */}
                <div className="flex flex-col items-center lg:items-start space-y-4 flex-1">
                    <MyPageButton />
                    <button
                        onClick={() => navigate('/chat')}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-500"
                    >
                        랜덤 채팅
                    </button>
                    <button
                        onClick={() => {
                            if (authUser) logout();
                            navigate('/loginPage');
                        }}
                        className="px-6 py-3 bg-purple-500 text-white rounded-lg shadow-md hover:bg-purple-600 focus:ring-2 focus:ring-purple-500"
                    >
                        {authUser ? '로그아웃' : '로그인'}
                    </button>

                    <PlanButton />
                    <PRButton />
                </div>

                {/* 오른쪽: 분리된 사이드바 (lg 이상에서만 표시) */}
                <div className="hidden lg:block w-1/4">
                    <RightSidebar
                        sideTab={sideTab}
                        setSideTab={setSideTab}
                        topViewed={topViewed}
                        topCommented={topCommented}
                    />
                </div>
            </div>
        </>
    );
}

export default MainComponent;
