// utils/dateUtils.js
export function toKST(isoUtcString) {
    if (!isoUtcString) return '';

    // 항상 UTC로 파싱
    const date = new Date(isoUtcString);

    // Intl API로 한국 시간대 포맷
    return date.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year:   'numeric',
        month:  '2-digit',
        day:    '2-digit',
        hour:   '2-digit',
        minute: '2-digit',
        hour12: false
    }).replace(/\./g, '').replace(' ', '-');
}
