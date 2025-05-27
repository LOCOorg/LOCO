import PropTypes from 'prop-types';

export default function LeagueRecordSection({ partnerRecords, loading, error }) {
    return (
        <aside className="w-full md:w-1/3 bg-gray-50 shadow-inner rounded-lg overflow-y-auto p-6">
            <h3 className="text-xl font-bold mb-4">상대방 전적</h3>

            {loading && <p>로딩 중…</p>}
            {error && <p className="text-red-500">{error}</p>}

            {partnerRecords.map(({ participantId, userInfo, leagueRecord, error }) => (
                <div key={participantId} className="mb-6 border-b pb-4">
                    {error ? (
                        <p className="text-red-500">
                            {userInfo?.nickname || '사용자'}: {error}
                        </p>
                    ) : (
                        <>
                            <div className="mb-2">
                                <span className="font-medium">{userInfo.nickname}</span>
                                <span className="text-sm text-gray-600 ml-2">
                  ({userInfo.riotGameName}#{userInfo.riotTagLine})
                </span>
                            </div>
                            <div className="text-center mb-2">
                                <p className="text-lg">
                                    <strong>티어:</strong> {leagueRecord.tier} {leagueRecord.rank} ({leagueRecord.leaguePoints} LP)
                                </p>
                                <p className="text-2xl text-blue-600">
                                    <strong>승률:</strong> {leagueRecord.overallWinRate}%
                                </p>
                            </div>
                            {leagueRecord.recentRanked.length > 0 ? (
                                <ul className="space-y-2 text-sm">
                                    {leagueRecord.recentRanked.map(game => (
                                        <li
                                            key={game.matchId}
                                            className="flex justify-between bg-white p-2 rounded shadow-sm"
                                        >
                      <span>
                        <strong>{game.champion}</strong> {game.win ? '승' : '패'}
                      </span>
                                            <div className="flex space-x-2">
                                                <span>KDA {game.kda}</span>
                                                <span>CS {game.cs}</span>
                                                <span>
                          {Math.floor(game.duration / 60)}:
                                                    {String(game.duration % 60).padStart(2, '0')}
                        </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-500">아직 랭크전 전적이 없습니다.</p>
                            )}
                        </>
                    )}
                </div>
            ))}
        </aside>
    );
}

LeagueRecordSection.propTypes = {
    partnerRecords: PropTypes.array.isRequired,
    loading:        PropTypes.bool.isRequired,
    error:          PropTypes.string,
};
