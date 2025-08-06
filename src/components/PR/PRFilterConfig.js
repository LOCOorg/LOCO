// /constants/PRFilterConfig.js
export const sortOptions = [
    { value: 'recommend', label: '추천순' },
    { value: 'new',       label: '신규 가입' },
    { value: 'rating',    label: '별점 높은순' },
    { value: 'lowRating',  label: '별점 낮은순' },
    { value: 'online', label: '온라인' },
];

export const genderOptions = [
    { value: 'all',   label: '모두' },
    { value: 'female',label: '여성' },
    { value: 'male',  label: '남성' },
];

export const tierOptions = [
    '챌린저','그랜드 마스터','마스터','다이아몬드',
    '에메랄드','플래티넘','골드','실버','브론즈','아이언','언랭크'
].map(g => ({ value: g, label: g }));