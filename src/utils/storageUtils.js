// src/utils/storageUtils.js
import CryptoJS from 'crypto-js';

// Vite 환경변수는 VITE_ 접두사 사용하고 import.meta.env로 접근
const SECRET_KEY = import.meta.env.VITE_STORAGE_SECRET_KEY || 'your-secret-key-here';

/**
 * 데이터를 암호화하여 localStorage에 저장
 */
export const setEncryptedItem = (key, value) => {
    try {
        const jsonString = JSON.stringify(value);
        const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
        localStorage.setItem(key, encrypted);
    } catch (error) {
        console.error('Failed to encrypt and save data:', error);
    }
};

/**
 * localStorage에서 암호화된 데이터를 복호화하여 반환
 */
export const getDecryptedItem = (key) => {
    try {
        const encrypted = localStorage.getItem(key);
        if (!encrypted) return null;

        const bytes = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
        const jsonStr = bytes.toString(CryptoJS.enc.Utf8);

        if (!jsonStr) throw new Error('empty decrypt result');

        const parsed = JSON.parse(jsonStr);
        return parsed;
    } catch (err) {
        console.error('Failed to decrypt data:', err);
        console.warn(`Corrupted data for key ${key}, removing from storage`);
        localStorage.removeItem(key); // ✅ 손상된 데이터 제거
        return null; // ✅ 빈 객체가 아닌 null 반환
    }
};



/**
 * 암호화된 localStorage 아이템 제거
 */
export const removeEncryptedItem = (key) => {
    localStorage.removeItem(key);
};
