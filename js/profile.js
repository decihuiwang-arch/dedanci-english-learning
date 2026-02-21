// 个人中心逻辑 - 显示详细学习进度

// 用户数据（从 localStorage 加载）
let userData = {
    name: 'zhong',
    wordsLearned: 0,
    studyDays: 0,
    accuracy: 0,
    phase1Progress: 0, // 第一阶段进度（单词数）
    phase1Total: 100, // 第一阶段总目标
    phase2Progress: 0, // 第二阶段进度
    phase2Unlocked: false
};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    updatePhaseProgress();
    checkAchievements();
});

// 加载用户数据
function loadUserData() {
    try {
        const stats = JSON.parse(localStorage.getItem('learningStats') || '{}');
        const progress = JSON.parse(localStorage.getItem('learningProgress') || '{}');

        userData.wordsLearned = stats.learnedWords || Object.keys(progress).length;
        userData.studyDays = calculateStudyDays(stats);
        userData.accuracy = stats.accuracy || 0;
        userData.phase1Progress = userData.wordsLearned;
        userData.phase2Unlocked = userData.phase1Progress >= userData.phase1Total;

        updateUserData();

        // 更新全局应用数据
        updateGlobalAppData();
    } catch (error) {
        console.error('加载用户数据失败:', error);
        updateUserData();
    }
}

// 更新全局应用数据（用于小程序或其他页面）
function updateGlobalAppData() {
    // 这个函数可以用来更新跨应用的数据共享
    console.log('更新全局数据', userData);
}

// 更新用户数据显示
function updateUserData() {
    const statElements = document.querySelectorAll('.stats-detail .stat-number');

    if (statElements.length >= 3) {
        statElements[0].textContent = userData.wordsLearned;
        statElements[1].textContent = userData.studyTime || Math.floor(userData.wordsLearned / 5); // 估算学习时间
        statElements[2].textContent = userData.accuracy + '%';
    }
}

// 更新阶段进度
function updatePhaseProgress() {
    // 第一阶段进度
    const phase1Percent = (userData.phase1Progress / userData.phase1Total) * 100;
    document.querySelector('.phase:nth-child(1) .phase-fill').style.width = phase1Percent + '%';
    document.querySelector('.phase:nth-child(1) .phase-info').textContent =
        `已掌握 ${userData.phase1Progress} / ${userData.phase1Total} 个单词`;

    // 第二阶段进度
    const phase2Percent = userData.phase2Unlocked ? 0 : 0;
    document.querySelector('.phase:nth-child(2) .phase-fill').style.width = phase2Percent + '%';

    // 第二阶段状态
    const phase2Status = document.querySelector('.phase:nth-child(2) .phase-status');
    if (userData.phase2Unlocked) {
        phase2Status.textContent = '解锁';
        phase2Status.classList.remove('locked');
    }
}

// 检查成就解锁
function checkAchievements() {
    const badges = document.querySelectorAll('.badge');

    // 初学者：学会10个单词
    if (userData.wordsLearned >= 10) {
        unlockBadge(badges[0], 'badge1Unlocked');
    }

    // 连续7天
    if (userData.studyDays >= 7) {
        unlockBadge(badges[1], 'badge2Unlocked');
    }

    // 百词达人：学会100个单词
    if (userData.wordsLearned >= 100) {
        unlockBadge(badges[2], 'badge3Unlocked');
    }

    // 保存成就状态
    saveAchievements();
}

// 解锁徽章
function unlockBadge(badge, achievementKey) {
    if (badge.classList.contains('locked')) {
        badge.classList.remove('locked');
        // 添加解锁动画或提示
        showToast('解锁新徽章！🏆');

        // 保存成就状态
        let achievements = JSON.parse(localStorage.getItem('achievements') || '{}');
        achievements[achievementKey] = true;
        localStorage.setItem('achievements', JSON.stringify(achievements));
    }
}

// 保存成就状态
function saveAchievements() {
    try {
        let achievements = JSON.parse(localStorage.getItem('achievements') || '{}');

        // 同步到 userData
        if (achievements.badge1Unlocked) userData.badge1Unlocked = true;
        if (achievements.badge2Unlocked) userData.badge2Unlocked = true;
        if (achievements.badge3Unlocked) userData.badge3Unlocked = true;

        localStorage.setItem('achievements', JSON.stringify(achievements));
    } catch (error) {
        console.error('保存成就失败:', error);
    }
}

// 加载成就状态
function loadAchievements() {
    try {
        const achievements = JSON.parse(localStorage.getItem('achievements') || '{}');
        const badges = document.querySelectorAll('.badge');

        if (achievements.badge1Unlocked) unlockBadgeVisual(badges[0]);
        if (achievements.badge2Unlocked) unlockBadgeVisual(badges[1]);
        if (achievements.badge3Unlocked) unlockBadgeVisual(badges[2]);
    } catch (error) {
        console.error('加载成就失败:', error);
    }
}

// 解锁徽章视觉效果（不显示提示）
function unlockBadgeVisual(badge) {
    if (badge.classList.contains('locked')) {
        badge.classList.remove('locked');
    }
}

// 计算学习天数
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

// 显示提示消息
function showToast(message) {
    // 创建提示元素
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // 3秒后消失
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 500);
    }, 3000);
}

// 页面加载时加载成就
loadAchievements();

// ===== 学习分析报告功能 =====

// 生成学习分析报告
function generateStudyReport() {
    const progress = JSON.parse(localStorage.getItem('learningProgress') || '{}');
    const stats = JSON.parse(localStorage.getItem('learningStats') || '{}');
    const pronunciationData = JSON.parse(localStorage.getItem('pronunciationResults') || '{}');

    const report = {
        summary: analyzeSummary(progress, stats, pronunciationData),
        weakWords: analyzeWeakWords(progress),
        weakPronunciationWords: analyzeWeakPronunciation(pronunciationData),
        learningCurve: calculateLearningCurve(progress),
        recommendations: getRecommendations(progress, stats, pronunciationData),
        dailyProgress: calculateDailyProgress(progress)
    };

    return report;
}

// 分析总体情况
function analyzeSummary(progress, stats, pronunciationData) {
    const totalWords = Object.keys(progress).length;
    const totalAttempts = Object.values(progress).reduce((sum, word) => sum + (word.attempts || 0), 0);
    const totalCorrect = Object.values(progress).reduce((sum, word) => sum + (word.correct || 0), 0);
    const spellingAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    const pronAttempts = Object.values(pronunciationData).reduce((sum, word) => sum + (word.attempts || 0), 0);
    const pronSuccesses = Object.values(pronunciationData).reduce((sum, word) => sum + (word.successes || 0), 0);
    const pronunciationAccuracy = pronAttempts > 0 ? Math.round((pronSuccesses / pronAttempts) * 100) : 0;

    return {
        totalWords,
        totalAttempts,
        spellingAccuracy,
        pronunciationAccuracy,
        studyDays: calculateStudyDays(stats)
    };
}

// 分析弱项单词（拼写）
function analyzeWeakWords(progress) {
    const weakWords = Object.entries(progress)
        .filter(([_, data]) => {
            const accuracy = data.attempts > 0 ? data.correct / data.attempts : 0;
            return accuracy < 0.5 && data.attempts >= 3;
        })
        .map(([word, data]) => ({
            word,
            accuracy: Math.round((data.correct / data.attempts) * 100),
            attempts: data.attempts,
            needsReview: true
        }))
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 10); // 最多显示10个

    return weakWords;
}

// 分析发音弱项
function analyzeWeakPronunciation(pronunciationData) {
    const weakWords = Object.entries(pronunciationData)
        .filter(([_, data]) => {
            return (data.bestAccuracy || 0) < 60 && data.attempts >= 3;
        })
        .map(([word, data]) => ({
            word,
            bestAccuracy: data.bestAccuracy || 0,
            attempts: data.attempts,
            needsPractice: true
        }))
        .sort((a, b) => a.bestAccuracy - b.bestAccuracy)
        .slice(0, 10);

    return weakWords;
}

// 计算学习曲线
function calculateLearningCurve(progress) {
    const wordEntries = Object.entries(progress);

    // 按学习时间排序
    wordEntries.sort((a, b) => new Date(a[1].lastReview) - new Date(b[1].lastReview));

    // 计算每天学习多少单词
    const days = {};
    wordEntries.forEach(([word, data]) => {
        const date = new Date(data.lastReview).toDateString();
        if (!days[date]) days[date] = 0;
        days[date]++;
    });

    const dailyWords = Object.entries(days).map(([date, count]) => ({ date, count }));
    const averageDailyWords = dailyWords.length > 0
        ? Math.round(Object.values(days).reduce((a, b) => a + b, 0) / dailyWords.length)
        : 0;

    return {
        dailyWords,
        averageDailyWords,
        trend: calculateTrend(dailyWords)
    };
}

// 计算学习趋势
function calculateTrend(dailyWords) {
    if (dailyWords.length < 2) return 'stable';

    const recent = dailyWords.slice(-7);
    const earlier = dailyWords.slice(0, -7);

    const recentAvg = recent.reduce((sum, day) => sum + day.count, 0) / recent.length;
    const earlierAvg = earlier.length > 0
        ? earlier.reduce((sum, day) => sum + day.count, 0) / earlier.length
        : recentAvg;

    if (recentAvg > earlierAvg * 1.2) return 'improving';
    if (recentAvg < earlierAvg * 0.8) return 'declining';
    return 'stable';
}

// 计算每日进度
function calculateDailyProgress(progress) {
    const dailyData = {};

    Object.entries(progress).forEach(([word, data]) => {
        if (!data.lastReview) return;

        const date = new Date(data.lastReview).toLocaleDateString('zh-CN');
        if (!dailyData[date]) {
            dailyData[date] = {
                newWords: 0,
                totalAttempts: 0,
                correctAttempts: 0
            };
        }

        dailyData[date].newWords++;
        dailyData[date].totalAttempts += data.attempts || 0;
        dailyData[date].correctAttempts += data.correct || 0;
    });

    // 计算每日准确率
    Object.keys(dailyData).forEach(date => {
        const data = dailyData[date];
        data.accuracy = data.totalAttempts > 0
            ? Math.round((data.correctAttempts / data.totalAttempts) * 100)
            : 0;
    });

    return dailyData;
}

// 生成建议
function getRecommendations(progress, stats, pronunciationData) {
    const recommendations = [];

    // 检查拼写准确率
    const totalAttempts = Object.values(progress).reduce((sum, word) => sum + (word.attempts || 0), 0);
    const totalCorrect = Object.values(progress).reduce((sum, word) => sum + (word.correct || 0), 0);
    const spellingAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

    if (spellingAccuracy < 0.6) {
        recommendations.push({
            type: 'spelling',
            priority: 'high',
            icon: '📝',
            title: '拼写准确率较低',
            message: '建议多听发音和拼写练习，重点复习错误率高的单词'
        });
    }

    // 检查发音准确率
    const pronAccuracy = stats.pronunciationAccuracy || 0;
    if (pronAccuracy < 60) {
        recommendations.push({
            type: 'pronunciation',
            priority: 'high',
            icon: '🎤',
            title: '发音准确率有待提高',
            message: '建议多模仿和跟读，注意语调和连读'
        });
    }

    // 检查学习频率
    const studyDays = stats.studyDays || 0;
    if (studyDays < 3) {
        recommendations.push({
            type: 'frequency',
            priority: 'medium',
            icon: '📅',
            title: '学习频率建议',
            message: '建议每天坚持学习15-30分钟，养成学习习惯'
        });
    }

    // 检查学习速度
    const curve = calculateLearningCurve(progress);
    if (curve.trend === 'declining') {
        recommendations.push({
            type: 'momentum',
            priority: 'medium',
            icon: '📈',
            title: '保持学习动力',
            message: '最近学习频率有所下降，建议设置每日学习目标'
        });
    }

    // 鼓励性建议
    if (spellingAccuracy >= 0.8 && pronAccuracy >= 80) {
        recommendations.push({
            type: 'achievement',
            priority: 'low',
            icon: '🏆',
            title: '表现优秀！',
            message: '继续保持！可以尝试挑战更难的单词'
        });
    }

    return recommendations;
}

// 显示详细分析报告
function showDetailedReport() {
    const report = generateStudyReport();

    let reportHTML = `
        <div class="analytics-report">
            <h2>📊 学习分析报告</h2>

            <div class="report-section">
                <h3>总体概况</h3>
                <div class="summary-cards">
                    <div class="summary-card">
                        <span class="summary-value">${report.summary.totalWords}</span>
                        <span class="summary-label">学习单词</span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-value">${report.summary.spellingAccuracy}%</span>
                        <span class="summary-label">拼写准确率</span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-value">${report.summary.pronunciationAccuracy}%</span>
                        <span class="summary-label">发音准确率</span>
                    </div>
                    <div class="summary-card">
                        <span class="summary-value">${report.summary.studyDays}</span>
                        <span class="summary-label">学习天数</span>
                    </div>
                </div>
            </div>
    `;

    // 弱项单词
    if (report.weakWords.length > 0) {
        reportHTML += `
            <div class="report-section">
                <h3>📝 需要加强的单词（拼写）</h3>
                <div class="weak-words-list">
                    ${report.weakWords.map(w => `
                        <div class="weak-word-item">
                            <span class="weak-word">${w.word}</span>
                            <span class="weak-accuracy">${w.accuracy}%</span>
                            <span class="weak-attempts">${w.attempts}次尝试</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 发音弱项
    if (report.weakPronunciationWords.length > 0) {
        reportHTML += `
            <div class="report-section">
                <h3>🎤 需要练习发音的单词</h3>
                <div class="weak-words-list">
                    ${report.weakPronunciationWords.map(w => `
                        <div class="weak-word-item">
                            <span class="weak-word">${w.word}</span>
                            <span class="weak-accuracy">${w.bestAccuracy}%</span>
                            <span class="weak-attempts">${w.attempts}次练习</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 建议
    if (report.recommendations.length > 0) {
        reportHTML += `
            <div class="report-section">
                <h3>💡 学习建议</h3>
                <div class="recommendations-list">
                    ${report.recommendations.map(r => `
                        <div class="recommendation-item priority-${r.priority}">
                            <span class="recommendation-icon">${r.icon}</span>
                            <div class="recommendation-content">
                                <h4>${r.title}</h4>
                                <p>${r.message}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 学习趋势
    if (report.learningCurve.dailyWords.length > 0) {
        reportHTML += `
            <div class="report-section">
                <h3>📈 学习趋势</h3>
                <p>平均每天学习 <strong>${report.learningCurve.averageDailyWords}</strong> 个单词</p>
                <p>趋势: ${getTrendText(report.learningCurve.trend)}</p>
            </div>
        `;
    }

    reportHTML += `
        </div>
        <div class="report-actions">
            <button class="btn btn-primary" onclick="closeReport()">关闭</button>
            <button class="btn btn-secondary" onclick="exportReport()">导出报告</button>
        </div>
    `;

    // 显示报告
    const modal = document.createElement('div');
    modal.className = 'report-modal';
    modal.innerHTML = reportHTML;
    document.body.appendChild(modal);

    // 添加关闭功能
    modal.onclick = (e) => {
        if (e.target === modal) closeReport();
    };
}

// 获取趋势文本
function getTrendText(trend) {
    const trends = {
        'improving': '📈 上升',
        'declining': '📉 下降',
        'stable': '➡️ 稳定'
    };
    return trends[trend] || '➡️ 稳定';
}

// 关闭报告
function closeReport() {
    const modal = document.querySelector('.report-modal');
    if (modal) {
        modal.classList.add('fade-out');
        setTimeout(() => modal.remove(), 300);
    }
}

// 导出报告
function exportReport() {
    const report = generateStudyReport();
    const reportText = `
学习分析报告
生成时间: ${new Date().toLocaleString('zh-CN')}

=== 总体概况 ===
学习单词: ${report.summary.totalWords}
拼写准确率: ${report.summary.spellingAccuracy}%
发音准确率: ${report.summary.pronunciationAccuracy}%
学习天数: ${report.summary.studyDays}

=== 学习建议 ===
${report.recommendations.map(r => `${r.icon} ${r.title}\n  ${r.message}`).join('\n\n')}
    `;

    // 创建下载
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `学习报告_${new Date().toLocaleDateString('zh-CN')}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('报告已导出！');
}

// 在个人中心页面添加"查看详细报告"按钮
document.addEventListener('DOMContentLoaded', function() {
    const profileContainer = document.querySelector('.profile-container');
    if (profileContainer) {
        const reportButton = document.createElement('button');
        reportButton.className = 'btn btn-mac';
        reportButton.textContent = '📊 查看详细报告';
        reportButton.style.marginTop = '2rem';
        reportButton.onclick = showDetailedReport;

        profileContainer.appendChild(reportButton);
    }
});
