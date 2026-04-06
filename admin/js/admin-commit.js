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

        list.querySelectorAll('.btn-remove-change').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.index, 10);
                pendingChanges.splice(idx, 1);
                renderChanges();
            });
        });

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
                return null;
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
                for (const change of pendingChanges) {
                    const sha = await getFileSha(change.filePath);
                    const content = await change.contentFn();
                    const isBase64 = typeof content === 'string' && /^[A-Za-z0-9+/=]+$/.test(content);
                    const base64Content = isBase64 ? content : btoa(unescape(encodeURIComponent(content)));

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
                const branchName = `admin-update-${Date.now()}`;

                const refData = await AdminAuth.githubApi(`/git/ref/heads/main`);
                const baseSha = refData.object.sha;

                await AdminAuth.githubApi(`/git/refs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ref: `refs/heads/${branchName}`,
                        sha: baseSha
                    })
                });

                for (const change of pendingChanges) {
                    const sha = await getFileSha(change.filePath);
                    const content = await change.contentFn();
                    const isBase64 = typeof content === 'string' && /^[A-Za-z0-9+/=]+$/.test(content);
                    const base64Content = isBase64 ? content : btoa(unescape(encodeURIComponent(content)));

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
