/**
 * Gemini API integration for parsing voice transcriptions
 */

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/**
 * Parse voice transcription using GAS proxy (Gemini API)
 * @param {string} transcription - The voice transcription text
 * @param {string} gasUrl - GAS Web App URL
 * @returns {Promise<Object>} Parsed activity record fields
 */
export async function parseVoiceInput(transcription, gasUrl) {
    if (!gasUrl) {
        throw new Error('GAS WebアプリのURLが設定されていません。設定画面で設定してください。');
    }

    const currentDate = new Date();
    const currentDateStr = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月${currentDate.getDate()}日 ${currentDate.getHours()}時${currentDate.getMinutes()}分`;

    const requestBody = {
        action: 'parseVoice',
        transcript: transcription,
        currentDate: currentDateStr
    };

    try {
        const response = await fetch(gasUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API呼び出しに失敗しました (${response.status})`);
        }

        const result = await response.json();

        if (result.status === 'error') {
            throw new Error(result.message);
        }

        return result.data;

    } catch (error) {
        if (error.message.includes('GEMINI_API_KEY')) {
            throw new Error('Gemini APIキーがGASに設定されていません。\nGASスクリプトのプロパティで「GEMINI_API_KEY」を設定してください。');
        }
        throw error;
    }
}

/**
 * Get Gemini API key from localStorage
 * @returns {string|null} API key or null if not set
 */
export function getGeminiApiKey() {
    return localStorage.getItem('gemini_api_key');
}

/**
 * Save Gemini API key to localStorage
 * @param {string} apiKey - API key to save
 */
export function saveGeminiApiKey(apiKey) {
    if (apiKey && apiKey.trim()) {
        localStorage.setItem('gemini_api_key', apiKey.trim());
    } else {
        localStorage.removeItem('gemini_api_key');
    }
}
