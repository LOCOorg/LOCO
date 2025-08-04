// utils/dateUtils.js
export function toKST(utcString) {
    if (!utcString) return '';
    // 브라우저는 Date 생성 시 ISO-8601 문자열을 자동으로 UTC 로 해석
    const utcDate = new Date(utcString);

    // KST(UTC+9) 오프셋을 적용
    const kstOffsetMs = 9 * 60 * 60 * 1_000;
    const kstDate = new Date(utcDate.getTime() + kstOffsetMs);

    // YYYY-MM-DD HH:MM 형식으로 포맷
    return kstDate.toLocaleString('ko-KR', {
        year:   'numeric',
        month:  '2-digit',
        day:    '2-digit',
        hour:   '2-digit',
        minute: '2-digit',
        hour12: false,
    }).replace('. ', '-').replace('. ', '-').replace('.', '');
}
