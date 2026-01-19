// src/components/MainComponent.jsx
import ReportNotificationModal from './reportcomponents/ReportNotificationModal.jsx';
import MainBannerComponent from './bannerComponent/MainBannerComponent.jsx';

import RightSidebar from '../layout/CommunityLayout/RightSidebar.jsx';
import useSidebarData from '../hooks/useSidebarData.js';
import { Link } from 'react-router-dom';
import { ChatBubbleLeftRightIcon, TrophyIcon } from '@heroicons/react/24/solid';
import Footer from "../components/common/Footer.jsx";

function MainComponent() {

    // 훅으로 사이드바 상태·데이터 모두 가져오기
    const { sideTab, setSideTab, topViewed, topCommented } = useSidebarData();

    const navItems = [
        {
            path: '/chat',
            icon: <ChatBubbleLeftRightIcon className="w-12 h-12 text-white opacity-90" />,
            title: '듀오찾기',
            description: '원하는 상대와 실시간으로 매칭하여 함께 게임을 즐겨보세요.',
            colorClasses: 'bg-blue-500 hover:bg-blue-600'
        },
        {
            path: '/pr',
            icon: <TrophyIcon className="w-12 h-12 text-white opacity-90" />,
            title: '명예의 전당',
            description: '뛰어난 실력을 가진 사용자들을 확인하고 당신의 실력을 뽐내보세요.',
            colorClasses: 'bg-yellow-500 hover:bg-yellow-600'
        }
    ];

    return (
        <>
            <ReportNotificationModal />

            <div className="flex flex-col items-center justify-start min-h-screen bg-gray-50 p-6 space-y-6">
                {/* 배너 영역 */}
                <div className="w-full max-w-6xl">
                    <MainBannerComponent />
                </div>

                {/* 컨텐츠 영역: 네비게이션 버튼 + 사이드바 */}
                <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6">
                    {/* 네비게이션 버튼 영역 */}
                    <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {navItems.map((item) => (
                            <Link to={item.path} key={item.title} className={`group ${item.colorClasses} p-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex flex-col text-white`}>
                                <div className="mb-4">
                                    {item.icon}
                                </div>
                                <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                                <p className="text-base opacity-80 mb-auto">{item.description}</p>
                                <div className="mt-4 text-right font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    이동하기 →
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* 사이드바 영역 */}
                    <div className="lg:w-96 flex-shrink-0">
                        <RightSidebar
                            sideTab={sideTab}
                            setSideTab={setSideTab}
                            topViewed={topViewed}
                            topCommented={topCommented}
                        />
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}

export default MainComponent;
