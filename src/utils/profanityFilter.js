import axios from 'axios';

let badWords = [];
let regex = null;
let isInitialized = false;

// Fetch bad words from the server and initialize the filter
async function initializeProfanityFilter() {
    if (isInitialized) {
        return;
    }
    try {
        const response = await axios.get('/api/profanity/list');
        if (response.data.success && Array.isArray(response.data.words)) {
            badWords = response.data.words;
            // Escape special regex characters from words
            const escapedWords = badWords.map(word => word.replace(/[.*+?^${}()|[\\]/g, '\\$&'));
            regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
            isInitialized = true;
            console.log(`[ProfanityFilter] 초기화 완료. ${badWords.length}개의 단어 로드.`);
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
