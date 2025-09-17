import { useState, useEffect } from 'react';
import { getQnaPageByStatus } from '../../api/qnaAPI.js';

const QnaHistoryComponent = ({ profile }) => {
    const [qnaHistory, setQnaHistory] = useState([]);
    const [activeQnaId, setActiveQnaId] = useState(null);

    useEffect(() => {
        if (profile?._id) {
            const fetchQnaHistory = async () => {
                try {
                    const waitingRes = await getQnaPageByStatus(1, 100, '답변대기', profile.nickname, 'author');
                    const answeredRes = await getQnaPageByStatus(1, 100, '답변완료', profile.nickname, 'author');
                    const allQnas = [...(waitingRes.dtoList || []), ...(answeredRes.dtoList || [])];
                    setQnaHistory(allQnas.sort((a, b) => new Date(b.qnaRegdate) - new Date(a.qnaRegdate)));
                } catch (error) {
                    console.error("QnA 내역을 불러오는데 실패했습니다.", error);
                }
            };
            fetchQnaHistory();
        }
    }, [profile]);

    return (
        <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2">본인 QnA 내역</h3>
            {qnaHistory.length > 0 ? (
                <div className="space-y-2">
                    {qnaHistory.map((qna) => (
                        <div key={qna._id} className="border rounded-lg">
                            <button
                                onClick={() => setActiveQnaId(activeQnaId === qna._id ? null : qna._id)}
                                className="w-full text-left p-4 flex justify-between items-center"
                            >
                                <span className="font-medium">{qna.qnaTitle}</span>
                                <span className={`transform transition-transform ${activeQnaId === qna._id ? 'rotate-180' : ''}`}>▼</span>
                            </button>
                            {activeQnaId === qna._id && (
                                <div className="p-4 border-t">
                                    <p className="mb-2"><strong>내용:</strong> {qna.qnaContents}</p>
                                    <p><strong>답변:</strong> {qna.qnaAnswer || '답변 대기 중'}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p>등록된 QnA 내역이 없습니다.</p>
            )}
        </div>
    );
};

export default QnaHistoryComponent;
