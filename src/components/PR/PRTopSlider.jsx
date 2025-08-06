// src/components/pr/PRTopSlider.jsx
import React, {useState, useEffect, useRef, useLayoutEffect, useCallback} from "react";
import PRProfileCard from "./PRProfileCard";


const GAP_PX = 24;      // space-x-6 클래스의 gap (1.5rem = 24px)
const CARD_WIDTH = 240;
const AUTO_PLAY_MS = 3000; // 자동 재생 간격
const STEP = 1;

const PRTopSlider = ({ topUsers }) => {
    const containerRef = useRef(null);
    const resumeTimeoutRef = useRef(null);

    // 컨테이너 너비
    const [containerWidth, setContainerWidth] = useState(0);
    // 한 번에 보여줄 카드 수
    const [slideSize, setSlideSize] = useState(1);
    // 현재 슬라이드 인덱스
    const [sliderIndex, setSliderIndex] = useState(0);
    // 유저 상호작용 여부를 추적하여 자동 재생 중단
    const [isAutoPlay, setIsAutoPlay] = useState(true);



    // ① update 함수 정의
    const update = useCallback(() => {
        if (!containerRef.current) return;
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);

        const minCardTotal = 176 + GAP_PX;
        const rawCount = Math.floor((width + GAP_PX) / minCardTotal) || 1;
        const count = Math.min(rawCount, topUsers.length, 6);
        setSlideSize(count);
        setSliderIndex(idx => Math.min(idx, Math.max(0, topUsers.length - count)));
    }, [topUsers.length]);

    // ② 레이아웃 확정 직후(페인팅 전)에 한 번 실행해서 정확한 초기값 세팅
    useLayoutEffect(() => {
        update();
    }, [update]);

    // ③ ResizeObserver 로 이후 변화 모두 감지
    useLayoutEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver(() => {
            update();
        });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, [update]);

    // 카드 1개의 실제 너비(px)
    const itemWidth =
        containerWidth > 0
            ? (containerWidth - GAP_PX * (slideSize - 1)) / slideSize
            : 0;

    // 최대 인덱스
    const maxIndex = Math.max(0, topUsers.length - slideSize);

    // 2) 자동 재생: AUTO_PLAY_MS 간격으로 한 칸씩 이동, 끝에 다다르면 다시 0으로
    useEffect(() => {
        if (!isAutoPlay) return;
        const iv = setInterval(() => {
            setSliderIndex(i => (i >= maxIndex ? 0 : i + 1));
        }, AUTO_PLAY_MS);
        return () => clearInterval(iv);
    }, [maxIndex, isAutoPlay]);

    // 컴포넌트 언마운트 시 resume timeout 정리
    useEffect(() => () => {
        if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    }, []);

    // 자동 재생 일시정지 + 재개 예약
    const pauseAndScheduleResume = () => {
        setIsAutoPlay(false);
        if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = setTimeout(() => {
            setIsAutoPlay(true);
        }, AUTO_PLAY_MS);
    };

    // 3) 버튼 핸들러: 한 칸씩 이동
    const handlePrev = () => {
        pauseAndScheduleResume();
        setSliderIndex(i => Math.max(i - STEP, 0));
    };
    const handleNext = () => {
        pauseAndScheduleResume();
        setSliderIndex(i => Math.min(i + STEP, maxIndex));
    };


    return (
        <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">별점 랭킹 TOP 10</h2>


            <div className="flex items-center" >
                <button
                    onClick={handlePrev}
                    disabled={sliderIndex === 0}
                    className="text-2xl text-gray-500 disabled:text-gray-300 px-2"
                >
                    &lt;
                </button>
                {/* 슬라이드 뷰포트 */}
                <div className="overflow-hidden flex-1" ref={containerRef}>
                    <div
                        className="flex transition-transform duration-300"
                        style={{
                            transform: `translateX(-${sliderIndex * (itemWidth + GAP_PX)}px)`,
                            gap: `${GAP_PX}px`,
                        }}
                    >
                        {topUsers.map((user) => (
                            <div key={user._id} style={{ width: `${itemWidth}px`, flexShrink: 0 }}
                            >
                                <PRProfileCard user={user} />
                            </div>
                        ))}
                    </div>
                </div>
                <button
                    onClick={handleNext}
                    disabled={sliderIndex >= maxIndex}
                    className="text-2xl text-gray-500 disabled:text-gray-300 px-2"
                >
                    &gt;
                </button>
            </div>
        </section>
    );
};

export default PRTopSlider;
