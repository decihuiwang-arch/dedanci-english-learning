/**
 * 全局错误处理模块
 * 捕获所有未处理的错误和 Promise 拒绝，提供友好的用户提示
 */

// 显示友好的错误提示
function showErrorToast(message, duration = 3000) {
    // 移除已存在的 toast
    const existingToast = document.querySelector('.error-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.innerHTML = `
        <span class="error-icon">⚠️</span>
        <span class="error-message">${message}</span>
        <button class="error-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    document.body.appendChild(toast);

    // 自动消失
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// 全局错误处理器
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);

    // 根据错误类型提供不同的提示
    let message = '发生错误，请刷新页面重试';

    if (event.error) {
        const errorMessage = event.error.message || event.error.toString();

        // LocalStorage 相关错误
        if (errorMessage.includes('localStorage') || errorMessage.includes('Storage')) {
            message = '数据保存失败，请检查浏览器存储权限';
        }
        // 网络相关错误
        else if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
            message = '网络连接失败，请检查网络设置';
        }
        // 权限相关错误
        else if (errorMessage.includes('Permission') || errorMessage.includes('NotAllowed')) {
            message = '权限被拒绝，请在浏览器设置中允许相关权限';
        }
    }

    showErrorToast(message);

    // 阻止默认错误提示
    event.preventDefault();
});

// 未处理的 Promise 拒绝
window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的 Promise 拒绝:', event.reason);

    let message = '操作失败，请重试';

    if (event.reason) {
        const reasonMessage = event.reason.message || event.reason.toString();

        // LocalStorage 相关错误
        if (reasonMessage.includes('localStorage') || reasonMessage.includes('Storage')) {
            message = '数据保存失败，请检查浏览器存储权限';
        }
        // 网络相关错误
        else if (reasonMessage.includes('Network') || reasonMessage.includes('fetch') || reasonMessage.includes('Failed to fetch')) {
            message = '网络连接失败，请检查网络设置';
        }
        // JSON 解析错误
        else if (reasonMessage.includes('JSON')) {
            message = '数据格式错误，请联系管理员';
        }
    }

    showErrorToast(message);

    // 阻止默认错误提示
    event.preventDefault();
});

// 安全的 localStorage 工具函数
function safeLocalStorage(action, key, data) {
    try {
        if (action === 'get') {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } else if (action === 'set') {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } else if (action === 'remove') {
            localStorage.removeItem(key);
            return true;
        } else if (action === 'clear') {
            localStorage.clear();
            return true;
        }
    } catch (error) {
        console.error('LocalStorage 操作失败:', error);
        showErrorToast('数据保存失败，请检查浏览器存储权限');
        return false;
    }
}

// 安全的 fetch 包装器
async function safeFetch(url, options = {}) {
    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Fetch 请求失败:', error);

        let message = '网络请求失败';

        if (error.message.includes('Failed to fetch')) {
            message = '网络连接失败，请检查网络设置';
        } else if (error.message.includes('HTTP')) {
            message = `服务器错误: ${error.message}`;
        }

        showErrorToast(message);
        throw error;
    }
}

// 错误边界装饰器 - 包装可能导致错误的函数
function withErrorHandling(fn, errorMessage = '操作失败') {
    return async function(...args) {
        try {
            return await fn(...args);
        } catch (error) {
            console.error('函数执行失败:', error);
            showErrorToast(errorMessage);
            return null;
        }
    };
}

// 初始化错误处理
function initErrorHandler() {
    console.log('✅ 全局错误处理已启用');

    // 检测浏览器兼容性
    if (typeof localStorage === 'undefined') {
        showErrorToast('您的浏览器不支持本地存储，部分功能可能无法使用');
    }

    if (typeof fetch === 'undefined') {
        showErrorToast('您的浏览器版本过低，请升级浏览器');
    }

    // 检测语音识别支持
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
        console.warn('浏览器不支持语音识别 API');
    }
}

// 页面加载时初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initErrorHandler);
} else {
    initErrorHandler();
}
