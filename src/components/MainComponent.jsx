// src/components/MainComponent.jsx
import PaymentStatusModal     from './pay/PaymentStatusModal.jsx';
import ReportNotificationModal from './reportcomponents/ReportNotificationModal.jsx';
import MainBannerComponent from './bannerComponent/MainBannerComponent.jsx';

import RightSidebar from '../layout/CommunityLayout/RightSidebar.jsx';
import useSidebarData from '../hooks/useSidebarData.js';
import { Link } from 'react-router-dom';
import { ChatBubbleLeftRightIcon, UserGroupIcon, TrophyIcon } from '@heroicons/react/24/solid';

function MainComponent() {

    // 훅으로 사이드바 상태·데이터 모두 가져오기
    const { sideTab, setSideTab, topViewed, topCommented } = useSidebarData();

    const navItems = [
        {
            path: '/chat',
            icon: <ChatBubbleLeftRightIcon className="w-10 h-10 text-white" />,
            title: '듀오찾기',
            description: '원하는 상대와 실시간으로 매칭하여 함께 게임을 즐겨보세요.',
            color: 'from-blue-500 to-blue-600'
        },
        {
            path: '/community',
            icon: <UserGroupIcon className="w-10 h-10 text-white" />,
            title: '커뮤니티',
            description: '자유롭게 소통하고 게임에 대한 다양한 정보를 공유하는 공간입니다.',
            color: 'from-green-500 to-green-600'
        },
        {
            path: '/pr',
            icon: <TrophyIcon className="w-10 h-10 text-white" />,
            title: '명예의 전당',
            description: '뛰어난 실력을 가진 사용자들을 확인하고 당신의 실력을 뽐내보세요.',
            color: 'from-yellow-500 to-yellow-600'
        }
    ];

    return (
        <>
            <PaymentStatusModal />
            <ReportNotificationModal />

            <div className="flex flex-col items-center justify-start min-h-screen bg-gray-50 p-6 space-y-6">
                {/* 배너 영역 */}
                <div className="w-full max-w-6xl">
                    <MainBannerComponent />
                </div>

                {/* 컨텐츠 영역: 네비게이션 버튼 + 사이드바 */}
                <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6">
                    {/* 네비게이션 버튼 영역 */}
                    <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {navItems.map((item) => (
                            <Link to={item.path} key={item.title} className={`group bg-gradient-to-br ${item.color} p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex flex-col text-white`}>
                                <div className="flex-shrink-0 bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                <p className="text-sm opacity-90 flex-grow">{item.description}</p>
                                <div className="mt-4 text-right font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    이동하기 →
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* 사이드바 영역 */}
                    <div className="lg:w-64 flex-shrink-0">
                        <RightSidebar
                            sideTab={sideTab}
                            setSideTab={setSideTab}
                            topViewed={topViewed}
                            topCommented={topCommented}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}

export default MainComponent;
