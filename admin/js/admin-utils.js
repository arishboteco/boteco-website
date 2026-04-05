(function () {
    'use strict';

    const REPO_OWNER = 'anomalyco';
    const REPO_NAME = 'boteco-website';
    const GITHUB_API = 'https://api.github.com';

    function apiUrl(path) {
        return `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}${path}`;
    }

    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-exit');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    function showLoading(el) {
        if (el) el.style.display = 'flex';
    }

    function hideLoading(el) {
        if (el) el.style.display = 'none';
    }

    function showError(el, message) {
        if (el) {
            el.textContent = message;
            el.style.display = 'block';
        }
    }

    function hideError(el) {
        if (el) el.style.display = 'none';
    }

    window.AdminUtils = {
        REPO_OWNER,
        REPO_NAME,
        GITHUB_API,
        apiUrl,
        showToast,
        showLoading,
        hideLoading,
        showError,
        hideError
    };
})();
