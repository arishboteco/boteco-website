(function () {
    'use strict';

    const STORAGE_KEY = 'boteco_admin_pat';
    const USER_KEY = 'boteco_admin_user';
    const SESSION_START_KEY = 'boteco_admin_session_start';
    const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

    let currentPat = null;
    let currentUser = null;

    function getStoredPat() {
        return sessionStorage.getItem(STORAGE_KEY);
    }

    function storePat(pat) {
        sessionStorage.setItem(STORAGE_KEY, pat);
        sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
    }

    function clearSession() {
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(SESSION_START_KEY);
        currentPat = null;
        currentUser = null;
    }

    function isSessionValid() {
        const start = sessionStorage.getItem(SESSION_START_KEY);
        if (!start) return false;
        return (Date.now() - parseInt(start, 10)) < SESSION_DURATION_MS;
    }

    async function verifyPat(pat) {
        const response = await fetch(`${AdminUtils.GITHUB_API}/user`, {
            headers: {
                'Authorization': `Bearer ${pat}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Invalid token. Please check your Personal Access Token.');
            }
            throw new Error(`GitHub API error: ${response.status}`);
        }

        return response.json();
    }

    async function loginWithPat(pat) {
        const loading = document.getElementById('login-loading');
        const error = document.getElementById('login-error');
        AdminUtils.hideError(error);
        AdminUtils.showLoading(loading);

        try {
            const user = await verifyPat(pat);
            currentPat = pat;
            currentUser = user;
            storePat(pat);
            sessionStorage.setItem(USER_KEY, JSON.stringify(user));
            AdminUtils.hideLoading(loading);
            showDashboard();
            AdminUtils.showToast(`Welcome, ${user.login}!`, 'success');
        } catch (err) {
            AdminUtils.hideLoading(loading);
            AdminUtils.showError(error, err.message);
        }
    }

    function showDashboard() {
        const loginScreen = document.getElementById('login-screen');
        const dashboard = document.getElementById('dashboard');
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboard) dashboard.style.display = 'flex';

        if (currentUser) {
            const avatar = document.getElementById('user-avatar');
            const login = document.getElementById('user-login');
            if (avatar) avatar.src = currentUser.avatar_url;
            if (login) login.textContent = currentUser.login;
        }

        startSessionTimer();
        if (window.AdminDashboard) {
            window.AdminDashboard.init();
        }
    }

    function showLogin() {
        const loginScreen = document.getElementById('login-screen');
        const dashboard = document.getElementById('dashboard');
        if (loginScreen) loginScreen.style.display = 'flex';
        if (dashboard) dashboard.style.display = 'none';
    }

    function startSessionTimer() {
        const timerEl = document.getElementById('session-timer');
        if (!timerEl) return;

        function update() {
            const start = parseInt(sessionStorage.getItem(SESSION_START_KEY) || '0', 10);
            const remaining = SESSION_DURATION_MS - (Date.now() - start);

            if (remaining <= 0) {
                timerEl.textContent = 'Expired';
                logout();
                return;
            }

            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            timerEl.textContent = `${hours}h ${minutes}m remaining`;
        }

        update();
        setInterval(update, 60000);
    }

    function logout() {
        clearSession();
        showLogin();
        AdminUtils.showToast('Logged out successfully', 'info');
    }

    function getPat() {
        return currentPat || getStoredPat();
    }

    function getUser() {
        return currentUser || JSON.parse(sessionStorage.getItem(USER_KEY) || 'null');
    }

    async function githubApi(path, options = {}) {
        const pat = getPat();
        if (!pat) {
            throw new Error('Not authenticated');
        }

        const url = AdminUtils.apiUrl(path);
        const defaults = {
            headers: {
                'Authorization': `Bearer ${pat}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        };

        const response = await fetch(url, { ...defaults, ...options, headers: { ...defaults.headers, ...(options.headers || {}) } });

        if (!response.ok) {
            if (response.status === 401) {
                clearSession();
                showLogin();
                throw new Error('Session expired. Please log in again.');
            }
            if (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0') {
                const resetTime = parseInt(response.headers.get('x-ratelimit-reset') || '0', 10) * 1000;
                throw new Error(`Rate limit exceeded. Resets at ${new Date(resetTime).toLocaleTimeString()}`);
            }
            const body = await response.json().catch(() => ({}));
            throw new Error(body.message || `API error: ${response.status}`);
        }

        if (response.status === 204) return null;
        return response.json();
    }

    document.addEventListener('DOMContentLoaded', () => {
        const storedPat = getStoredPat();
        if (storedPat && isSessionValid()) {
            const storedUser = JSON.parse(sessionStorage.getItem(USER_KEY) || 'null');
            if (storedUser) {
                currentPat = storedPat;
                currentUser = storedUser;
                showDashboard();
                return;
            }
        }

        showLogin();

        const btnGithubLogin = document.getElementById('btn-github-login');
        const patSection = document.getElementById('login-pat-section');
        if (btnGithubLogin && patSection) {
            btnGithubLogin.addEventListener('click', () => {
                const isVisible = patSection.style.display !== 'none';
                patSection.style.display = isVisible ? 'none' : 'block';
                if (!isVisible) {
                    window.open('https://github.com/settings/tokens/new?description=Boteco%20Admin&scopes=repo', '_blank');
                }
            });
        }

        const btnPatLogin = document.getElementById('btn-pat-login');
        const patInput = document.getElementById('pat-input');
        if (btnPatLogin && patInput) {
            btnPatLogin.addEventListener('click', () => {
                const pat = patInput.value.trim();
                if (!pat) {
                    AdminUtils.showError(document.getElementById('login-error'), 'Please enter a token.');
                    return;
                }
                loginWithPat(pat);
            });

            patInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    btnPatLogin.click();
                }
            });
        }

        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', logout);
        }
    });

    window.AdminAuth = {
        getPat,
        getUser,
        githubApi,
        logout,
        isSessionValid
    };
})();
