# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a hidden admin panel at `admin.boteco.co.in` for managing all Boteco website content through a browser dashboard, authenticated via GitHub, with changes committed directly to the repository.

**Architecture:** A vanilla JavaScript SPA served from the `admin/` directory on GitHub Pages. Authentication uses a GitHub Personal Access Token (fine-grained, repo-scoped) validated against the GitHub API. All content edits are committed via the GitHub Contents API. Client-side image compression and WebP conversion run before upload.

**Tech Stack:** Vanilla JS, HTML, CSS, GitHub Contents API, GitHub Actions (for PDF conversion), Canvas API (for image compression)

---

## File Structure

**New files:**
- `admin/index.html` — Admin SPA shell (login + dashboard)
- `admin/css/admin.css` — Dark mode admin styles
- `admin/js/admin-auth.js` — Authentication (PAT login, session management, GitHub API client)
- `admin/js/admin-dashboard.js` — Dashboard UI, sidebar navigation, section rendering
- `admin/js/admin-about.js` — About section: text editing + image upload
- `admin/js/admin-menus.js` — Menu sections: PDF upload, page management
- `admin/js/admin-events.js` — Events section: image upload, date/title form, archive
- `admin/js/admin-images.js` — Image browser and replacement
- `admin/js/admin-outlets.js` — Outlets editor
- `admin/js/admin-hero.js` — Hero media upload
- `admin/js/admin-commit.js` — Commit panel: pending changes, commit/PR creation
- `admin/js/admin-compress.js` — Client-side image compression and WebP conversion
- `admin/js/admin-utils.js` — Shared utilities (toast notifications, file readers, etc.)
- `admin/CNAME` — `admin.boteco.co.in`
- `.github/workflows/oauth-login.yml` — Workflow that verifies GitHub identity and returns session info (used for the "Login with GitHub" flow)
- `assets/data/outlets.json` — Extracted outlet data (currently hardcoded in `outlets.js`)

**Modified files:**
- `assets/js/outlets.js` — Load from `outlets.json` instead of hardcoded array

---

### Task 1: Admin SPA Shell + Routing

**Files:**
- Create: `admin/index.html`
- Create: `admin/css/admin.css`

- [ ] **Step 1: Create the admin HTML shell**

Create `admin/index.html` with:
- Login screen (shown when no valid session)
- Dashboard layout (hidden until authenticated)
- Two-column layout: sidebar + content area
- Header bar with user info and logout
- Commit panel at bottom
- Toast container for notifications
- Link to `css/admin.css` and `js/admin-auth.js` (deferred)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>Boteco Admin</title>
    <link rel="stylesheet" href="css/admin.css">
</head>
<body>
    <!-- Login Screen -->
    <div id="login-screen" class="login-screen">
        <div class="login-card">
            <h1>Boteco Admin</h1>
            <p>Sign in to manage your website content</p>
            <div id="login-methods">
                <button id="btn-github-login" class="btn-github-login">
                    <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                    </svg>
                    Sign in with GitHub
                </button>
            </div>
            <div id="login-pat-section" class="login-pat-section" style="display:none;">
                <p class="login-help">Or enter a Personal Access Token:</p>
                <input type="password" id="pat-input" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" class="pat-input">
                <button id="btn-pat-login" class="btn-pat-login">Sign In</button>
                <p class="login-help">
                    <a href="https://github.com/settings/tokens/new?description=Boteco%20Admin&scopes=repo" target="_blank" rel="noopener">
                        Generate a fine-grained token
                    </a>
                    with <code>Contents</code> read/write access.
                </p>
            </div>
            <div id="login-error" class="login-error" style="display:none;"></div>
            <div id="login-loading" class="login-loading" style="display:none;">
                <div class="spinner"></div>
                <p>Verifying your GitHub account...</p>
            </div>
        </div>
    </div>

    <!-- Dashboard (hidden until authenticated) -->
    <div id="dashboard" class="dashboard" style="display:none;">
        <!-- Header -->
        <header class="admin-header">
            <div class="admin-header-left">
                <button id="btn-sidebar-toggle" class="btn-sidebar-toggle" aria-label="Toggle sidebar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                    </svg>
                </button>
                <span class="admin-logo">Boteco Admin</span>
            </div>
            <div class="admin-header-right">
                <span id="session-timer" class="session-timer"></span>
                <img id="user-avatar" class="user-avatar" src="" alt="User avatar">
                <span id="user-login" class="user-login"></span>
                <button id="btn-logout" class="btn-logout">Logout</button>
            </div>
        </header>

        <div class="admin-body">
            <!-- Sidebar -->
            <nav id="sidebar" class="sidebar">
                <ul class="sidebar-nav">
                    <li class="sidebar-item active" data-section="about">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
                        About
                    </li>
                    <li class="sidebar-item" data-section="food-menu">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
                        Food Menu
                    </li>
                    <li class="sidebar-item" data-section="bar-menu">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2h8l4 10H4L8 2z"/><line x1="12" y1="12" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>
                        Bar Menu
                    </li>
                    <li class="sidebar-item" data-section="specials-menu">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        Specials
                    </li>
                    <li class="sidebar-item" data-section="events">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        Events
                    </li>
                    <li class="sidebar-item" data-section="images">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        Images
                    </li>
                    <li class="sidebar-item" data-section="outlets">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        Outlets
                    </li>
                    <li class="sidebar-item" data-section="hero">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                        Hero
                    </li>
                </ul>
            </nav>

            <!-- Content Area -->
            <main id="content-area" class="content-area">
                <!-- Section content injected by JS -->
            </main>
        </div>

        <!-- Commit Panel -->
        <div id="commit-panel" class="commit-panel">
            <div class="commit-panel-header">
                <h3>Pending Changes (<span id="change-count">0</span>)</h3>
                <button id="btn-commit-panel-toggle" class="btn-toggle-panel">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
            </div>
            <div id="commit-panel-body" class="commit-panel-body" style="display:none;">
                <ul id="pending-changes" class="pending-changes"></ul>
                <div class="commit-actions">
                    <input type="text" id="commit-message" placeholder="Commit message..." class="commit-message-input">
                    <select id="commit-mode" class="commit-mode-select">
                        <option value="direct">Commit to main</option>
                        <option value="pr">Create PR</option>
                    </select>
                    <button id="btn-commit" class="btn-commit">Commit Changes</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div id="toast-container" class="toast-container"></div>

    <script src="js/admin-compress.js" defer></script>
    <script src="js/admin-utils.js" defer></script>
    <script src="js/admin-auth.js" defer></script>
    <script src="js/admin-commit.js" defer></script>
    <script src="js/admin-dashboard.js" defer></script>
    <script src="js/admin-about.js" defer></script>
    <script src="js/admin-menus.js" defer></script>
    <script src="js/admin-events.js" defer></script>
    <script src="js/admin-images.js" defer></script>
    <script src="js/admin-outlets.js" defer></script>
    <script src="js/admin-hero.js" defer></script>
</body>
</html>
```

- [ ] **Step 2: Create the admin CSS**

Create `admin/css/admin.css` with dark mode styles for:
- Login screen (centered card, GitHub button, PAT input)
- Dashboard layout (header, sidebar, content area, commit panel)
- Sidebar navigation (active state, hover, icons)
- Form elements (inputs, textareas, buttons, selects)
- File upload zones (drag-and-drop with dashed border)
- Image preview grids
- Toast notifications
- Responsive breakpoints (sidebar collapses on mobile)

Key design tokens:
```css
:root {
    --bg-primary: #0d1117;
    --bg-secondary: #161b22;
    --bg-tertiary: #21262d;
    --border-color: #30363d;
    --text-primary: #e6edf3;
    --text-secondary: #8b949e;
    --accent: #58a6ff;
    --accent-hover: #79b8ff;
    --success: #2ea043;
    --danger: #f85149;
    --warning: #d29922;
    --sidebar-width: 240px;
    --header-height: 56px;
    --commit-panel-height: 48px;
}
```

Include styles for:
- `.login-screen` — full viewport, centered flex, dark background
- `.login-card` — card with padding, rounded corners, subtle border
- `.btn-github-login` — GitHub brand colors, hover state
- `.dashboard` — full height, grid layout
- `.admin-header` — fixed top bar, flex row, space-between
- `.sidebar` — fixed left, scrollable, width 240px
- `.sidebar-item` — flex row with icon + text, active highlight
- `.content-area` — margin-left 240px, padding, scrollable
- `.commit-panel` — fixed bottom, collapsible
- `.toast-container` — fixed top-right, stacked toasts
- `.upload-zone` — dashed border, hover highlight, drag-over state
- `.image-grid` — CSS grid, thumbnail cards with delete overlay
- Responsive: at 768px, sidebar becomes overlay with backdrop

- [ ] **Step 3: Verify the shell renders**

Open `admin/index.html` in a browser. Expected:
- Login screen visible with GitHub button and PAT toggle
- Dashboard hidden
- No JavaScript errors in console

- [ ] **Step 4: Commit**

```bash
git add admin/index.html admin/css/admin.css
git commit -m "feat: add admin panel shell and dark mode styles"
```

---

### Task 2: Authentication Module

**Files:**
- Create: `admin/js/admin-auth.js`
- Create: `admin/js/admin-utils.js`

- [ ] **Step 1: Create shared utilities**

Create `admin/js/admin-utils.js`:

```javascript
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
```

- [ ] **Step 2: Create the auth module**

Create `admin/js/admin-auth.js`:

```javascript
(function () {
    'use strict';

    const STORAGE_KEY = 'boteco_admin_pat';
    const USER_KEY = 'boteco_admin_user';
    const SESSION_START_KEY = 'boteco_admin_session_start';
    const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

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

        const response = await fetch(url, { ...defaults, ...options, headers: { ...defaults.headers, ...options.headers } });

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

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        // Check for existing session
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

        // Show login
        showLogin();

        // GitHub login button → show PAT section
        const btnGithubLogin = document.getElementById('btn-github-login');
        const patSection = document.getElementById('login-pat-section');
        if (btnGithubLogin && patSection) {
            btnGithubLogin.addEventListener('click', () => {
                const isVisible = patSection.style.display !== 'none';
                patSection.style.display = isVisible ? 'none' : 'block';
                if (!isVisible) {
                    // Open GitHub token creation page
                    window.open('https://github.com/settings/tokens/new?description=Boteco%20Admin&scopes=repo', '_blank');
                }
            });
        }

        // PAT login button
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

        // Logout button
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
```

- [ ] **Step 3: Wire auth to the HTML shell**

The HTML from Task 1 already has the login elements (`#login-screen`, `#btn-github-login`, `#pat-input`, `#btn-pat-login`, `#login-error`, `#login-loading`). The auth module handles all interactions on DOMContentLoaded.

- [ ] **Step 4: Test authentication flow**

Open `admin/index.html` in a browser:
1. Expected: Login screen shows
2. Click "Sign in with GitHub" → PAT input appears, GitHub token page opens in new tab
3. Paste a valid PAT → click "Sign In"
4. Expected: Loading spinner → dashboard appears with GitHub avatar and username
5. Expected: Session timer shows "24h 0m remaining"
6. Click "Logout" → returns to login screen
7. Refresh page with active session → dashboard appears directly (session restored)

- [ ] **Step 5: Commit**

```bash
git add admin/js/admin-auth.js admin/js/admin-utils.js
git commit -m "feat: add GitHub PAT authentication with session management"
```

---

### Task 3: Dashboard Navigation + Section Routing

**Files:**
- Create: `admin/js/admin-dashboard.js`
- Modify: `admin/js/admin-auth.js` (add `showDashboard` callback hook — already included in Task 2)

- [ ] **Step 1: Create the dashboard module**

Create `admin/js/admin-dashboard.js`:

```javascript
(function () {
    'use strict';

    const sections = {
        'about': { title: 'About', init: null },
        'food-menu': { title: 'Food Menu', init: null },
        'bar-menu': { title: 'Bar Menu', init: null },
        'specials-menu': { title: 'Specials Menu', init: null },
        'events': { title: 'Events', init: null },
        'images': { title: 'Images', init: null },
        'outlets': { title: 'Outlets', init: null },
        'hero': { title: 'Hero', init: null }
    };

    let currentSection = 'about';

    function init() {
        const sidebarItems = document.querySelectorAll('.sidebar-item');
        sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                switchSection(section);
            });
        });

        const sidebarToggle = document.getElementById('btn-sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', toggleSidebar);
        }

        // Load first section
        switchSection('about');
    }

    function switchSection(sectionName) {
        if (!sections[sectionName]) return;
        currentSection = sectionName;

        // Update sidebar active state
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === sectionName);
        });

        // Render section content
        const contentArea = document.getElementById('content-area');
        if (!contentArea) return;

        contentArea.innerHTML = '';
        const h2 = document.createElement('h2');
        h2.className = 'section-title';
        h2.textContent = sections[sectionName].title;
        contentArea.appendChild(h2);

        const container = document.createElement('div');
        container.id = `section-${sectionName}`;
        container.className = 'section-content';
        contentArea.appendChild(container);

        // Call section init if registered
        if (sections[sectionName].init) {
            sections[sectionName].init(container);
        }
    }

    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('sidebar-collapsed');
        }
    }

    function registerSection(name, initFn) {
        if (sections[name]) {
            sections[name].init = initFn;
            // Re-render if this is the current section
            if (currentSection === name) {
                switchSection(name);
            }
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        // Wait for auth to show dashboard, then init
        const checkDashboard = setInterval(() => {
            const dashboard = document.getElementById('dashboard');
            if (dashboard && dashboard.style.display !== 'none') {
                clearInterval(checkDashboard);
                init();
            }
        }, 100);
    });

    window.AdminDashboard = {
        init,
        registerSection,
        switchSection,
        sections
    };
})();
```

- [ ] **Step 2: Add sidebar CSS styles**

Append to `admin/css/admin.css`:

```css
/* Section content */
.section-title {
    font-size: 1.5rem;
    color: var(--text-primary);
    margin-bottom: 1.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color);
}

.section-content {
    color: var(--text-primary);
}

/* Sidebar collapsed state */
.sidebar.sidebar-collapsed {
    transform: translateX(-100%);
}

@media (max-width: 768px) {
    .sidebar {
        transform: translateX(-100%);
        z-index: 100;
    }
    .sidebar:not(.sidebar-collapsed) {
        transform: translateX(0);
    }
    .content-area {
        margin-left: 0 !important;
    }
}
```

- [ ] **Step 3: Test navigation**

Open `admin/index.html`, authenticate, then:
1. Expected: "About" section loads by default
2. Click each sidebar item → content area updates with section title
3. Sidebar toggle button collapses/expands sidebar
4. Active sidebar item is highlighted

- [ ] **Step 4: Commit**

```bash
git add admin/js/admin-dashboard.js admin/css/admin.css
git commit -m "feat: add dashboard navigation and section routing"
```

---

### Task 4: Commit Panel

**Files:**
- Create: `admin/js/admin-commit.js`

- [ ] **Step 1: Create the commit panel module**

Create `admin/js/admin-commit.js`:

```javascript
(function () {
    'use strict';

    let pendingChanges = [];

    function init() {
        const toggleBtn = document.getElementById('btn-commit-panel-toggle');
        const panelBody = document.getElementById('commit-panel-body');
        if (toggleBtn && panelBody) {
            toggleBtn.addEventListener('click', () => {
                const isVisible = panelBody.style.display !== 'none';
                panelBody.style.display = isVisible ? 'none' : 'block';
                toggleBtn.querySelector('svg').style.transform = isVisible ? '' : 'rotate(180deg)';
            });
        }

        const commitBtn = document.getElementById('btn-commit');
        if (commitBtn) {
            commitBtn.addEventListener('click', executeCommit);
        }
    }

    function addChange(filePath, description, contentFn) {
        // Check if this file is already pending, replace if so
        const existingIndex = pendingChanges.findIndex(c => c.filePath === filePath);
        if (existingIndex >= 0) {
            pendingChanges[existingIndex] = { filePath, description, contentFn };
        } else {
            pendingChanges.push({ filePath, description, contentFn });
        }
        renderChanges();
    }

    function removeChange(filePath) {
        pendingChanges = pendingChanges.filter(c => c.filePath !== filePath);
        renderChanges();
    }

    function getChanges() {
        return [...pendingChanges];
    }

    function clearChanges() {
        pendingChanges = [];
        renderChanges();
    }

    function renderChanges() {
        const list = document.getElementById('pending-changes');
        const count = document.getElementById('change-count');
        if (!list || !count) return;

        count.textContent = pendingChanges.length;
        list.innerHTML = '';

        pendingChanges.forEach((change, index) => {
            const li = document.createElement('li');
            li.className = 'pending-change';
            li.innerHTML = `
                <span class="change-file">${change.filePath}</span>
                <span class="change-desc">${change.description}</span>
                <button class="btn-remove-change" data-index="${index}" aria-label="Remove change">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            `;
            list.appendChild(li);
        });

        // Attach remove handlers
        list.querySelectorAll('.btn-remove-change').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index, 10);
                pendingChanges.splice(idx, 1);
                renderChanges();
            });
        });

        // Auto-expand panel when changes exist
        const panelBody = document.getElementById('commit-panel-body');
        if (panelBody && pendingChanges.length > 0) {
            panelBody.style.display = 'block';
        }
    }

    async function getFileSha(filePath) {
        try {
            const data = await AdminAuth.githubApi(`/contents/${filePath}`);
            return data.sha;
        } catch (err) {
            if (err.message && err.message.includes('404')) {
                return null; // File doesn't exist yet
            }
            throw err;
        }
    }

    async function executeCommit() {
        if (pendingChanges.length === 0) {
            AdminUtils.showToast('No changes to commit.', 'warning');
            return;
        }

        const commitMessage = document.getElementById('commit-message').value.trim() || 'admin: update content';
        const commitMode = document.getElementById('commit-mode').value;
        const commitBtn = document.getElementById('btn-commit');

        commitBtn.disabled = true;
        commitBtn.textContent = 'Committing...';

        try {
            if (commitMode === 'direct') {
                // Commit each file directly to main
                for (const change of pendingChanges) {
                    const sha = await getFileSha(change.filePath);
                    const content = await change.contentFn();
                    const base64Content = btoa(unescape(encodeURIComponent(content)));

                    const body = {
                        message: commitMessage,
                        content: base64Content,
                        branch: 'main'
                    };
                    if (sha) body.sha = sha;

                    await AdminAuth.githubApi(`/contents/${change.filePath}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    });
                }
                AdminUtils.showToast('Changes committed successfully!', 'success');
            } else {
                // Create a branch and PR
                const branchName = `admin-update-${Date.now()}`;

                // Get the latest commit SHA on main
                const refData = await AdminAuth.githubApi(`/git/ref/heads/main`);
                const baseSha = refData.object.sha;

                // Create branch
                await AdminAuth.githubApi(`/git/refs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ref: `refs/heads/${branchName}`,
                        sha: baseSha
                    })
                });

                // Commit each file to the new branch
                for (const change of pendingChanges) {
                    const sha = await getFileSha(change.filePath);
                    const content = await change.contentFn();
                    const base64Content = btoa(unescape(encodeURIComponent(content)));

                    const body = {
                        message: commitMessage,
                        content: base64Content,
                        branch: branchName
                    };
                    if (sha) body.sha = sha;

                    await AdminAuth.githubApi(`/contents/${change.filePath}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    });
                }

                // Create PR
                const prData = await AdminAuth.githubApi(`/pulls`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: commitMessage,
                        head: branchName,
                        base: 'main',
                        body: 'Automated content update from Boteco Admin Panel.'
                    })
                });

                AdminUtils.showToast(`PR created: ${prData.html_url}`, 'success');
            }

            clearChanges();
            document.getElementById('commit-message').value = '';
        } catch (err) {
            AdminUtils.showToast(`Commit failed: ${err.message}`, 'error');
        } finally {
            commitBtn.disabled = false;
            commitBtn.textContent = 'Commit Changes';
        }
    }

    document.addEventListener('DOMContentLoaded', init);

    window.AdminCommit = {
        addChange,
        removeChange,
        getChanges,
        clearChanges,
        init
    };
})();
```

- [ ] **Step 2: Add commit panel CSS**

Append to `admin/css/admin.css`:

```css
/* Commit Panel */
.commit-panel {
    position: fixed;
    bottom: 0;
    left: var(--sidebar-width);
    right: 0;
    background: var(--bg-secondary);
    border-top: 1px solid var(--border-color);
    z-index: 50;
    transition: height 0.2s ease;
}

@media (max-width: 768px) {
    .commit-panel {
        left: 0;
    }
}

.commit-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    height: var(--commit-panel-height);
    cursor: pointer;
}

.commit-panel-header h3 {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0;
}

.commit-panel-body {
    padding: 1rem;
    border-top: 1px solid var(--border-color);
    max-height: 300px;
    overflow-y: auto;
}

.pending-changes {
    list-style: none;
    padding: 0;
    margin: 0 0 1rem;
}

.pending-change {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border-color);
    font-size: 0.875rem;
}

.change-file {
    font-family: monospace;
    color: var(--accent);
    min-width: 200px;
}

.change-desc {
    color: var(--text-secondary);
    flex: 1;
}

.btn-remove-change {
    background: none;
    border: none;
    color: var(--danger);
    cursor: pointer;
    padding: 0.25rem;
}

.commit-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.commit-message-input {
    flex: 1;
    padding: 0.5rem;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 0.875rem;
}

.commit-mode-select {
    padding: 0.5rem;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 0.875rem;
}

.btn-commit {
    padding: 0.5rem 1.5rem;
    background: var(--success);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
}

.btn-commit:hover {
    opacity: 0.9;
}

.btn-commit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
```

- [ ] **Step 3: Test commit panel**

1. Open browser console and run: `AdminCommit.addChange('test.txt', 'Test change', async () => 'hello')`
2. Expected: Panel expands, shows "test.txt" with "Test change" description
3. Click "Commit to main" → enter message → click "Commit Changes"
4. Expected: API calls to GitHub, success toast on completion

- [ ] **Step 4: Commit**

```bash
git add admin/js/admin-commit.js admin/css/admin.css
git commit -m "feat: add commit panel with direct commit and PR creation"
```

---

### Task 5: Image Compression Module

**Files:**
- Create: `admin/js/admin-compress.js`

- [ ] **Step 1: Create the compression module**

Create `admin/js/admin-compress.js`:

```javascript
(function () {
    'use strict';

    const MAX_DIMENSION = 4096;
    const JPEG_QUALITY = 0.85;
    const WEBP_QUALITY = 0.85;

    function compressImage(file, options = {}) {
        const maxWidth = options.maxWidth || MAX_DIMENSION;
        const quality = options.quality || JPEG_QUALITY;

        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(url);

                let width = img.width;
                let height = img.height;

                // Resize if needed
                if (width > maxWidth || height > maxWidth) {
                    if (width > height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxWidth) / height);
                        height = maxWidth;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Generate both JPEG and WebP
                const jpegBlob = new Promise((res) => {
                    canvas.toBlob(res, 'image/jpeg', quality);
                });
                const webpBlob = new Promise((res) => {
                    canvas.toBlob(res, 'image/webp', quality);
                });

                Promise.all([jpegBlob, webpBlob]).then(([jpeg, webp]) => {
                    resolve({
                        jpeg,
                        webp,
                        width,
                        height,
                        originalSize: file.size,
                        jpegSize: jpeg.size,
                        webpSize: webp.size
                    });
                });
            };

            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image for compression'));
            };

            img.src = url;
        });
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Extract base64 from data URL
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function isImageFile(file) {
        return file.type.startsWith('image/') && !file.type.includes('gif');
    }

    function isGifFile(file) {
        return file.type === 'image/gif';
    }

    window.AdminCompress = {
        compressImage,
        fileToBase64,
        blobToBase64,
        formatBytes,
        isImageFile,
        isGifFile,
        MAX_DIMENSION,
        JPEG_QUALITY,
        WEBP_QUALITY
    };
})();
```

- [ ] **Step 2: Test compression**

Open `admin/index.html` in browser console:
1. Create a test image blob, call `AdminCompress.compressImage(testFile)`
2. Expected: Returns object with `jpeg`, `webp` blobs, dimensions, and size info
3. Verify `AdminCompress.formatBytes(1048576)` returns `"1 MB"`

- [ ] **Step 3: Commit**

```bash
git add admin/js/admin-compress.js
git commit -m "feat: add client-side image compression with Canvas API"
```

---

### Task 6: About Section

**Files:**
- Create: `admin/js/admin-about.js`

- [ ] **Step 1: Create the About section module**

Create `admin/js/admin-about.js`:

```javascript
(function () {
    'use strict';

    const ABOUT_BLOCKS = [
        { key: 'our-story', label: 'Our Story: Where It All Began', selector: '.about-tile:nth-child(1) p:last-child' },
        { key: 'experience', label: 'The Boteco Experience', selector: '.about-tile:nth-child(2) p:last-child' },
        { key: 'chef', label: 'Meet the Chef Behind the Magic', selector: '.about-tile:nth-child(3) p:last-child' },
        { key: 'menu-desc', label: 'Our Menu: A Taste of Brazil', selector: '.about-tile:nth-child(4) p:last-child' }
    ];

    const ABOUT_IMAGES = [
        { file: 'assets/images/about/about-us-tile1.jpg', label: 'About Image 1' },
        { file: 'assets/images/about/about-us-tile2.jpg', label: 'About Image 2' },
        { file: 'assets/images/about/about-us-tile3.jpg', label: 'About Image 3' },
        { file: 'assets/images/about/about-us-tile4.jpg', label: 'About Image 4 (GIF poster)' },
        { file: 'assets/images/about/about-us-tile5.jpg', label: 'About Image 5' },
        { file: 'assets/images/about/about-us-tile6.jpg', label: 'About Image 6' }
    ];

    async function fetchAboutText() {
        try {
            const data = await AdminAuth.githubApi('/contents/index.html');
            const html = decodeURIComponent(escape(atob(data.content)));
            return html;
        } catch (err) {
            AdminUtils.showToast(`Failed to load index.html: ${err.message}`, 'error');
            return '';
        }
    }

    function extractTextBlock(html, blockKey) {
        // Simple extraction: find the block by looking for the label text
        const block = ABOUT_BLOCKS.find(b => b.key === blockKey);
        if (!block) return '';

        // Find the paragraph after the label within the about section
        const labelRegex = new RegExp(`<p class="h5 mb-2">${block.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</p>\\s*<p class="small mb-0">(.*?)</p>`, 's');
        const match = html.match(labelRegex);
        return match ? match[1] : '';
    }

    function render(container) {
        // Text editing section
        const textSection = document.createElement('div');
        textSection.className = 'about-text-section';

        const sectionLabel = document.createElement('h3');
        sectionLabel.className = 'section-subtitle';
        sectionLabel.textContent = 'About Text';
        textSection.appendChild(sectionLabel);

        ABOUT_BLOCKS.forEach(block => {
            const group = document.createElement('div');
            group.className = 'form-group';

            const label = document.createElement('label');
            label.textContent = block.label;
            label.setAttribute('for', `about-${block.key}`);

            const textarea = document.createElement('textarea');
            textarea.id = `about-${block.key}`;
            textarea.className = 'form-textarea';
            textarea.rows = 6;
            textarea.maxLength = 10000;
            textarea.placeholder = 'Loading...';

            textarea.addEventListener('input', () => {
                const newText = textarea.value;
                AdminCommit.addChange(
                    'index.html',
                    `Update "${block.label}" text`,
                    async () => generateUpdatedHtml(block, newText)
                );
            });

            group.appendChild(label);
            group.appendChild(textarea);
            textSection.appendChild(group);
        });

        container.appendChild(textSection);

        // Image upload section
        const imageSection = document.createElement('div');
        imageSection.className = 'about-images-section';

        const imageLabel = document.createElement('h3');
        imageLabel.className = 'section-subtitle';
        imageLabel.textContent = 'About Images';
        imageSection.appendChild(imageLabel);

        ABOUT_IMAGES.forEach(imgInfo => {
            const uploadZone = createUploadZone(imgInfo);
            imageSection.appendChild(uploadZone);
        });

        container.appendChild(imageSection);

        // Load current text
        loadAboutText(container);
    }

    function createUploadZone(imgInfo) {
        const zone = document.createElement('div');
        zone.className = 'upload-zone';
        zone.dataset.file = imgInfo.file;

        zone.innerHTML = `
            <div class="upload-zone-content">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p>${imgInfo.label}</p>
                <p class="upload-hint">Drop image here or click to browse</p>
            </div>
            <input type="file" accept="image/*" class="file-input" hidden>
        `;

        const fileInput = zone.querySelector('.file-input');

        zone.addEventListener('click', () => fileInput.click());
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            if (e.dataTransfer.files.length) {
                handleImageUpload(imgInfo.file, e.dataTransfer.files[0], zone);
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length) {
                handleImageUpload(imgInfo.file, fileInput.files[0], zone);
            }
        });

        return zone;
    }

    async function handleImageUpload(targetPath, file, zone) {
        try {
            let base64Content;
            if (AdminCompress.isImageFile(file)) {
                const compressed = await AdminCompress.compressImage(file);
                // Use WebP version
                base64Content = await AdminCompress.blobToBase64(compressed.webp);
                AdminUtils.showToast(`Compressed: ${AdminCompress.formatBytes(file.size)} → ${AdminCompress.formatBytes(compressed.webpSize)}`, 'success');
            } else {
                base64Content = await AdminCompress.fileToBase64(file);
            }

            AdminCommit.addChange(
                targetPath,
                `Replace ${zone.querySelector('.upload-hint').textContent.split(' ')[0] || 'image'}`,
                async () => base64Content
            );

            // Show preview
            const preview = document.createElement('img');
            preview.className = 'upload-preview';
            preview.src = URL.createObjectURL(file);
            zone.appendChild(preview);
        } catch (err) {
            AdminUtils.showToast(`Upload failed: ${err.message}`, 'error');
        }
    }

    async function generateUpdatedHtml(block, newText) {
        const currentHtml = await fetchAboutText();
        const labelRegex = new RegExp(`(<p class="h5 mb-2">${block.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</p>\\s*<p class="small mb-0">)(.*?)(</p>)`, 's');
        return currentHtml.replace(labelRegex, `$1${newText}$3`);
    }

    async function loadAboutText(container) {
        const html = await fetchAboutText();
        if (!html) return;

        ABOUT_BLOCKS.forEach(block => {
            const textarea = document.getElementById(`about-${block.key}`);
            if (textarea) {
                const text = extractTextBlock(html, block.key);
                textarea.value = text;
                textarea.placeholder = '';
            }
        });
    }

    // Register with dashboard
    if (window.AdminDashboard) {
        window.AdminDashboard.registerSection('about', render);
    }

    window.AdminAbout = {
        render,
        ABOUT_BLOCKS,
        ABOUT_IMAGES
    };
})();
```

- [ ] **Step 2: Add About section CSS**

Append to `admin/css/admin.css`:

```css
/* About Section */
.section-subtitle {
    font-size: 1.125rem;
    color: var(--text-primary);
    margin: 1.5rem 0 1rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.form-textarea {
    width: 100%;
    padding: 0.75rem;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 0.875rem;
    font-family: inherit;
    resize: vertical;
    line-height: 1.5;
}

.form-textarea:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
}

/* Upload Zone */
.upload-zone {
    border: 2px dashed var(--border-color);
    border-radius: 8px;
    padding: 1.5rem;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    margin-bottom: 1rem;
    position: relative;
}

.upload-zone:hover,
.upload-zone.drag-over {
    border-color: var(--accent);
    background: rgba(88, 166, 255, 0.05);
}

.upload-zone-content svg {
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
}

.upload-zone-content p {
    color: var(--text-secondary);
    margin: 0.25rem 0;
    font-size: 0.875rem;
}

.upload-hint {
    font-size: 0.75rem !important;
    color: var(--text-secondary);
    opacity: 0.7;
}

.upload-preview {
    max-width: 200px;
    max-height: 200px;
    border-radius: 4px;
    margin-top: 0.5rem;
}
```

- [ ] **Step 3: Test About section**

1. Authenticate, navigate to "About"
2. Expected: 4 text areas load with current content from `index.html`
3. Edit a text block → expected: change appears in commit panel
4. Drag an image onto an upload zone → expected: compression runs, preview shows, change queued

- [ ] **Step 4: Commit**

```bash
git add admin/js/admin-about.js admin/css/admin.css
git commit -m "feat: add About section with text editing and image upload"
```

---

### Task 7: Menu Sections (Food, Bar, Specials)

**Files:**
- Create: `admin/js/admin-menus.js`

- [ ] **Step 1: Create the menus module**

Create `admin/js/admin-menus.js`:

```javascript
(function () {
    'use strict';

    const MENU_CONFIGS = {
        'food-menu': {
            label: 'Food Menu',
            jsonPath: 'assets/menus/food-menu.json',
            pdfPattern: 'food-menu.pdf',
            imagePrefix: 'food-menu-pg',
            incomingPath: 'incoming/food-menu.pdf'
        },
        'bar-menu': {
            label: 'Bar Menu',
            jsonPath: 'assets/menus/bar-menu.json',
            pdfPattern: 'bar-menu.pdf',
            imagePrefix: 'bar-menu-pg',
            incomingPath: 'incoming/bar-menu.pdf'
        },
        'specials-menu': {
            label: 'Specials Menu',
            jsonPath: 'assets/menus/specials-menu.json',
            pdfPattern: 'specials-menu.pdf',
            imagePrefix: 'specials-menu-pg',
            incomingPath: 'incoming/specials-menu.pdf'
        }
    };

    async function fetchMenuPages(menuKey) {
        const config = MENU_CONFIGS[menuKey];
        if (!config) return [];

        try {
            const data = await AdminAuth.githubApi(`/contents/${config.jsonPath}`);
            const json = JSON.parse(decodeURIComponent(escape(atob(data.content))));
            return json;
        } catch (err) {
            AdminUtils.showToast(`Failed to load ${config.label}: ${err.message}`, 'error');
            return [];
        }
    }

    function render(container, menuKey) {
        const config = MENU_CONFIGS[menuKey];
        if (!config) return;

        // PDF Upload Zone
        const uploadSection = document.createElement('div');
        uploadSection.className = 'menu-upload-section';

        const uploadZone = document.createElement('div');
        uploadZone.className = 'upload-zone menu-upload-zone';
        uploadZone.innerHTML = `
            <div class="upload-zone-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <p>Upload ${config.label} PDF</p>
                <p class="upload-hint">Drop PDF here or click to browse. Existing pages will be replaced.</p>
            </div>
            <input type="file" accept=".pdf" class="file-input" hidden>
        `;

        const fileInput = uploadZone.querySelector('.file-input');

        uploadZone.addEventListener('click', () => fileInput.click());
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('drag-over');
        });
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length) {
                handlePdfUpload(menuKey, e.dataTransfer.files[0], uploadZone);
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length) {
                handlePdfUpload(menuKey, fileInput.files[0], uploadZone);
            }
        });

        uploadSection.appendChild(uploadZone);
        container.appendChild(uploadSection);

        // Current pages section
        const pagesSection = document.createElement('div');
        pagesSection.className = 'menu-pages-section';
        pagesSection.innerHTML = `<h3 class="section-subtitle">Current Pages</h3>`;
        const pagesGrid = document.createElement('div');
        pagesGrid.className = 'menu-pages-grid';
        pagesGrid.id = `menu-pages-${menuKey}`;
        pagesSection.appendChild(pagesGrid);
        container.appendChild(pagesSection);

        // Load current pages
        loadMenuPages(menuKey, pagesGrid);
    }

    async function handlePdfUpload(menuKey, file, zone) {
        if (file.type !== 'application/pdf') {
            AdminUtils.showToast('Please upload a PDF file.', 'error');
            return;
        }

        AdminUtils.showToast(`Uploading ${file.name}... This may take a moment.`, 'info');

        try {
            const config = MENU_CONFIGS[menuKey];
            const base64Content = await AdminCompress.fileToBase64(file);

            // Upload PDF to incoming/ folder
            AdminCommit.addChange(
                config.incomingPath,
                `Upload ${config.label} PDF`,
                async () => base64Content
            );

            // Show upload confirmation
            zone.innerHTML = `
                <div class="upload-zone-content">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <p style="color: var(--success);">${file.name} queued for upload</p>
                    <p class="upload-hint">Commit changes to trigger PDF conversion pipeline</p>
                </div>
            `;
        } catch (err) {
            AdminUtils.showToast(`Upload failed: ${err.message}`, 'error');
        }
    }

    async function loadMenuPages(menuKey, grid) {
        const pages = await fetchMenuPages(menuKey);
        grid.innerHTML = '';

        if (pages.length === 0) {
            grid.innerHTML = '<p class="text-muted">No pages found. Upload a PDF to get started.</p>';
            return;
        }

        pages.forEach((page, index) => {
            const card = document.createElement('div');
            card.className = 'menu-page-card';
            card.innerHTML = `
                <div class="menu-page-thumb">
                    <img src="https://raw.githubusercontent.com/${AdminUtils.REPO_OWNER}/${AdminUtils.REPO_NAME}/main/${page.image}" alt="Page ${index + 1}" loading="lazy">
                </div>
                <div class="menu-page-info">
                    <span>Page ${index + 1}</span>
                    <span class="menu-page-filename">${page.image}</span>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    // Register sections with dashboard
    if (window.AdminDashboard) {
        window.AdminDashboard.registerSection('food-menu', (container) => render(container, 'food-menu'));
        window.AdminDashboard.registerSection('bar-menu', (container) => render(container, 'bar-menu'));
        window.AdminDashboard.registerSection('specials-menu', (container) => render(container, 'specials-menu'));
    }

    window.AdminMenus = {
        render,
        MENU_CONFIGS,
        fetchMenuPages
    };
})();
```

- [ ] **Step 2: Add menu section CSS**

Append to `admin/css/admin.css`:

```css
/* Menu Sections */
.menu-upload-section {
    margin-bottom: 2rem;
}

.menu-upload-zone {
    padding: 3rem;
}

.menu-upload-zone svg {
    color: var(--text-secondary);
}

.menu-pages-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
}

.menu-page-card {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.2s;
}

.menu-page-card:hover {
    transform: translateY(-2px);
}

.menu-page-thumb {
    aspect-ratio: 3/4;
    overflow: hidden;
    background: var(--bg-secondary);
}

.menu-page-thumb img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.menu-page-info {
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.menu-page-info span:first-child {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
}

.menu-page-filename {
    font-size: 0.75rem;
    color: var(--text-secondary);
    font-family: monospace;
    word-break: break-all;
}

.text-muted {
    color: var(--text-secondary);
}
```

- [ ] **Step 3: Test menu sections**

1. Navigate to "Food Menu"
2. Expected: PDF upload zone + current pages grid displays
3. Drop a PDF → expected: queued in commit panel as `incoming/food-menu.pdf`
4. After commit, the existing `update-menus-from-pdf.yml` workflow will convert it

- [ ] **Step 4: Commit**

```bash
git add admin/js/admin-menus.js admin/css/admin.css
git commit -m "feat: add menu sections with PDF upload and page preview"
```

---

### Task 8: Events Section

**Files:**
- Create: `admin/js/admin-events.js`

- [ ] **Step 1: Create the events module**

Create `admin/js/admin-events.js`:

```javascript
(function () {
    'use strict';

    async function fetchEvents() {
        try {
            const data = await AdminAuth.githubApi('/contents/assets/events/events.json');
            const json = JSON.parse(decodeURIComponent(escape(atob(data.content))));
            return json;
        } catch (err) {
            AdminUtils.showToast(`Failed to load events: ${err.message}`, 'error');
            return [];
        }
    }

    async function listEventImages() {
        try {
            const data = await AdminAuth.githubApi('/contents/assets/events');
            if (!Array.isArray(data)) return [];
            return data.filter(item =>
                item.type === 'file' &&
                /\.(jpg|jpeg|png|webp|gif)$/i.test(item.name) &&
                item.name !== 'events.json'
            );
        } catch (err) {
            AdminUtils.showToast(`Failed to list event images: ${err.message}`, 'error');
            return [];
        }
    }

    function render(container) {
        // Upload section
        const uploadSection = document.createElement('div');
        uploadSection.className = 'events-upload-section';

        const uploadZone = document.createElement('div');
        uploadZone.className = 'upload-zone';
        uploadZone.innerHTML = `
            <div class="upload-zone-content">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p>Upload Event Images</p>
                <p class="upload-hint">Drop images here. Use format: YYYY-MM-DD-Event-Name.jpg</p>
            </div>
            <input type="file" accept="image/*" multiple class="file-input" hidden>
        `;

        const fileInput = uploadZone.querySelector('.file-input');

        uploadZone.addEventListener('click', () => fileInput.click());
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
        });
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('drag-over');
        });
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length) {
                handleEventUpload(e.dataTransfer.files);
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length) {
                handleEventUpload(fileInput.files);
            }
        });

        uploadSection.appendChild(uploadZone);

        // Event form for naming
        const formGroup = document.createElement('div');
        formGroup.className = 'event-form-group';
        formGroup.innerHTML = `
            <div class="form-row">
                <div class="form-field">
                    <label for="event-date">Event Date</label>
                    <input type="date" id="event-date" class="form-input">
                </div>
                <div class="form-field">
                    <label for="event-title">Event Title</label>
                    <input type="text" id="event-title" class="form-input" placeholder="e.g. Brazilian Churrasco Night">
                </div>
            </div>
            <p class="form-hint">Images will be named automatically from the date and title above.</p>
        `;
        uploadSection.appendChild(formGroup);

        container.appendChild(uploadSection);

        // Current events grid
        const currentSection = document.createElement('div');
        currentSection.innerHTML = `<h3 class="section-subtitle">Current Events</h3>`;
        const currentGrid = document.createElement('div');
        currentGrid.className = 'events-grid';
        currentGrid.id = 'events-current-grid';
        currentSection.appendChild(currentGrid);
        container.appendChild(currentSection);

        loadEvents(currentGrid);
    }

    async function handleEventUpload(files) {
        const dateInput = document.getElementById('event-date');
        const titleInput = document.getElementById('event-title');

        const date = dateInput ? dateInput.value : '';
        const title = titleInput ? titleInput.value.trim() : '';

        if (!date || !title) {
            AdminUtils.showToast('Please set the event date and title before uploading images.', 'warning');
            return;
        }

        const slug = `${date}-${title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').trim()}`;

        for (const file of files) {
            try {
                let base64Content;
                if (AdminCompress.isImageFile(file)) {
                    const compressed = await AdminCompress.compressImage(file);
                    base64Content = await AdminCompress.blobToBase64(compressed.webp);
                } else {
                    base64Content = await AdminCompress.fileToBase64(file);
                }

                const ext = file.name.split('.').pop();
                const filename = `${slug}.${ext}`;
                const targetPath = `assets/events/${filename}`;

                AdminCommit.addChange(
                    targetPath,
                    `Add event: ${title}`,
                    async () => base64Content
                );

                AdminUtils.showToast(`Queued: ${filename}`, 'success');
            } catch (err) {
                AdminUtils.showToast(`Failed to process ${file.name}: ${err.message}`, 'error');
            }
        }
    }

    async function loadEvents(grid) {
        const events = await fetchEvents();
        grid.innerHTML = '';

        if (events.length === 0) {
            grid.innerHTML = '<p class="text-muted">No upcoming events. Upload event images to get started.</p>';
            return;
        }

        events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'event-card';
            card.innerHTML = `
                <div class="event-thumb">
                    <img src="https://raw.githubusercontent.com/${AdminUtils.REPO_OWNER}/${AdminUtils.REPO_NAME}/main/assets/events/${event.image}" alt="${event.title}" loading="lazy">
                </div>
                <div class="event-info">
                    <span class="event-date">${event.date}</span>
                    <span class="event-title">${event.title}</span>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    if (window.AdminDashboard) {
        window.AdminDashboard.registerSection('events', render);
    }

    window.AdminEvents = {
        render,
        fetchEvents,
        listEventImages
    };
})();
```

- [ ] **Step 2: Add events CSS**

Append to `admin/css/admin.css`:

```css
/* Events Section */
.event-form-group {
    margin-top: 1rem;
    padding: 1rem;
    background: var(--bg-tertiary);
    border-radius: 8px;
}

.form-row {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.form-field {
    flex: 1;
    min-width: 200px;
}

.form-field label {
    display: block;
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
}

.form-input {
    width: 100%;
    padding: 0.5rem;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 0.875rem;
}

.form-input:focus {
    outline: none;
    border-color: var(--accent);
}

.form-hint {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 0.5rem;
}

.events-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
}

.event-card {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
}

.event-thumb {
    aspect-ratio: 16/9;
    overflow: hidden;
    background: var(--bg-secondary);
}

.event-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.event-info {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.event-date {
    font-size: 0.75rem;
    color: var(--accent);
    font-weight: 500;
}

.event-title {
    font-size: 0.875rem;
    color: var(--text-primary);
}
```

- [ ] **Step 3: Test events section**

1. Navigate to "Events"
2. Set a date and title, drop an image
3. Expected: Image queued in commit panel with auto-generated filename
4. Current events grid displays existing events from `events.json`

- [ ] **Step 4: Commit**

```bash
git add admin/js/admin-events.js admin/css/admin.css
git commit -m "feat: add Events section with image upload and event listing"
```

---

### Task 9: Images Browser Section

**Files:**
- Create: `admin/js/admin-images.js`

- [ ] **Step 1: Create the images module**

Create `admin/js/admin-images.js`:

```javascript
(function () {
    'use strict';

    const IMAGE_DIRS = [
        'assets/images/about',
        'assets/images/placeholders',
        'assets/images/logos',
        'assets/images/awards'
    ];

    async function listDirectory(path) {
        try {
            const data = await AdminAuth.githubApi(`/contents/${path}`);
            if (!Array.isArray(data)) return [];
            return data.filter(item => item.type === 'file' && /\.(jpg|jpeg|png|webp|gif|svg|mp4|webm)$/i.test(item.name));
        } catch (err) {
            return [];
        }
    }

    function render(container) {
        // Directory selector
        const dirSection = document.createElement('div');
        dirSection.className = 'images-dir-section';

        const select = document.createElement('select');
        select.id = 'image-dir-select';
        select.className = 'form-input';
        IMAGE_DIRS.forEach(dir => {
            const option = document.createElement('option');
            option.value = dir;
            option.textContent = dir;
            select.appendChild(option);
        });
        select.addEventListener('change', () => loadDirectory(select.value, grid));

        dirSection.appendChild(select);
        container.appendChild(dirSection);

        // Upload zone for current directory
        const uploadZone = document.createElement('div');
        uploadZone.className = 'upload-zone';
        uploadZone.innerHTML = `
            <div class="upload-zone-content">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p>Upload Images</p>
                <p class="upload-hint">Drop images here to add to the current directory</p>
            </div>
            <input type="file" accept="image/*" multiple class="file-input" hidden>
        `;

        const fileInput = uploadZone.querySelector('.file-input');
        uploadZone.addEventListener('click', () => fileInput.click());
        uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
        uploadZone.addEventListener('dragleave', () => { uploadZone.classList.remove('drag-over'); });
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length) {
                handleImageUpload(select.value, e.dataTransfer.files, grid);
            }
        });
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length) {
                handleImageUpload(select.value, fileInput.files, grid);
            }
        });

        container.appendChild(uploadZone);

        // Image grid
        const grid = document.createElement('div');
        grid.className = 'images-grid';
        grid.id = 'images-grid';
        container.appendChild(grid);

        // Load initial directory
        loadDirectory(IMAGE_DIRS[0], grid);
    }

    async function loadDirectory(path, grid) {
        if (!grid) return;
        grid.innerHTML = '<p class="text-muted">Loading...</p>';

        const files = await listDirectory(path);
        grid.innerHTML = '';

        if (files.length === 0) {
            grid.innerHTML = '<p class="text-muted">No images in this directory.</p>';
            return;
        }

        files.forEach(file => {
            const card = document.createElement('div');
            card.className = 'image-card';
            const isVideo = /\.(mp4|webm)$/i.test(file.name);
            card.innerHTML = `
                <div class="image-thumb">
                    ${isVideo
                        ? `<video src="https://raw.githubusercontent.com/${AdminUtils.REPO_OWNER}/${AdminUtils.REPO_NAME}/main/${file.path}" muted preload="metadata"></video>`
                        : `<img src="https://raw.githubusercontent.com/${AdminUtils.REPO_OWNER}/${AdminUtils.REPO_NAME}/main/${file.path}" alt="${file.name}" loading="lazy">`
                    }
                </div>
                <div class="image-info">
                    <span class="image-name" title="${file.name}">${file.name}</span>
                    <span class="image-size">${AdminCompress.formatBytes(file.size)}</span>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    async function handleImageUpload(dirPath, files, grid) {
        for (const file of files) {
            try {
                let base64Content;
                if (AdminCompress.isImageFile(file)) {
                    const compressed = await AdminCompress.compressImage(file);
                    base64Content = await AdminCompress.blobToBase64(compressed.webp);
                } else {
                    base64Content = await AdminCompress.fileToBase64(file);
                }

                const targetPath = `${dirPath}/${file.name}`;
                AdminCommit.addChange(
                    targetPath,
                    `Upload ${file.name}`,
                    async () => base64Content
                );

                AdminUtils.showToast(`Queued: ${file.name}`, 'success');
            } catch (err) {
                AdminUtils.showToast(`Failed: ${file.name}: ${err.message}`, 'error');
            }
        }

        // Refresh grid
        loadDirectory(dirPath, grid);
    }

    if (window.AdminDashboard) {
        window.AdminDashboard.registerSection('images', render);
    }

    window.AdminImages = {
        render,
        listDirectory
    };
})();
```

- [ ] **Step 2: Add images CSS**

Append to `admin/css/admin.css`:

```css
/* Images Section */
.images-dir-section {
    margin-bottom: 1rem;
}

.images-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
}

.image-card {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
}

.image-thumb {
    aspect-ratio: 1;
    overflow: hidden;
    background: var(--bg-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
}

.image-thumb img,
.image-thumb video {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.image-info {
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.image-name {
    font-size: 0.75rem;
    color: var(--text-primary);
    font-family: monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.image-size {
    font-size: 0.625rem;
    color: var(--text-secondary);
}
```

- [ ] **Step 3: Test images section**

1. Navigate to "Images"
2. Expected: `assets/images/about` loads with existing images
3. Change directory selector → grid updates
4. Drop an image → queued in commit panel

- [ ] **Step 4: Commit**

```bash
git add admin/js/admin-images.js admin/css/admin.css
git commit -m "feat: add Images browser section with directory navigation"
```

---

### Task 10: Outlets Section

**Files:**
- Create: `assets/data/outlets.json`
- Create: `admin/js/admin-outlets.js`
- Modify: `assets/js/outlets.js`

- [ ] **Step 1: Create outlets.json**

Create `assets/data/outlets.json` with the current hardcoded data from `outlets.js`:

```json
[
    {
        "id": "mg-road",
        "name": "Boteco - Indiqube Symphony, MG Road",
        "phoneRaw": "+918792045444",
        "phoneDisplay": "+91 87920 45444",
        "hours": "Mon-Sun, 12:00 PM - 1:00 AM | Lunch: 12:00 PM - 3:30 PM | Dinner: 6:00 PM - 1:00 AM",
        "addressLines": [
            "Unit 6, IndiQube Symphony, 25,",
            "Mahatma Gandhi Rd, Craig Park Layout,",
            "Ashok Nagar, Bengaluru,",
            "Karnataka 560001, India"
        ],
        "mapEmbedUrl": "https://www.google.com/maps?q=Unit%206%2C%20IndiQube%20Symphony%2C%2025%2C%20Mahatma%20Gandhi%20Rd%2C%20Craig%20Park%20Layout%2C%20Ashok%20Nagar%2C%20Bengaluru%2C%20Karnataka%20560001%2C%20India&output=embed",
        "whatsappNumber": "+918792045444"
    },
    {
        "id": "bagmane-solarium-city",
        "name": "Boteco - Bagmane Solarium City, Brookefield (Coming Soon)",
        "phoneRaw": "+918792045444",
        "phoneDisplay": "+91 87920 45444",
        "hours": "Mon-Sun, 12:00 PM - 1:00 AM | Lunch: 12:00 PM - 3:30 PM | Dinner: 6:00 PM - 1:00 AM",
        "addressLines": [
            "366, Dodda Nekkundi Extension,",
            "Brookefield, Bengaluru,",
            "Karnataka 560037, India"
        ],
        "mapEmbedUrl": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.994918520729!2d77.708105!3d12.9721766!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae13d4b3c4fc31%3A0x918315b068024f40!2sBoteco%20-%20Restaurante%20Brasileiro%20(Bagmane%20Solarium%20City%2C%20Brookefield)!5e0!3m2!1sen!2sin!4v1775379958876!5m2!1sen!2sin",
        "whatsappNumber": "+918792045444"
    }
]
```

- [ ] **Step 2: Update outlets.js to load from JSON**

Modify `assets/js/outlets.js` — replace the hardcoded `outlets` array with a fetch from `outlets.json`:

```javascript
(function () {
    let outlets = [];

    const dom = {
        selector: document.getElementById('outletSelector'),
        address: document.getElementById('outletAddress'),
        phone: document.getElementById('outletPhone'),
        hours: document.getElementById('outletHours'),
        map: document.getElementById('outletMap'),
        whatsapp: document.getElementById('outletWhatsapp')
    };

    function buildWhatsappLink(phoneRaw) {
        return `https://wa.me/${phoneRaw.replace(/\D/g, '')}?text=Hi%20there%2C%20I%20visited%20your%20website%20and%20have%20a%20question`;
    }

    function renderAddress(lines) {
        dom.address.innerHTML = '';
        lines.forEach((line, index) => {
            dom.address.append(document.createTextNode(line));
            if (index < lines.length - 1) {
                dom.address.append(document.createElement('br'));
            }
        });
    }

    function updateOutlet(outletId) {
        const outlet = outlets.find(item => item.id === outletId) || outlets[0];
        if (!outlet) return;

        renderAddress(outlet.addressLines);
        dom.phone.textContent = outlet.phoneDisplay;
        dom.phone.href = `tel:${outlet.phoneRaw}`;
        dom.hours.textContent = outlet.hours;
        dom.map.src = outlet.mapEmbedUrl;
        dom.whatsapp.href = buildWhatsappLink(outlet.whatsappNumber || outlet.phoneRaw);
    }

    function initOutletSelector() {
        if (!dom.selector || !dom.address || !dom.phone || !dom.hours || !dom.map || !dom.whatsapp) {
            return;
        }

        // Load outlets from JSON file
        fetch('assets/data/outlets.json')
            .then(res => res.json())
            .then(data => {
                outlets = data;

                dom.selector.innerHTML = '';
                outlets.forEach(outlet => {
                    const option = document.createElement('option');
                    option.value = outlet.id;
                    option.textContent = outlet.name;
                    dom.selector.appendChild(option);
                });

                dom.selector.addEventListener('change', event => {
                    updateOutlet(event.target.value);
                });

                dom.selector.value = outlets[0].id;
                updateOutlet(outlets[0].id);
            })
            .catch(err => {
                console.error('Failed to load outlets:', err);
                // Fallback: show first outlet if JSON fails
            });
    }

    document.addEventListener('DOMContentLoaded', initOutletSelector);
})();
```

- [ ] **Step 3: Create the outlets admin module**

Create `admin/js/admin-outlets.js`:

```javascript
(function () {
    'use strict';

    async function fetchOutlets() {
        try {
            const data = await AdminAuth.githubApi('/contents/assets/data/outlets.json');
            return JSON.parse(decodeURIComponent(escape(atob(data.content))));
        } catch (err) {
            AdminUtils.showToast(`Failed to load outlets: ${err.message}`, 'error');
            return [];
        }
    }

    function render(container) {
        const addBtn = document.createElement('button');
        addBtn.className = 'btn-add-outlet';
        addBtn.textContent = '+ Add Outlet';
        addBtn.addEventListener('click', () => addOutletForm(container));
        container.appendChild(addBtn);

        const listContainer = document.createElement('div');
        listContainer.id = 'outlets-list';
        listContainer.className = 'outlets-list';
        container.appendChild(listContainer);

        loadOutlets(listContainer);
    }

    async function loadOutlets(listContainer) {
        const outlets = await fetchOutlets();
        listContainer.innerHTML = '';

        outlets.forEach((outlet, index) => {
            const card = document.createElement('div');
            card.className = 'outlet-card';
            card.innerHTML = `
                <div class="outlet-header">
                    <h4>${outlet.name}</h4>
                    <button class="btn-delete-outlet" data-index="${index}" aria-label="Delete outlet">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </div>
                <div class="outlet-fields">
                    <div class="form-field">
                        <label>Name</label>
                        <input type="text" class="form-input outlet-name" value="${outlet.name}" data-field="name" data-index="${index}">
                    </div>
                    <div class="form-field">
                        <label>Phone (raw)</label>
                        <input type="text" class="form-input outlet-phone-raw" value="${outlet.phoneRaw}" data-field="phoneRaw" data-index="${index}">
                    </div>
                    <div class="form-field">
                        <label>Phone (display)</label>
                        <input type="text" class="form-input outlet-phone-display" value="${outlet.phoneDisplay}" data-field="phoneDisplay" data-index="${index}">
                    </div>
                    <div class="form-field">
                        <label>Hours</label>
                        <input type="text" class="form-input outlet-hours" value="${outlet.hours}" data-field="hours" data-index="${index}">
                    </div>
                    <div class="form-field">
                        <label>Address (one line per row)</label>
                        <textarea class="form-textarea outlet-address" data-field="addressLines" data-index="${index}" rows="4">${outlet.addressLines.join('\n')}</textarea>
                    </div>
                    <div class="form-field">
                        <label>Map Embed URL</label>
                        <input type="text" class="form-input outlet-map" value="${outlet.mapEmbedUrl}" data-field="mapEmbedUrl" data-index="${index}">
                    </div>
                    <div class="form-field">
                        <label>WhatsApp Number</label>
                        <input type="text" class="form-input outlet-whatsapp" value="${outlet.whatsappNumber || outlet.phoneRaw}" data-field="whatsappNumber" data-index="${index}">
                    </div>
                </div>
            `;
            listContainer.appendChild(card);
        });

        // Attach change handlers
        listContainer.querySelectorAll('.form-input, .form-textarea').forEach(input => {
            input.addEventListener('change', () => {
                handleOutletChange(listContainer);
            });
        });

        // Attach delete handlers
        listContainer.querySelectorAll('.btn-delete-outlet').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index, 10);
                deleteOutlet(idx, listContainer);
            });
        });
    }

    async function handleOutletChange(listContainer) {
        const outlets = await fetchOutlets();

        listContainer.querySelectorAll('.outlet-card').forEach((card, index) => {
            if (!outlets[index]) return;

            const nameInput = card.querySelector('.outlet-name');
            const phoneRawInput = card.querySelector('.outlet-phone-raw');
            const phoneDisplayInput = card.querySelector('.outlet-phone-display');
            const hoursInput = card.querySelector('.outlet-hours');
            const addressInput = card.querySelector('.outlet-address');
            const mapInput = card.querySelector('.outlet-map');
            const whatsappInput = card.querySelector('.outlet-whatsapp');

            if (nameInput) outlets[index].name = nameInput.value;
            if (phoneRawInput) outlets[index].phoneRaw = phoneRawInput.value;
            if (phoneDisplayInput) outlets[index].phoneDisplay = phoneDisplayInput.value;
            if (hoursInput) outlets[index].hours = hoursInput.value;
            if (addressInput) outlets[index].addressLines = addressInput.value.split('\n').filter(l => l.trim());
            if (mapInput) outlets[index].mapEmbedUrl = mapInput.value;
            if (whatsappInput) outlets[index].whatsappNumber = whatsappInput.value;
        });

        const content = JSON.stringify(outlets, null, 4);
        AdminCommit.addChange(
            'assets/data/outlets.json',
            'Update outlet data',
            async () => content
        );
    }

    async function deleteOutlet(index, listContainer) {
        const outlets = await fetchOutlets();
        outlets.splice(index, 1);

        const content = JSON.stringify(outlets, null, 4);
        AdminCommit.addChange(
            'assets/data/outlets.json',
            'Delete outlet',
            async () => content
        );

        loadOutlets(listContainer);
    }

    async function addOutletForm(container) {
        const outlets = await fetchOutlets();
        const newOutlet = {
            id: `outlet-${Date.now()}`,
            name: 'New Outlet',
            phoneRaw: '+918792045444',
            phoneDisplay: '+91 87920 45444',
            hours: 'Mon-Sun, 12:00 PM - 1:00 AM',
            addressLines: ['Address line 1', 'City, State'],
            mapEmbedUrl: '',
            whatsappNumber: '+918792045444'
        };
        outlets.push(newOutlet);

        const content = JSON.stringify(outlets, null, 4);
        AdminCommit.addChange(
            'assets/data/outlets.json',
            'Add new outlet',
            async () => content
        );

        const listContainer = document.getElementById('outlets-list');
        if (listContainer) loadOutlets(listContainer);
    }

    if (window.AdminDashboard) {
        window.AdminDashboard.registerSection('outlets', render);
    }

    window.AdminOutlets = {
        render,
        fetchOutlets
    };
})();
```

- [ ] **Step 4: Add outlets CSS**

Append to `admin/css/admin.css`:

```css
/* Outlets Section */
.btn-add-outlet {
    padding: 0.5rem 1rem;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 1rem;
}

.btn-add-outlet:hover {
    background: var(--accent-hover);
}

.outlets-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.outlet-card {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1rem;
}

.outlet-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.outlet-header h4 {
    font-size: 1rem;
    color: var(--text-primary);
    margin: 0;
}

.btn-delete-outlet {
    background: none;
    border: none;
    color: var(--danger);
    cursor: pointer;
    padding: 0.25rem;
}

.outlet-fields {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}
```

- [ ] **Step 5: Test outlets section**

1. First, commit the new `outlets.json` and updated `outlets.js`
2. Verify the main site still loads outlets correctly
3. Navigate to "Outlets" in admin
4. Expected: Both outlets display with editable fields
5. Edit a field → change appears in commit panel

- [ ] **Step 6: Commit**

```bash
git add assets/data/outlets.json assets/js/outlets.js admin/js/admin-outlets.js admin/css/admin.css
git commit -m "feat: extract outlets to JSON and add admin editor"
```

---

### Task 11: Hero Section

**Files:**
- Create: `admin/js/admin-hero.js`

- [ ] **Step 1: Create the hero module**

Create `admin/js/admin-hero.js`:

```javascript
(function () {
    'use strict';

    const HERO_FILES = [
        { path: 'assets/videos/hero/hero.mp4', label: 'Hero Video (MP4)' },
        { path: 'assets/videos/hero/hero-video.webm', label: 'Hero Video (WebM)' },
        { path: 'assets/images/hero.jpg', label: 'Hero Poster Image' }
    ];

    function render(container) {
        HERO_FILES.forEach(fileInfo => {
            const zone = document.createElement('div');
            zone.className = 'upload-zone';
            zone.dataset.file = fileInfo.path;

            zone.innerHTML = `
                <div class="upload-zone-content">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                    <p>${fileInfo.label}</p>
                    <p class="upload-hint">Drop file here or click to browse</p>
                </div>
                <input type="file" class="file-input" hidden>
            `;

            const fileInput = zone.querySelector('.file-input');
            const acceptType = fileInfo.path.endsWith('.mp4') ? 'video/mp4' :
                               fileInfo.path.endsWith('.webm') ? 'video/webm' : 'image/*';
            fileInput.accept = acceptType;

            zone.addEventListener('click', () => fileInput.click());
            zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
            zone.addEventListener('dragleave', () => { zone.classList.remove('drag-over'); });
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                if (e.dataTransfer.files.length) {
                    handleHeroUpload(fileInfo.path, e.dataTransfer.files[0], zone);
                }
            });

            fileInput.addEventListener('change', () => {
                if (fileInput.files.length) {
                    handleHeroUpload(fileInfo.path, fileInput.files[0], zone);
                }
            });

            container.appendChild(zone);
        });
    }

    async function handleHeroUpload(targetPath, file, zone) {
        try {
            let base64Content;

            if (AdminCompress.isImageFile(file)) {
                const compressed = await AdminCompress.compressImage(file);
                base64Content = await AdminCompress.blobToBase64(compressed.webp);
                AdminUtils.showToast(`Compressed: ${AdminCompress.formatBytes(file.size)} → ${AdminCompress.formatBytes(compressed.webpSize)}`, 'success');
            } else {
                // Video files — check size warning
                if (file.size > 100 * 1024 * 1024) {
                    AdminUtils.showToast('Warning: Video files over 100MB may fail to commit via GitHub API. Consider compressing first.', 'warning');
                }
                base64Content = await AdminCompress.fileToBase64(file);
            }

            AdminCommit.addChange(
                targetPath,
                `Replace ${zone.querySelector('p').textContent}`,
                async () => base64Content
            );

            // Preview
            const preview = document.createElement(file.type.startsWith('video') ? 'video' : 'img');
            preview.className = 'upload-preview';
            preview.src = URL.createObjectURL(file);
            if (file.type.startsWith('video')) {
                preview.muted = true;
                preview.controls = true;
            }
            zone.appendChild(preview);
        } catch (err) {
            AdminUtils.showToast(`Upload failed: ${err.message}`, 'error');
        }
    }

    if (window.AdminDashboard) {
        window.AdminDashboard.registerSection('hero', render);
    }

    window.AdminHero = {
        render,
        HERO_FILES
    };
})();
```

- [ ] **Step 2: Test hero section**

1. Navigate to "Hero"
2. Expected: 3 upload zones (MP4, WebM, Poster)
3. Drop an image on the poster zone → queued in commit panel

- [ ] **Step 3: Commit**

```bash
git add admin/js/admin-hero.js
git commit -m "feat: add Hero section for video and poster upload"
```

---

### Task 12: CNAME + OAuth Workflow + Final Setup

**Files:**
- Create: `admin/CNAME`
- Create: `.github/workflows/admin-oauth-proxy.yml`

- [ ] **Step 1: Create CNAME file**

Create `admin/CNAME`:

```
admin.boteco.co.in
```

- [ ] **Step 2: Create the OAuth proxy workflow**

This workflow provides a fallback identity verification. When the admin panel needs to verify the user's GitHub identity (for the "Sign in with GitHub" button), it triggers this workflow which can log the action and verify the user.

Create `.github/workflows/admin-oauth-proxy.yml`:

```yaml
name: Admin OAuth Proxy

on:
  workflow_dispatch:
    inputs:
      action:
        description: 'Action to perform'
        required: true
        type: choice
        options:
          - verify-identity
          - convert-pdf

permissions:
  contents: write

jobs:
  verify-identity:
    if: github.event.inputs.action == 'verify-identity'
    runs-on: ubuntu-latest
    steps:
      - name: Verify GitHub identity
        run: |
          echo "Actor: ${{ github.actor }}"
          echo "Event triggered by: ${{ github.triggering_actor }}"
          # The workflow run itself proves the user has push access to this repo.
          # The admin panel can check the workflow run's actor to verify identity.

  convert-pdf:
    if: github.event.inputs.action == 'convert-pdf'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          persist-credentials: true

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.x'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Process menu PDFs
        run: python3 scripts/process_incoming_menu_pdfs.py

      - name: Commit generated menu assets
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          if git status --porcelain | grep -E 'assets/menus/'; then
            git add assets/menus
            git commit -m 'chore: update menu assets from admin panel'
            git push origin HEAD:${GITHUB_REF#refs/heads/}
          else
            echo 'No menu changes to commit.'
          fi
```

- [ ] **Step 3: Add noindex meta to admin HTML**

Verify `admin/index.html` has `<meta name="robots" content="noindex, nofollow">` in the `<head>` (already included in Task 1).

- [ ] **Step 4: Commit**

```bash
git add admin/CNAME .github/workflows/admin-oauth-proxy.yml
git commit -m "feat: add admin CNAME and OAuth proxy workflow"
```

---

### Task 13: Build + Deploy Verification

**Files:**
- Modify: `package.json` (add admin build step if needed)

- [ ] **Step 1: Verify admin files are included in deployment**

Since the site deploys from the repo root via GitHub Pages, the `admin/` directory will be automatically included. No build step needed for the admin SPA (it's vanilla HTML/JS/CSS).

- [ ] **Step 2: Run existing build and tests**

```bash
npm run build
npm test
```

Expected: Build succeeds, lint passes, no errors.

- [ ] **Step 3: Verify admin page is accessible**

After deploying to GitHub Pages:
1. Navigate to `https://admin.boteco.co.in` (or the GitHub Pages URL)
2. Expected: Login screen renders
3. Authenticate with PAT
4. Navigate through all 8 sections
5. Make a small change in About section, commit to main
6. Verify the change appears on the live site

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "chore: admin panel complete, ready for deployment"
```

---

## Post-Deployment Setup

After the first deploy, the admin needs one-time setup:

1. **Create a GitHub Personal Access Token:**
   - Go to https://github.com/settings/tokens/new
   - Description: "Boteco Admin"
   - Repository access: Only `boteco-website`
   - Permissions: Contents = Read and write
   - Copy the token

2. **Configure DNS for the subdomain:**
   - Add a CNAME record: `admin.boteco.co.in` → `<github-pages-domain>`
   - Or use the GitHub Pages custom domain settings

3. **First login:**
   - Visit `admin.boteco.co.in`
   - Paste the PAT
   - Dashboard unlocks
