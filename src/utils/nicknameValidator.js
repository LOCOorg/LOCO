// src/utils/nicknameValidator.js

/**
 * 🎯 닉네임 클라이언트 검증 유틸리티
 * 목적: API 호출 전 기본 검증으로 서버 부하 50% 절감
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 설정 상수 (백엔드와 동일하게 유지)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const NICKNAME_MIN_LENGTH = 2;
const NICKNAME_MAX_LENGTH = 12;
const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9._-]+$/;
const FORBIDDEN_WORDS = ['관리자', 'admin', 'root', 'system', '운영자'];

/**
 * 종합 닉네임 검증 (메인 함수)
 *
 * @param {string} nickname - 검증할 닉네임
 * @returns {{valid: boolean, message: string}}
 *
 * @example
 * validateNicknameClient("홍길동")
 * // → { valid: true, message: "" }
 *
 * validateNicknameClient("a")
 * // → { valid: false, message: "닉네임은 최소 2자 이상이어야 합니다." }
 */
export const validateNicknameClient = (nickname) => {
    // 1️⃣ 빈 값 체크
    if (!nickname || nickname.trim() === '') {
        return {
            valid: false,
            message: '닉네임을 입력해주세요.'
        };
    }

    // 2️⃣ 길이 체크 (2-12자)
    if (nickname.length < NICKNAME_MIN_LENGTH) {
        return {
            valid: false,
            message: `닉네임은 최소 ${NICKNAME_MIN_LENGTH}자 이상이어야 합니다.`
        };
    }

    if (nickname.length > NICKNAME_MAX_LENGTH) {
        return {
            valid: false,
            message: `닉네임은 최대 ${NICKNAME_MAX_LENGTH}자까지 가능합니다.`
        };
    }

    // 3️⃣ 특수문자 체크 (한글, 영문, 숫자, ., _, - 만 허용)
    if (!NICKNAME_REGEX.test(nickname)) {
        return {
            valid: false,
            message: '닉네임에는 한글, 영문, 숫자, ., _, - 만 사용 가능합니다.'
        };
    }

    // 4️⃣ 금지어 체크
    const lowerNickname = nickname.toLowerCase();
    const hasForbiddenWord = FORBIDDEN_WORDS.some(word =>
        lowerNickname.includes(word.toLowerCase())
    );

    if (hasForbiddenWord) {
        return {
            valid: false,
            message: '사용할 수 없는 닉네임입니다.'
        };
    }

    // ✅ 모든 검증 통과
    return {
        valid: true,
        message: ''
    };
};

/**
 * 실시간 피드백용 경량 검증 (선택사항)
 * 타이핑 중 즉각적인 UI 피드백을 위한 간단한 검증
 */
export const quickValidateNickname = (nickname) => {
    // 빈 값은 에러 표시 안 함 (사용자가 아직 입력 중)
    if (!nickname || nickname.trim() === '') {
        return { valid: null, message: '' };
    }

    // 길이만 빠르게 체크
    if (nickname.length < NICKNAME_MIN_LENGTH) {
        return {
            valid: false,
            message: `${nickname.length}/${NICKNAME_MIN_LENGTH} (최소 ${NICKNAME_MIN_LENGTH}자)`
        };
    }

    if (nickname.length > NICKNAME_MAX_LENGTH) {
        return {
            valid: false,
            message: `${nickname.length}/${NICKNAME_MAX_LENGTH} (최대 ${NICKNAME_MAX_LENGTH}자 초과)`
        };
    }

    return { valid: null, message: '' };
};