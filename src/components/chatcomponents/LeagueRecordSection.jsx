import { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useRefreshLeagueRecord } from '../../hooks/queries/useLeagueQueries';

/**
 * 갱신 버튼 컴포넌트
 * - 5분 쿨타임 적용
 * - 실시간 카운트다운 표시
 */
function RefreshButton({ gameName, tagLine, lastUpdatedAt, onRefreshSuccess }) {
    const [cooldown, setCooldown] = useState(0);
    const { mutate: refresh, isPending } = useRefreshLeagueRecord();

    // 쿨타임 계산 (5분 = 300초)
    const calculateCooldown = useCallback(() => {
        if (!lastUpdatedAt) return 0;
        const elapsed = Date.now() - new Date(lastUpdatedAt).getTime();
        const remaining = Math.max(0, 5 * 60 - Math.floor(elapsed / 1000));
        return remaining;
    }, [lastUpdatedAt]);

    // 1초마다 쿨타임 업데이트
    useEffect(() => {
        setCooldown(calculateCooldown());

        const timer = setInterval(() => {
            const remaining = calculateCooldown();
            setCooldown(remaining);
            if (remaining <= 0) {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [calculateCooldown]);

    // 쿨타임 포맷 (M:SS)
    const formatCooldown = (seconds) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    const handleRefresh = () => {
        if (cooldown > 0 || isPending) return;

        refresh(
            { gameName, tagLine },
            {
                onSuccess: (data) => {
                    // 쿨타임 리셋
                    setCooldown(5 * 60);
                    // 부모에게 갱신 성공 알림
                    if (onRefreshSuccess) {
                        onRefreshSuccess(gameName, tagLine, data);
                    }
                }
            }
        );
    };

    const isDisabled = isPending || cooldown > 0;

    return (
        <button
            onClick={handleRefresh}
            disabled={isDisabled}
            className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                isDisabled
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
            }`}
        >
            {isPending ? (
                <span className="flex items-center gap-1">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    갱신 중
                </span>
            ) : cooldown > 0 ? (
                `${formatCooldown(cooldown)} 후`
            ) : (
                '전적 갱신'
            )}
        </button>
    );
}

RefreshButton.propTypes = {
    gameName: PropTypes.string.isRequired,
    tagLine: PropTypes.string.isRequired,
    lastUpdatedAt: PropTypes.string,
    onRefreshSuccess: PropTypes.func,
};

/**
 * 마지막 갱신 시간 포맷
 */
function formatLastUpdated(lastUpdatedAt) {
    if (!lastUpdatedAt) return null;

    const now = Date.now();
    const updated = new Date(lastUpdatedAt).getTime();
    const diffMs = now - updated;
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    return `${diffDay}일 전`;
}

export default function LeagueRecordSection({ partnerRecords, loading, error, onRecordUpdate }) {
    const scrollRefs = useRef([]);

    useEffect(() => {
        const handleWheel = (e) => {
            const el = e.currentTarget;
            // 스크롤이 가능한 상태일 때만 동작
            if (el.scrollWidth > el.clientWidth && e.deltaY !== 0) {
                e.preventDefault();
                el.scrollLeft += e.deltaY;
            }
        };

        const refs = scrollRefs.current;
        refs.forEach((el) => {
            if (el) {
                el.addEventListener('wheel', handleWheel, { passive: false });
            }
        });

        return () => {
            refs.forEach((el) => {
                if (el) {
                    el.removeEventListener('wheel', handleWheel);
                }
            });
        };
    }, [partnerRecords]);

    if (loading) {
        return (
            <div className="p-4 bg-gray-50 rounded-lg my-3">
                <div className="text-center py-4 text-base text-gray-600">전적 정보를 불러오는 중...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-gray-50 rounded-lg my-3">
                <div className="text-center py-4 text-base text-red-600">
                    전적 조회 오류
                    <div className="text-sm text-gray-500 mt-1">
                        Riot ID 설정을 확인해주세요
                    </div>
                </div>
            </div>
        );
    }

    if (!partnerRecords || partnerRecords.length === 0) {
        return (
            <div className="p-4 bg-gray-50 rounded-lg my-3">
                <div className="text-center py-4 text-base text-gray-600">
                    전적 정보 없음
                    <div className="text-sm text-gray-500 mt-1">
                        상대방이 Riot ID를 설정하지 않음
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-50 rounded-lg my-3">
            {partnerRecords.map((record, index) => {
                const hasLeagueRecord = record.leagueRecord && typeof record.leagueRecord === 'object';
                const hasUserInfo = record.userInfo && typeof record.userInfo === 'object';
                const gameName = hasUserInfo ? record.userInfo.riotGameName : null;
                const tagLine = hasUserInfo ? record.userInfo.riotTagLine : null;
                const lastUpdatedAt = hasLeagueRecord ? record.leagueRecord.lastUpdatedAt : null;

                return (
                    <div key={record.participantId || index} className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                        <div className="mb-4 pb-3 border-b border-gray-200">
                            {/* 헤더: 닉네임 + Riot ID + 갱신 버튼 */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-base font-bold text-gray-800">
                                        {hasUserInfo ? record.userInfo.nickname : `파트너 ${index + 1}`}
                                    </h3>

                                    {gameName && tagLine && (
                                        <span className="text-sm text-gray-500">
                                            {gameName}#{tagLine}
                                        </span>
                                    )}
                                </div>

                                {/* 갱신 버튼 */}
                                {gameName && tagLine && (
                                    <RefreshButton
                                        gameName={gameName}
                                        tagLine={tagLine}
                                        lastUpdatedAt={lastUpdatedAt}
                                        onRefreshSuccess={onRecordUpdate}
                                    />
                                )}
                            </div>

                            {/* 마지막 갱신 시간 */}
                            {lastUpdatedAt && (
                                <div className="text-xs text-gray-400 mb-2">
                                    {formatLastUpdated(lastUpdatedAt)} 갱신됨
                                </div>
                            )}

                            {/* 에러가 있는 경우 에러 메시지 표시 */}
                            {record.error && (
                                <div className="text-red-600 text-sm mb-2">
                                    전적 조회 실패: {record.error}
                                </div>
                            )}

                            {hasLeagueRecord ? (
                                <div className="flex gap-3 flex-wrap text-sm">
                                    <span className="font-bold text-blue-600">
                                        {record.leagueRecord.tier || 'Unranked'} {record.leagueRecord.rank || ''}
                                    </span>
                                    <span className="text-gray-600">
                                        {record.leagueRecord.leaguePoints || 0} LP
                                    </span>
                                    <span className="text-green-600 font-medium">
                                        {record.leagueRecord.overallWinRate || 0}%
                                    </span>
                                </div>
                            ) : (
                                <div className="text-gray-500 text-sm">
                                    {record.error ? '전적 정보 없음' : '랭크 정보 없음'}
                                </div>
                            )}
                        </div>


                        {/* 최근 랭크전 - 데이터가 있을 때만 표시 */}
                        {hasLeagueRecord && record.leagueRecord.recentRanked && record.leagueRecord.recentRanked.length > 0 && (
                            <div className="recent-matches">
                                <h4 className="mb-3 text-gray-800 font-semibold text-sm">
                                    최근 솔로 랭크전 {record.leagueRecord.recentRanked.length}판
                                </h4>

                                {/* 가로 스크롤 가능하도록 변경 및 마우스 휠 이벤트 추가 */}
                                <div
                                    className="flex overflow-x-auto gap-2 justify-start pb-2 custom-scrollbar max-w-[440px]"
                                    ref={(el) => (scrollRefs.current[index] = el)}
                                >
                                    {record.leagueRecord.recentRanked.map((match, matchIndex) => (
                                        <div
                                            key={match.matchId || matchIndex}
                                            className={`flex flex-col items-center p-2.5 transition-transform duration-200 hover:-translate-y-0.5 flex-shrink-0`}
                                            style={{
                                                width: '80px'
                                            }}
                                        >
                                            {/* 챔피언 이미지 */}
                                            <div className="mb-2 relative">
                                                {match.championImage ? (
                                                    <img
                                                        src={match.championImage}
                                                        alt={match.champion}
                                                        className={`w-10 h-10 rounded-full border-4 ${
                                                            match.win
                                                                ? 'border-green-500 shadow-lg shadow-green-200'
                                                                : 'border-red-500 shadow-lg shadow-red-200'
                                                        }`}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <span
                                                    className={`${match.championImage ? 'hidden' : 'flex'} text-sm font-bold text-gray-600 text-center w-8 h-8 items-center justify-center bg-gray-100 rounded-full border border-gray-300`}
                                                >
                                                    {match.champion?.slice(0, 1) || 'N'}
                                                </span>
                                            </div>

                                            {/* 게임 통계 */}
                                            <div className="text-center space-y-1">
                                                <div className="text-xs text-gray-600">{match.lane || 'N/A'}</div>
                                                <div className="text-xs text-gray-600">KDA {match.kda || 'N/A'}</div>
                                                <div className="flex items-center justify-center text-xs font-medium">
                                                    <span className="text-gray-600">{match.kills || 0}</span>
                                                    <span className="text-gray-400 mx-1">/</span>
                                                    <span className="text-gray-600">{match.deaths || 0}</span>
                                                    <span className="text-gray-400 mx-1">/</span>
                                                    <span className="text-gray-600">{match.assists || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

LeagueRecordSection.propTypes = {
    partnerRecords: PropTypes.array.isRequired,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.string,
    onRecordUpdate: PropTypes.func,  // 갱신 성공 시 부모에게 알림
};
