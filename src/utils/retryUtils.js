/**
 * 🔄 API 호출 재시도 유틸리티
 * 
 * @description
 * 네트워크 오류나 일시적 서버 문제 발생 시 자동으로 재시도하는 함수
 * 지수 백오프(Exponential Backoff) 전략 사용
 * 
 * @example
 * await retryWithBackoff(
 *   () => decrementChatCount(userId),
 *   { maxRetries: 3, delayMs: 1000 }
 * );
 */

/**
 * 지정된 시간만큼 대기하는 Promise
 * @param {number} ms - 대기 시간 (밀리초)
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 재시도 가능한 오류인지 판단
 * @param {Error} error - 발생한 오류
 * @returns {boolean} 재시도 가능 여부
 */
const isRetriableError = (error) => {
    // 네트워크 오류
    if (error.message?.includes('Network') || 
        error.message?.includes('fetch') ||
        error.message?.includes('timeout')) {
        return true;
    }
    
    // HTTP 5xx 서버 오류 (일시적 문제 가능성)
    if (error.response?.status >= 500 && error.response?.status < 600) {
        return true;
    }
    
    // HTTP 429 Too Many Requests (과부하)
    if (error.response?.status === 429) {
        return true;
    }
    
    // 기타 일시적 오류
    if (error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNREFUSED') {
        return true;
    }
    
    return false;
};

/**
 * 재시도가 필요 없는 치명적 오류인지 판단
 * @param {Error} error - 발생한 오류
 * @returns {boolean} 치명적 오류 여부
 */
const isFatalError = (error) => {
    // HTTP 4xx 클라이언트 오류 (재시도 불가)
    if (error.response?.status >= 400 && error.response?.status < 500) {
        // 429는 제외 (재시도 가능)
        if (error.response?.status !== 429) {
            return true;
        }
    }
    
    // 인증 오류
    if (error.response?.status === 401 || error.response?.status === 403) {
        return true;
    }
    
    return false;
};

/**
 * 지수 백오프 전략으로 함수 재시도
 * 
 * @param {Function} fn - 실행할 비동기 함수
 * @param {Object} options - 재시도 옵션
 * @param {number} [options.maxRetries=3] - 최대 재시도 횟수
 * @param {number} [options.delayMs=1000] - 기본 지연 시간 (밀리초)
 * @param {boolean} [options.exponentialBackoff=true] - 지수 백오프 사용 여부
 * @param {Function} [options.onRetry] - 재시도 시 호출될 콜백
 * @param {number} [currentRetry=0] - 현재 재시도 횟수 (내부 사용)
 * @returns {Promise} 함수 실행 결과
 * 
 * @throws {Error} 모든 재시도 실패 시 마지막 오류 throw
 */
export const retryWithBackoff = async (
    fn,
    options = {},
    currentRetry = 0
) => {
    const {
        maxRetries = 3,
        delayMs = 1000,
        exponentialBackoff = true,
        onRetry = null
    } = options;
    
    try {
        // 함수 실행 시도
        return await fn();
        
    } catch (error) {
        // 치명적 오류는 재시도하지 않음
        if (isFatalError(error)) {
            console.error('❌ [재시도 불가] 치명적 오류 발생:', error.message);
            throw error;
        }
        
        // 재시도 횟수 초과
        if (currentRetry >= maxRetries) {
            console.error(`❌ [재시도 실패] 최대 재시도 횟수(${maxRetries}) 도달`);
            throw error;
        }
        
        // 재시도 가능한 오류인지 확인
        if (!isRetriableError(error)) {
            console.error('⚠️  [재시도 불가] 재시도 불가능한 오류:', error.message);
            throw error;
        }
        
        // 재시도 대기 시간 계산
        const delay = exponentialBackoff 
            ? delayMs * (currentRetry + 1)  // 1초, 2초, 3초
            : delayMs;                       // 항상 1초
        
        // 재시도 로그
        console.warn(
            `🔄 [재시도 ${currentRetry + 1}/${maxRetries}] ` +
            `${delay}ms 후 재시도... (오류: ${error.message})`
        );
        
        // 콜백 호출
        if (onRetry) {
            onRetry({
                attempt: currentRetry + 1,
                maxRetries,
                delay,
                error
            });
        }
        
        // 대기
        await sleep(delay);
        
        // 재귀적으로 재시도
        return retryWithBackoff(fn, options, currentRetry + 1);
    }
};

/**
 * 간단한 재시도 함수 (기본 옵션 사용)
 * 
 * @param {Function} fn - 실행할 비동기 함수
 * @param {number} [maxRetries=3] - 최대 재시도 횟수
 * @returns {Promise} 함수 실행 결과
 */
export const simpleRetry = async (fn, maxRetries = 3) => {
    return retryWithBackoff(fn, { maxRetries });
};

export default {
    retryWithBackoff,
    simpleRetry,
    sleep
};
