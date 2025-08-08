import PropTypes from 'prop-types';

export default function LeagueRecordSection({ partnerRecords, loading, error }) {

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

                return (
                    <div key={index} className="bg-white rounded-lg p-4 mb-4 shadow-sm">
                        <div className="mb-4 pb-3 border-b border-gray-200">
                            <h3 className="text-base font-bold mb-2 text-gray-800">
                                {hasUserInfo ? record.userInfo.nickname : `파트너 ${index + 1}`}
                            </h3>

                            {/* 에러가 있는 경우 에러 메시지 표시 */}
                            {record.error && (
                                <div className="text-red-600 text-sm mb-2">
                                    전적 조회 실패: {record.error}
                                </div>
                            )}

                            {/* Riot ID 정보 표시 */}
                            {hasUserInfo && record.userInfo.riotGameName && (
                                <div className="text-sm text-gray-500 mb-2">
                                    {record.userInfo.riotGameName}#{record.userInfo.riotTagLine}
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
                                    최근 랭크전 {record.leagueRecord.recentRanked.length}판
                                </h4>

                                {/* Flex 레이아웃으로 변경하여 전체 너비 활용 */}
                                <div className="flex flex-wrap gap-2 justify-start">
                                    {record.leagueRecord.recentRanked.map((match, matchIndex) => (
                                        <div
                                            key={match.matchId || matchIndex}
                                            className={`flex flex-col items-center p-2.5 rounded border-2 transition-transform duration-200 hover:-translate-y-0.5 flex-shrink-0 ${
                                                match.win
                                                    ? 'bg-blue-50 border-green-400'
                                                    : 'bg-red-50 border-red-400'
                                            }`}
                                            style={{
                                                width: `calc((100% - ${(record.leagueRecord.recentRanked.length - 1) * 8}px) / ${record.leagueRecord.recentRanked.length})`,
                                                minWidth: '65px',
                                                maxWidth: '100px'
                                            }}
                                        >
                                            {/* 챔피언 이미지 */}
                                            <div className="mb-2 relative">
                                                {match.championImage ? (
                                                    <img
                                                        src={match.championImage}
                                                        alt={match.champion}
                                                        className="w-8 h-8 rounded-full border border-gray-300 object-cover"
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

                                            {/* 승패 결과 */}
                                            <div className={`text-sm font-bold mb-1 ${
                                                match.win ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {match.win ? '승' : '패'}
                                            </div>

                                            {/* 게임 통계 */}
                                            <div className="text-center space-y-0.5">
                                                <div className="text-xs text-gray-600">KDA {match.kda || 'N/A'}</div>
                                                <div className="text-xs text-gray-500">{match.cs || 'N/A'} CS</div>
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
};
