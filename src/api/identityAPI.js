// src/api/identityAPI.js
// 포트원 V2 본인인증 관련 API
import instance from './axiosInstance';

/**
 * 본인인증 결과를 서버로 전송하여 검증
 * @param {string} identityVerificationId - 포트원에서 발급받은 인증 ID
 */
export const verifyIdentity = (identityVerificationId) =>
    instance.post('/api/identity/verify', { identityVerificationId })
        .then((res) => res.data);

/**
 * 현재 세션의 본인인증 상태 확인
 */
export const getIdentityStatus = () =>
    instance.get('/api/identity/status')
        .then((res) => res.data);
