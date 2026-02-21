// learn.js - 学习页面逻辑（集成语音识别）

// 导入语音识别模块
const speechRecognition = new SpeechRecognition();

// 单词数据
let words = [];
let currentIndex = 0;
let currentMode = 'read'; // read 或 spell

// 语音识别状态
let isRecording = false;
let recordingStartTime = null;

// 初始化
document.addEventListener('DOMContentLoaded', async function() {
    await loadWords();
    checkSpeechSupport();
    updateProgress();
    // 不自动加载单词，等待用户点击"开始学习"
});

// 开始学习
function startLearning() {
    // 隐藏学习模式选择区域
    const learningMode = document.querySelector('.learning-mode');
    learningMode.style.display = 'none';

    // 显示单词卡片
    const wordCard = document.getElementById('wordCard');
    wordCard.style.display = 'block';

    // 加载第一个单词
    currentIndex = 0;
    loadWord();
}

// 检查浏览器支持
function checkSpeechSupport() {
    const supportEl = document.getElementById('speechSupport');
    const supportMsg = speechRecognition.isSupported() ?
        '✓ 您的浏览器支持语音识别' :
        '✗ 您的浏览器不支持语音识别';

    const recommendedBrowsers = speechRecognition.getRecommendedBrowser();
    let recommendedText = '';
    if (recommendedBrowsers) {
        recommendedText = '\n推荐使用: ' + recommendedBrowsers
            .filter(b => b.recommended)
            .map(b => b.name)
            .join(' 或 ');
    }

    supportEl.textContent = supportMsg + recommendedText;
    supportEl.className = speechRecognition.isSupported() ? 'support-message success' : 'support-message error';
}

// 从 words.json 加载单词
async function loadWords() {
    try {
        const response = await fetch('data/words.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        words = await response.json();
        console.log('✅ 加载词库成功，共', words.length, '个单词');
    } catch (error) {
        console.error('❌ 加载词库失败:', error);
        console.warn('⚠️ 使用内置词库（4个单词）');

        // 使用内置词库
        words = [
            { word: 'hello', phonetic: '/həˈloʊ/' },
            { word: 'world', phonetic: '/wɜːrld/' },
            { word: 'apple', phonetic: '/ˈæpəl/' },
            { word: 'banana', phonetic: '/bəˈnænə/' }
        ];

        // 提示用户
        const supportEl = document.getElementById('speechSupport');
        if (supportEl) {
            supportEl.innerHTML += '<br>⚠️ 警告：词库加载失败，已使用内置词库';
            supportEl.classList.add('warning');
        }

        // 显示提示
        setTimeout(() => {
            alert('⚠️ 词库加载失败，已使用内置词库（4个单词）\n\n请检查 data/words.json 文件是否存在');
        }, 500);
    }
}

// 加载当前单词
function loadWord() {
    const wordData = words[currentIndex];
    const wordCard = document.getElementById('wordCard');
    const currentWordEl = document.getElementById('currentWord');

    // 添加单词切换动画
    wordCard.classList.remove('word-transition');
    void wordCard.offsetWidth; // 触发重排
    wordCard.classList.add('word-transition');

    currentWordEl.textContent = wordData.word;
    wordCard.style.display = 'block';
    document.getElementById('phonetic').textContent = wordData.phonetic;
    updateProgress();
    resetRecordingState();
}

// 重置录音状态
function resetRecordingState() {
    isRecording = false;
    recordingStartTime = null;
    document.getElementById('recordBtn').classList.remove('recording');
    document.getElementById('recordStatus').textContent = '点击开始录音';
    document.getElementById('recordStatus').className = 'record-status';
}

// 播放发音
function playAudio() {
    const wordData = words[currentIndex];
    const audioBtn = document.querySelector('.audio-btn');

    // 添加播放动画
    if (audioBtn) {
        audioBtn.classList.add('playing');
        setTimeout(() => audioBtn.classList.remove('playing'), 300);
    }

    const utterance = new SpeechSynthesisUtterance(wordData.word);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
}

// 开始录音
function startRecording() {
    if (isRecording) {
        console.log('已在录音中');
        return;
    }

    const wordData = words[currentIndex];
    isRecording = true;
    recordingStartTime = new Date();

    document.getElementById('recordBtn').classList.add('recording');
    document.getElementById('recordStatus').textContent = '🎤 正在录音...';
    document.getElementById('recordStatus').className = 'record-status recording';
    document.getElementById('feedback').textContent = '';
    document.getElementById('feedback').className = 'feedback';

    // 启动语音识别
    speechRecognition.start(wordData.word, (result) => {
        handleSpeechResult(result);
    });
}

// 停止录音
function stopRecording() {
    if (!isRecording) return;

    speechRecognition.stop();
    isRecording = false;

    const recordingDuration = recordingStartTime ?
        Math.round((new Date() - recordingStartTime) / 1000) : 0;

    document.getElementById('recordBtn').classList.remove('recording');
    document.getElementById('recordStatus').textContent = `录音时长: ${recordingDuration}秒`;
    document.getElementById('recordStatus').className = 'record-status';
}

// 处理语音识别结果
function handleSpeechResult(result) {
    const feedbackEl = document.getElementById('feedback');

    // 移除所有动画类
    feedbackEl.classList.remove('success-animation', 'shake');

    if (result.success) {
        const accuracy = Math.round(result.confidence * 100);

        if (accuracy >= 70) {
            feedbackEl.textContent = `✓ 很好！准确率: ${accuracy}%`;
            feedbackEl.className = 'feedback success';
            // 添加成功动画
            void feedbackEl.offsetWidth;
            feedbackEl.classList.add('success-animation');

            // 保存成功记录
            savePronunciationResult(words[currentIndex].word, true, accuracy);
        } else {
            feedbackEl.textContent = `⚠ 发音待提高，准确率: ${accuracy}%`;
            feedbackEl.className = 'feedback warning';

            // 保存失败记录
            savePronunciationResult(words[currentIndex].word, false, accuracy);
        }
    } else {
        let errorMsg = '识别失败';
        if (result.error) {
            errorMsg = result.error;
        }

        feedbackEl.textContent = `✗ ${errorMsg}`;
        feedbackEl.className = 'feedback error';
        // 添加震动动画
        void feedbackEl.offsetWidth;
        feedbackEl.classList.add('shake');

        // 保存失败记录
        savePronunciationResult(words[currentIndex].word, false, 0);
    }

    // 更新发音统计数据
    updatePronunciationStats();
}

// 保存发音结果
function savePronunciationResult(word, isCorrect, accuracy = 0) {
    try {
        let pronunciationData = JSON.parse(localStorage.getItem('pronunciationResults') || '{}');

        if (!pronunciationData[word]) {
            pronunciationData[word] = {
                attempts: 0,
                successes: 0,
                bestAccuracy: 0,
                lastAttempt: new Date().toISOString()
            };
        }

        pronunciationData[word].attempts++;
        if (isCorrect) {
            pronunciationData[word].successes++;
        }

        if (accuracy > pronunciationData[word].bestAccuracy) {
            pronunciationData[word].bestAccuracy = accuracy;
        }

        pronunciationData[word].lastAttempt = new Date().toISOString();
        localStorage.setItem('pronunciationResults', JSON.stringify(pronunciationData));

        // 同时更新全局统计
        updateGlobalStats(isCorrect);
    } catch (error) {
        console.error('保存发音结果失败:', error);
    }
}

// 更新全局统计
function updateGlobalStats(isCorrect) {
    try {
        let stats = JSON.parse(localStorage.getItem('learningStats') || '{}');

        if (!stats.pronunciationAttempts) stats.pronunciationAttempts = 0;
        if (!stats.pronunciationSuccesses) stats.pronunciationSuccesses = 0;

        stats.pronunciationAttempts++;
        if (isCorrect) {
            stats.pronunciationSuccesses++;
        }

        // 更新准确率
        stats.pronunciationAccuracy = Math.round(
            (stats.pronunciationSuccesses / stats.pronunciationAttempts) * 100
        );

        localStorage.setItem('learningStats', JSON.stringify(stats));
        updateStatsDisplay(stats);
    } catch (error) {
        console.error('更新统计失败:', error);
    }
}

// 更新统计显示
function updateStatsDisplay(stats) {
    const statElements = document.querySelectorAll('.stat-number');
    if (statElements.length >= 3) {
        statElements[0].textContent = stats.learnedWords || 0;
        statElements[1].textContent = stats.studyTime || 0;
        statElements[2].textContent = stats.pronunciationAccuracy || 0;
    }
}

// 更新发音统计显示（专门页面）
function updatePronunciationStats() {
    try {
        const pronunciationData = JSON.parse(localStorage.getItem('pronunciationResults') || '{}');
        const wordData = words[currentIndex];
        const wordResults = pronunciationData[wordData.word] || {
            attempts: 0,
            successes: 0,
            bestAccuracy: 0
        };

        const accuracy = wordResults.bestAccuracy || 0;
        const successRate = wordResults.attempts > 0 ?
            Math.round((wordResults.successes / wordResults.attempts) * 100) : 0;

        document.getElementById('pronunciationAccuracy').textContent = accuracy + '%';
        document.getElementById('pronunciationAttempts').textContent = wordResults.attempts;
        document.getElementById('pronunciationSuccesses').textContent = wordResults.successes;
    } catch (error) {
        console.error('更新发音统计失败:', error);
    }
}

// 切换练习模式
function switchMode(mode) {
    currentMode = mode;

    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    if (mode === 'read') {
        document.getElementById('readMode').style.display = 'block';
        document.getElementById('spellMode').style.display = 'none';
    } else {
        document.getElementById('readMode').style.display = 'none';
        document.getElementById('spellMode').style.display = 'block';
        document.getElementById('spellInput').value = '';
        document.getElementById('spellFeedback').textContent = '';
    }
}

// 检查拼写
function checkSpelling() {
    const input = document.getElementById('spellInput').value.trim().toLowerCase();
    const correct = words[currentIndex].word.toLowerCase();
    const feedbackEl = document.getElementById('spellFeedback');

    if (input === correct) {
        feedbackEl.textContent = '✓ 正确！';
        feedbackEl.className = 'feedback success';

        saveProgress(words[currentIndex].word, true);

        setTimeout(() => {
            nextWord();
        }, 1500);
    } else {
        feedbackEl.textContent = '✗ 错误，再试一次';
        feedbackEl.className = 'feedback error';

        saveProgress(words[currentIndex].word, false);
    }
}

// 保存学习进度
function saveProgress(word, isCorrect) {
    try {
        let progress = JSON.parse(localStorage.getItem('learningProgress') || '{}');

        if (!progress[word]) {
            progress[word] = {
                attempts: 0,
                correct: 0,
                lastReview: new Date().toISOString()
            };
        }

        progress[word].attempts++;
        if (isCorrect) {
            progress[word].correct++;
        }

        progress[word].lastReview = new Date().toISOString();
        localStorage.setItem('learningProgress', JSON.stringify(progress));

        updateStats();
    } catch (error) {
        console.error('保存进度失败:', error);
    }
}

// 更新统计
function updateStats() {
    try {
        let stats = JSON.parse(localStorage.getItem('learningStats') || '{}');

        const totalAttempts = Object.values(JSON.parse(localStorage.getItem('learningProgress') || '{}'))
            .reduce((sum, word) => sum + (word.attempts || 0), 0);

        const totalCorrect = Object.values(JSON.parse(localStorage.getItem('learningProgress') || '{}'))
            .reduce((sum, word) => sum + (word.correct || 0), 0);

        stats.totalWords = words.length;
        stats.learnedWords = Object.keys(JSON.parse(localStorage.getItem('learningProgress') || '{}')).length;
        stats.accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
        stats.studyTime = (stats.studyTime || 0) + 1;

        localStorage.setItem('learningStats', JSON.stringify(stats));
        updateStatsDisplay(stats);
    } catch (error) {
        console.error('更新统计失败:', error);
    }
}

// 下一个单词
function nextWord() {
    if (currentIndex < words.length - 1) {
        currentIndex++;
        loadWord();
        document.getElementById('spellInput').value = '';
        document.getElementById('feedback').textContent = '';
        document.getElementById('spellFeedback').textContent = '';
        resetRecordingState();
    } else {
        alert('恭喜！完成本次学习');
        showCompletionSummary();
    }
}

// 上一个单词
function previousWord() {
    if (currentIndex > 0) {
        currentIndex--;
        loadWord();
        document.getElementById('spellInput').value = '';
        document.getElementById('feedback').textContent = '';
        document.getElementById('spellFeedback').textContent = '';
        resetRecordingState();
    }
}

// 更新进度
function updateProgress() {
    document.getElementById('currentIndex').textContent = currentIndex + 1;
    document.getElementById('totalWords').textContent = words.length;

    const progress = ((currentIndex + 1) / words.length) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
}

// 显示完成总结
function showCompletionSummary() {
    try {
        const stats = JSON.parse(localStorage.getItem('learningStats') || '{}');
        const progress = JSON.parse(localStorage.getItem('learningProgress') || '{}');

        const totalAttempts = Object.values(progress)
            .reduce((sum, word) => sum + (word.attempts || 0), 0);
        const totalCorrect = Object.values(progress)
            .reduce((sum, word) => sum + (word.correct || 0), 0);

        const summary = `
本次学习总结：

📊 学习统计
━━━━━━━━━━
学习单词数: ${Object.keys(progress).length}
总尝试次数: ${totalAttempts}
正确次数: ${totalCorrect}
拼写准确率: ${totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0}%

🎤 发音统计
━━━━━━━━━━
发音尝试次数: ${stats.pronunciationAttempts || 0}
发音成功次数: ${stats.pronunciationSuccesses || 0}
发音准确率: ${stats.pronunciationAccuracy || 0}%

💡 建议
━━━━━━━━━━
${getStudyAdvice(totalCorrect, totalAttempts, stats.pronunciationAccuracy || 0)}
        `;

        alert(summary);

        // 更新首页统计数据
        updateStatsDisplay(stats);
    } catch (error) {
        console.error('生成总结失败:', error);
        alert('恭喜！完成本次学习');
    }
}

// 获取学习建议
function getStudyAdvice(correct, total, pronAccuracy) {
    if (correct / total < 0.5) {
        return '拼写正确率较低，建议多听发音和拼写练习';
    } else if (pronAccuracy < 60) {
        return '发音准确率有待提高，建议多模仿和跟读';
    } else if (correct / total >= 0.8 && pronAccuracy >= 80) {
        return '表现优秀！继续保持！';
    } else {
        return '整体表现不错，继续努力！';
    }
}

// 监听拼写输入的回车键
document.getElementById('spellInput')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        checkSpelling();
    }
});

// 键盘快捷键
document.addEventListener('keydown', (e) => {
    // 如果在输入框中，不触发快捷键（除了 Enter）
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Enter') {
            const spellInput = document.getElementById('spellInput');
            if (spellInput && document.activeElement === spellInput) {
                checkSpelling();
            }
        }
        return;
    }

    // Space: 播放发音
    if (e.code === 'Space') {
        e.preventDefault();
        playAudio();
    }

    // R: 开始录音
    if (e.code === 'KeyR' && !isRecording) {
        e.preventDefault();
        startRecording();
    }

    // S: 停止录音
    if (e.code === 'KeyS' && isRecording) {
        e.preventDefault();
        stopRecording();
    }

    // Left: 上一个单词
    if (e.code === 'ArrowLeft' && currentIndex > 0) {
        e.preventDefault();
        previousWord();
    }

    // Right: 下一个单词
    if (e.code === 'ArrowRight' && currentIndex < words.length - 1) {
        e.preventDefault();
        nextWord();
    }

    // 1-9: 直接跳转到对应单词
    if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (index < words.length) {
            e.preventDefault();
            currentIndex = index;
            loadWord();
        }
    }
});

// 首次加载时更新统计
window.addEventListener('load', () => {
    const stats = JSON.parse(localStorage.getItem('learningStats') || '{}');
    if (stats.learnedWords) {
        updateStatsDisplay(stats);
    }

    // 显示快捷键提示
    showKeyboardShortcutsHelp();
});

// 显示快捷键帮助提示
function showKeyboardShortcutsHelp() {
    console.log(`
⌨️  键盘快捷键：
━━━━━━━━━━━━━━━━━━━━━
Space - 播放发音
R - 开始录音
S - 停止录音
← / → - 上一个/下一个单词
Enter - 检查拼写（拼写模式）
1-9 - 跳转到对应单词
    `);
}
