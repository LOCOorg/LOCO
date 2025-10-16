import instance from '../api/axiosInstance.js';
import { setEncryptedItem, getDecryptedItem, removeEncryptedItem } from './storageUtils.js';

let badWords = [];
let regex = null;
let isInitialized = false;
const CACHE_KEY = import.meta.env.VITE_PROFANITY_SECRET_KEY;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Fetch bad words from the server and initialize the filter
async function initializeProfanityFilter() {
    if (isInitialized) {
        return;
    }

    // 1. Try to load from encrypted cache
    try {
        const cachedData = getDecryptedItem(CACHE_KEY);
        if (cachedData) {
            const { timestamp, words } = cachedData;
            if (Date.now() - timestamp < CACHE_DURATION) {
                console.log(`[ProfanityFilter] 암호화된 캐시에서 비속어 목록을 불러옵니다. (${words.length}개)`);
                badWords = words;
                const escapedWords = badWords.map(word => word.replace(/[.*+?^${}()|[\\]/g, '\\$&'));
                regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
                isInitialized = true;
                return; // Cache is valid, no need to fetch
            }
        }
    } catch (error) {
        console.error('[ProfanityFilter] 암호화된 캐시 로드 실패:', error);
        removeEncryptedItem(CACHE_KEY); // Clear corrupted cache
    }

    // 2. Fetch from API if cache is invalid or missing
    try {
        const response = await instance.get('/api/profanity/list');
        if (response.data.success && Array.isArray(response.data.words)) {
            badWords = response.data.words;
            const escapedWords = badWords.map(word => word.replace(/[.*+?^${}()|[\\]/g, '\\$&'));
            regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
            isInitialized = true;
            console.log(`[ProfanityFilter] API에서 비속어 목록을 불러옵니다. (${badWords.length}개)`);

            // 3. Save to encrypted cache
            const cacheData = {
                timestamp: Date.now(),
                words: badWords
            };
            setEncryptedItem(CACHE_KEY, cacheData);
        }
    } catch (error) {
        console.error('[ProfanityFilter] 비속어 목록 로드 실패:', error);
        // On failure, regex will be null, and filterProfanity will just return the original text.
    }
}

// Call initialize on module load
initializeProfanityFilter();

/**
 * Filters profanity from text, replacing it with asterisks.
 * @param {string} text The text to filter.
 * @returns {string} The filtered text.
 */
export const filterProfanity = (text) => {
    if (!isInitialized || !regex || !text || typeof text !== 'string') {
        return text;
    }
    return text.replace(regex, (match) => '*'.repeat(match.length));
};

/**
 * Checks if the text contains any profanity.
 * @param {string} text The text to check.
 * @returns {boolean} True if it contains profanity, false otherwise.
 */
export const containsProfanity = (text) => {
    if (!isInitialized || !regex || !text || typeof text !== 'string') {
        return false;
    }
    regex.lastIndex = 0; // Reset regex state for 'g' flag
    return regex.test(text);
};

// Optional: Function to force a reload of the words
export const reloadProfanityFilter = () => {
    isInitialized = false;
    initializeProfanityFilter();
};
