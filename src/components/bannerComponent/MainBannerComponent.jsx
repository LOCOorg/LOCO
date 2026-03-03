import { useState, useEffect, useRef } from 'react';
import { bannerService } from '../../api/bannerAPI.js';

const MainBannerComponent = () => {
    const [banners, setBanners] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isHovered, setIsHovered] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        loadBanners();
    }, []);

    // 자동 슬라이드 효과
    useEffect(() => {
        if (banners.length > 1 && !isHovered) {
            intervalRef.current = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % banners.length);
            }, 4000); // 4초마다 변경
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [banners.length, isHovered]);

    const loadBanners = async () => {
        try {
            setLoading(true);
            const response = await bannerService.getActiveBanners();
            // console.log('🎯 배너 데이터:', response); // 디버깅용
            
            if (response.success && response.data.length > 0) {
                setBanners(response.data);
                // console.log('🎯 설정된 배너들:', response.data); // 디버깅용
            } else {
                // 테스트용 더미 배너 데이터
                console.log('❌ 활성 배너가 없습니다. 테스트 배너를 표시합니다.');
                setBanners([
                    {
                        _id: 'test-1',
                        title: '테스트 배너',
                        description: '배너 시스템이 정상 작동 중입니다',
                        linkUrl: '/news',
                        image: {
                            path: 'banners/banner-1755705067287-705440952.jpg'
                        }
                    }
                ]);
            }
        } catch (error) {
            console.error('배너 로딩 오류:', error);
            // 에러 시에도 테스트 배너 표시
            setBanners([
                {
                    _id: 'test-error',
                    title: '테스트 배너 (에러 발생)',
                    description: '배너 API 연결에 문제가 있습니다',
                    linkUrl: '/',
                    image: {
                        path: 'banners/banner-1755705067287-705440952.jpg'
                    }
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleBannerClick = (banner) => {
        if (banner.linkUrl) {
            // 조회수 증가는 응답을 기다리지 않음 (Fire and Forget)
            bannerService.incrementViews(banner._id).catch(error => {
                console.error('배너 조회수 증가 실패 (백그라운드):', error);
            });

            // A-09 보안 조치: URL 허용목록 검증 (http://, https://, / 만 허용)
            const url = banner.linkUrl;
            if (url.startsWith('https://') || url.startsWith('http://')) {
                window.open(url, '_blank', 'noopener,noreferrer');
            } else if (url.startsWith('/')) {
                window.location.href = url;
            } else {
                console.warn('허용되지 않는 배너 URL 형식:', url);
            }
        }
    };

    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    const goToPrevious = () => {
        setCurrentIndex(prev => 
            prev === 0 ? banners.length - 1 : prev - 1
        );
    };

    const goToNext = () => {
        setCurrentIndex(prev => 
            (prev + 1) % banners.length
        );
    };

    // 이미지 URL 생성 함수
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        
        // 이미 완전한 URL인 경우
        if (imagePath.startsWith('http')) {
            return imagePath;
        }
        
        // uploads로 시작하는 경우 API_HOST와 결합
        const baseUrl = import.meta.env.VITE_API_HOST;
        
        // 경로 정규화 (이중 슬래시 방지)
        const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
        
        return `${baseUrl}${normalizedPath}`;
    };

    // 배너가 없거나 로딩 중이면 표시하지 않음
    if (loading) {
        return (
            <div className="w-full h-64 md:h-80 lg:h-96 mb-8 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
                <div className="text-gray-500">배너 로딩 중...</div>
            </div>
        );
    }

    if (banners.length === 0) {
        return (
            <div className="w-full h-64 md:h-80 lg:h-96 mb-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="text-4xl mb-4">🎮</div>
                    <h2 className="text-2xl font-bold mb-2">LOCO에 오신 것을 환영합니다!</h2>
                    <p className="text-lg opacity-90">게임 커뮤니티와 실시간 채팅을 즐겨보세요</p>
                </div>
            </div>
        );
    }

    const currentBanner = banners[currentIndex];
    const imageUrl = getImageUrl(currentBanner.image?.path);

    return (
        <div 
            className="relative w-full h-64 md:h-80 lg:h-96 mb-8 overflow-hidden rounded-lg shadow-lg group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* 배너 이미지 */}
            {imageUrl ? (
                <div 
                    className={`w-full h-full bg-cover bg-center transition-all duration-500 ${
                        currentBanner.linkUrl ? 'cursor-pointer' : ''
                    }`}
                    style={{
                        backgroundImage: `url(${imageUrl})`
                    }}
                    onClick={() => handleBannerClick(currentBanner)}
                    onError={(e) => {
                        console.error('이미지 로드 실패:', imageUrl);
                        e.target.style.display = 'none';
                    }}
                >
                    {/* 오버레이 그라디언트 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent">
                        {/* 배너 텍스트 */}
                        <div className="absolute bottom-8 left-8 text-white">
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 drop-shadow-lg">
                                {currentBanner.title}
                            </h2>
                            {currentBanner.description && (
                                <p className="text-sm md:text-base lg:text-lg opacity-90 drop-shadow-md max-w-md">
                                    {currentBanner.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                // 이미지 로드 실패 시 대체 배너
                <div 
                    className={`w-full h-full bg-gradient-to-r from-gray-500 to-gray-700 flex items-center justify-center ${
                        currentBanner.linkUrl ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => handleBannerClick(currentBanner)}
                >
                    <div className="text-white text-center">
                        <div className="text-6xl mb-4">🖼️</div>
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 drop-shadow-lg">
                            {currentBanner.title}
                        </h2>
                        {currentBanner.description && (
                            <p className="text-sm md:text-base lg:text-lg opacity-90 drop-shadow-md max-w-md">
                                {currentBanner.description}
                            </p>
                        )}
                        <p className="text-sm opacity-75 mt-2">이미지를 불러올 수 없습니다</p>
                    </div>
                </div>
            )}

            {/* 이전/다음 버튼 */}
            {banners.length > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-all duration-200 opacity-0 group-hover:opacity-100"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-all duration-200 opacity-0 group-hover:opacity-100"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </>
            )}

            {/* 페이지네이션 인디케이터 */}
            {banners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                index === currentIndex
                                    ? 'bg-white scale-110'
                                    : 'bg-white/50 hover:bg-white/75'
                            }`}
                            aria-label={`배너 ${index + 1}로 이동`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MainBannerComponent;
