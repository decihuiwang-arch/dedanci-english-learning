// 首页交互逻辑 - 加载学习统计

document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    console.log('英语学习网站 - 音形义分离法');
    console.log('首页加载完成');
});

// 加载学习统计
function loadStats() {
    try {
        // 从 localStorage 读取统计
        const stats = JSON.parse(localStorage.getItem('learningStats') || '{}');

        // 如果没有数据，使用默认值
        const displayStats = {
            wordsLearned: stats.learnedWords || 0,
            studyDays: calculateStudyDays(stats) || 0,
            accuracy: stats.accuracy || 0
        };

        // 更新页面上的统计数据
        updateStatsDisplay(displayStats);
    } catch (error) {
        console.error('加载统计失败:', error);
        updateStatsDisplay({
            wordsLearned: 0,
            studyDays: 0,
            accuracy: 0
        });
    }
}

// 计算学习天数（简单的天数估算）
function calculateStudyDays(stats) {
    if (!stats.firstStudyDate) {
        return 0;
    }

    const firstStudy = new Date(stats.firstStudyDate);
    const today = new Date();
    const diffTime = today - firstStudy;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return Math.min(diffDays, 30); // 最多显示30天
}

// 更新统计显示
function updateStatsDisplay(stats) {
    document.querySelectorAll('.stat-number').forEach((el, index) => {
        if (index === 0) el.textContent = stats.wordsLearned;
        if (index === 1) el.textContent = stats.studyDays;
        if (index === 2) el.textContent = stats.accuracy + '%';
    });
}

// 记录首次学习日期（如果还没有）
function recordFirstStudyDate() {
    try {
        let stats = JSON.parse(localStorage.getItem('learningStats') || '{}');

        if (!stats.firstStudyDate) {
            stats.firstStudyDate = new Date().toISOString();
            localStorage.setItem('learningStats', JSON.stringify(stats));
        }
    } catch (error) {
        console.error('记录首次学习日期失败:', error);
    }
}

// 首次加载时记录
recordFirstStudyDate();
