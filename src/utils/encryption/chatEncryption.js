// src/utils/encryption/chatEncryption.js
import crypto from 'crypto';

/**
 * 채팅 메시지 전용 암호화 시스템
 * 기존 시스템을 활용하여 채팅에 최적화된 기능 제공
 */
class ChatEncryption {
    static chatSalt = process.env.CHAT_SALT || 'loco_chat_salt_2024_secure_key_v2';
    static searchSalt = process.env.SEARCH_SALT || 'loco_search_salt_2024_secure_key_v2';

    /**
     * 채팅 메시지 암호화 (AES-256-GCM)
     */
    static encryptMessage(text, additionalData = '') {
        try {
            if (!text || typeof text !== 'string') {
                throw new Error('유효하지 않은 메시지 텍스트');
            }

            // 1. 채팅 전용 키 생성
            const key = this.deriveChatKey();
            
            // 2. 초기화 벡터 생성 (12바이트, GCM 권장)
            const iv = crypto.randomBytes(12);
            
            // 3. AES-256-GCM 암호화
            const cipher = crypto.createCipherGCM('aes-256-gcm', key);
            if (additionalData) {
                cipher.setAAD(Buffer.from(additionalData, 'utf8'));
            }
            
            let encrypted = cipher.update(text, 'utf8');
            cipher.final();
            
            // 4. 인증 태그 추출
            const tag = cipher.getAuthTag();
            
            const result = {
                encryptedText: encrypted.toString('base64'),
                iv: iv.toString('base64'),
                tag: tag.toString('base64')
            };
            
            console.log(`✅ [채팅암호화] 성공: ${text.length}자 → ${result.encryptedText.length}자`);
            return result;
            
        } catch (error) {
            console.error('❌ [채팅암호화] 실패:', error);
            throw new Error('메시지 암호화 실패: ' + error.message);
        }
    }

    /**
     * 채팅 메시지 복호화
     */
    static decryptMessage(encryptedData) {
        try {
            const { encryptedText, iv, tag } = encryptedData;
            
            if (!encryptedText || !iv || !tag) {
                throw new Error('암호화 데이터가 불완전합니다');
            }

            // 1. 채팅 전용 키 생성
            const key = this.deriveChatKey();
            
            // 2. Base64 디코딩
            const encryptedBuffer = Buffer.from(encryptedText, 'base64');
            const ivBuffer = Buffer.from(iv, 'base64');
            const tagBuffer = Buffer.from(tag, 'base64');
            
            // 3. AES-256-GCM 복호화
            const decipher = crypto.createDecipherGCM('aes-256-gcm', key);
            decipher.setAuthTag(tagBuffer);
            
            let decrypted = decipher.update(encryptedBuffer, null, 'utf8');
            decipher.final();
            
            console.log(`✅ [채팅복호화] 성공: ${encryptedText.length}자 → ${decrypted.length}자`);
            return decrypted;
            
        } catch (error) {
            console.error('❌ [채팅복호화] 실패:', error);
            throw new Error('메시지 복호화 실패: ' + error.message);
        }
    }

    /**
     * 채팅 전용 암호화 키 유도
     */
    static deriveChatKey() {
        try {
            const masterKey = process.env.ENCRYPTION_KEY || 'loco_fallback_key_2024';
            
            const derivedKey = crypto.pbkdf2Sync(
                masterKey, 
                this.chatSalt, 
                100000, // 10만회 반복
                32,     // 32바이트 (256비트)
                'sha256'
            );
            
            return derivedKey;
        } catch (error) {
            console.error('❌ [키유도] 실패:', error);
            throw new Error('채팅 키 생성 실패');
        }
    }

    /**
     * 검색용 키워드 해시 생성
     */
    static hashKeyword(keyword) {
        try {
            if (!keyword || typeof keyword !== 'string') {
                return '';
            }

            return crypto.createHash('sha256')
                .update(keyword.toLowerCase().trim() + this.searchSalt)
                .digest('hex');
                
        } catch (error) {
            console.error('❌ [키워드해시] 실패:', error);
            return '';
        }
    }

    /**
     * 메시지에서 키워드 추출
     */
    static extractKeywords(text) {
        try {
            if (!text || typeof text !== 'string') {
                return [];
            }

            const keywords = [];
            
            // 1. 한국어 단어 추출 (2글자 이상)
            const koreanWords = text.match(/[가-힣]{2,}/g) || [];
            keywords.push(...koreanWords);
            
            // 2. 영어 단어 추출 (2글자 이상)  
            const englishWords = text.match(/[a-zA-Z]{2,}/g) || [];
            keywords.push(...englishWords);
            
            // 3. 숫자 추출 (2자리 이상)
            const numbers = text.match(/\d{2,}/g) || [];
            keywords.push(...numbers);
            
            // 4. 중복 제거 및 길이 제한
            const uniqueKeywords = [...new Set(keywords)]
                .filter(word => word.length >= 2 && word.length <= 20)
                .slice(0, 10); // 최대 10개 키워드
                
            console.log(`📝 [키워드추출] "${text.substring(0, 20)}..." → ${uniqueKeywords.length}개`);
            return uniqueKeywords;
            
        } catch (error) {
            console.error('❌ [키워드추출] 실패:', error);
            return [];
        }
    }

    /**
     * 메시지 전체 해시 생성 (중복 검출용)
     */
    static hashMessage(text) {
        try {
            return crypto.createHash('sha256')
                .update(text.trim())
                .digest('hex');
        } catch (error) {
            console.error('❌ [메시지해시] 실패:', error);
            return '';
        }
    }

    /**
     * 암호화/복호화 테스트
     */
    static performanceTest(testMessage = '안녕하세요! Hello World! 123') {
        console.log('🧪 [성능테스트] 채팅 암호화 시스템 테스트 시작...');
        
        try {
            const startTime = Date.now();
            
            // 1. 암호화 테스트
            const encrypted = this.encryptMessage(testMessage);
            const encryptTime = Date.now() - startTime;
            
            // 2. 복호화 테스트
            const decryptStart = Date.now();
            const decrypted = this.decryptMessage(encrypted);
            const decryptTime = Date.now() - decryptStart;
            
            // 3. 키워드 추출 테스트
            const keywordStart = Date.now();
            const keywords = this.extractKeywords(testMessage);
            const keywordTime = Date.now() - keywordStart;
            
            // 4. 결과 검증
            const isSuccess = decrypted === testMessage;
            
            console.log('✅ [성능테스트] 결과:');
            console.log(`  📊 암호화: ${encryptTime}ms`);
            console.log(`  📊 복호화: ${decryptTime}ms`);  
            console.log(`  📊 키워드추출: ${keywordTime}ms`);
            console.log(`  📊 총 소요시간: ${Date.now() - startTime}ms`);
            console.log(`  ✨ 성공여부: ${isSuccess ? '✅ 성공' : '❌ 실패'}`);
            console.log(`  🔍 추출 키워드: [${keywords.join(', ')}]`);
            
            return {
                success: isSuccess,
                encryptTime,
                decryptTime,
                keywordTime,
                totalTime: Date.now() - startTime,
                keywords
            };
            
        } catch (error) {
            console.error('❌ [성능테스트] 테스트 실패:', error);
            return { success: false, error: error.message };
        }
    }
}

export default ChatEncryption;