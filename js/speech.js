// speech.js - 语音识别功能

class SpeechRecognition {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.init();
    }

    init() {
        // 检查浏览器支持
        const SpeechRecognition = window.SpeechRecognition ||
                             window.webkitSpeechRecognition ||
                             window.mozSpeechRecognition ||
                             window.msSpeechRecognition;

        if (!SpeechRecognition) {
            console.error('浏览器不支持语音识别');
            return false;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'en-US';
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;

        // 设置事件监听
        this.recognition.onresult = (event) => {
            this.handleResult(event);
        };

        this.recognition.onerror = (event) => {
            this.handleError(event);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.onEnd && this.onEnd();
        };

        return true;
    }

    start(targetWord, callback) {
        if (!this.recognition) {
            callback({
                success: false,
                error: '浏览器不支持语音识别',
                transcript: ''
            });
            return;
        }

        this.targetWord = targetWord.toLowerCase();
        this.onResult = callback;
        this.onEnd = null;
        this.isListening = true;

        try {
            this.recognition.start();
        } catch (error) {
            console.error('启动语音识别失败:', error);
            callback({
                success: false,
                error: error.message,
                transcript: ''
            });
        }
    }

    stop() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (error) {
                console.error('停止语音识别失败:', error);
            }
        }
        this.isListening = false;
    }

    handleResult(event) {
        const result = event.results[0];
        const transcript = result[0].transcript.toLowerCase().trim();

        console.log('识别结果:', transcript);
        console.log('目标单词:', this.targetWord);

        // 判断发音是否正确
        const isCorrect = this.checkPronunciation(transcript, this.targetWord);

        this.onResult({
            success: isCorrect,
            transcript: transcript,
            target: this.targetWord,
            confidence: result[0].confidence
        });
    }

    handleError(event) {
        let errorMsg = '语音识别错误';

        switch (event.error) {
            case 'no-speech':
                errorMsg = '没有检测到语音';
                break;
            case 'audio-capture':
                errorMsg = '无法捕获音频';
                break;
            case 'not-allowed':
                errorMsg = '麦克风权限被拒绝';
                break;
            case 'network':
                errorMsg = '网络错误';
                break;
            default:
                errorMsg = event.error;
        }

        console.error('语音识别错误:', errorMsg);

        if (this.onResult) {
            this.onResult({
                success: false,
                error: errorMsg,
                transcript: '',
                confidence: 0
            });
        }
    }

    // 检查发音是否正确
    checkPronunciation(transcript, target) {
        // 完全匹配
        if (transcript === target) {
            return true;
        }

        // 模糊匹配（允许一些小错误）
        const similarity = this.calculateSimilarity(transcript, target);
        if (similarity >= 0.8) {
            return true;
        }

        return false;
    }

    // 计算相似度（优化版）
    calculateSimilarity(str1, str2) {
        if (str1 === str2) return 1.0;

        const maxLen = Math.max(str1.length, str2.length);
        const minLen = Math.min(str1.length, str2.length);

        if (minLen === 0) return 0.0;

        // 对短单词（< 10字符）使用简单算法
        if (maxLen < 10) {
            return this.calculateSimpleSimilarity(str1, str2);
        }

        // 对长单词使用 Levenshtein 算法
        const matrix = this.buildLevenshteinMatrix(str1, str2);
        const distance = this.calculateLevenshteinDistance(matrix);
        const similarity = 1 - (distance / maxLen);

        return similarity;
    }

    // 简单相似度计算（适用于短单词）
    calculateSimpleSimilarity(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        const maxLen = Math.max(len1, len2);

        if (len1 === 0 && len2 === 0) return 1.0;

        // 计算匹配字符数
        let matches = 0;
        const minLen = Math.min(len1, len2);

        for (let i = 0; i < minLen; i++) {
            if (str1[i] === str2[i]) matches++;
        }

        // 计算相似度（考虑长度差异）
        const lengthFactor = 1 - Math.abs(len1 - len2) / maxLen;
        const charFactor = matches / maxLen;

        return (charFactor * 0.7 + lengthFactor * 0.3);
    }

    // 构建编辑距离矩阵
    buildLevenshteinMatrix(str1, str2) {
        const m = str1.length + 1;
        const n = str2.length + 1;
        const matrix = [];

        for (let i = 0; i < m; i++) {
            matrix[i] = new Array(n).fill(0);
            matrix[i][0] = i;
        }

        for (let j = 1; j < n; j++) {
            matrix[0][j] = j;
            for (let i = 1; i < m; i++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }

        return matrix;
    }

    // 计算编辑距离
    calculateLevenshteinDistance(matrix) {
        const m = matrix.length;
        const n = matrix[0].length;
        return matrix[m - 1][n - 1];
    }

    // 检查浏览器支持
    isSupported() {
        return !!(window.SpeechRecognition ||
                  window.webkitSpeechRecognition ||
                  window.mozSpeechRecognition ||
                  window.msSpeechRecognition);
    }

    // 获取推荐浏览器
    getRecommendedBrowser() {
        if (this.isSupported()) return null;

        const browsers = [
            { name: 'Chrome/Edge', recommended: true },
            { name: 'Safari', recommended: true },
            { name: 'Firefox', recommended: false },
            { name: 'Opera', recommended: false }
        ];

        return browsers;
    }
}

// 导出为全局类
if (typeof window.SpeechRecognitionHelper !== 'undefined') {
    window.SpeechRecognitionHelper = SpeechRecognition;
}
