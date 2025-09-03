// src/components/MainComponent.jsx
import FriendListPanel from './MyPageComponent/FriendListPanel.jsx';
import PaymentStatusModal     from './pay/PaymentStatusModal.jsx';
import ReportNotificationModal from './reportcomponents/ReportNotificationModal.jsx';
import MainBannerComponent from './bannerComponent/MainBannerComponent.jsx';

import RightSidebar from '../layout/CommunityLayout/RightSidebar.jsx';
import useSidebarData from '../hooks/useSidebarData.js';
import RandomChatComponent from "./chatcomponents/RandomChatComponent.jsx";

function MainComponent() {

    // 훅으로 사이드바 상태·데이터 모두 가져오기
    const { sideTab, setSideTab, topViewed, topCommented } = useSidebarData();

    return (
        <>
            <PaymentStatusModal />
            <ReportNotificationModal />

            <div className="flex flex-col lg:flex-row items-start justify-start min-h-screen bg-gray-50 p-6 lg:space-x-6">
                {/*/!* 왼쪽: 친구 목록 *!/*/}
                {/*<FriendListPanel />*/}

                {/* 중앙: 배너 + 주요 액션 버튼 */}
                <div className="flex flex-col items-center lg:items-start space-y-4 flex-1">
                    {/* 배너 영역 */}
                    <MainBannerComponent />
                    
                    <div className="w-full">
                        <RandomChatComponent />
                    </div>
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
