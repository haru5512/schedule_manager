/**
 * Web Speech API wrapper for Japanese voice recognition
 */

export class SpeechRecognizer {
    constructor() {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            this.supported = false;
            return;
        }

        this.supported = true;
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'ja-JP';
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;

        this.isListening = false;
        this.onResultCallback = null;
        this.onErrorCallback = null;
        this.onStartCallback = null;
        this.onEndCallback = null;

        this._setupEventListeners();
    }

    _setupEventListeners() {
        if (!this.recognition) return;

        this.recognition.onstart = () => {
            this.isListening = true;
            if (this.onStartCallback) this.onStartCallback();
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (this.onResultCallback) this.onResultCallback(transcript);
        };

        this.recognition.onerror = (event) => {
            this.isListening = false;
            let errorMessage = '音声認識エラーが発生しました';

            switch (event.error) {
                case 'no-speech':
                    errorMessage = '音声が検出されませんでした。もう一度お話しください';
                    break;
                case 'audio-capture':
                    errorMessage = 'マイクにアクセスできません';
                    break;
                case 'not-allowed':
                    errorMessage = 'マイクへのアクセスが許可されていません';
                    break;
                case 'network':
                    errorMessage = 'ネットワークエラーが発生しました';
                    break;
            }

            if (this.onErrorCallback) this.onErrorCallback(errorMessage);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            if (this.onEndCallback) this.onEndCallback();
        };
    }

    start() {
        if (!this.supported) {
            if (this.onErrorCallback) {
                this.onErrorCallback('このブラウザは音声入力に対応していません');
            }
            return false;
        }

        if (this.isListening) {
            return false;
        }

        try {
            this.recognition.start();
            return true;
        } catch (error) {
            if (this.onErrorCallback) {
                this.onErrorCallback('音声認識を開始できませんでした');
            }
            return false;
        }
    }

    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    onResult(callback) {
        this.onResultCallback = callback;
    }

    onError(callback) {
        this.onErrorCallback = callback;
    }

    onStart(callback) {
        this.onStartCallback = callback;
    }

    onEnd(callback) {
        this.onEndCallback = callback;
    }
}
