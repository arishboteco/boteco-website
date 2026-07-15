(function () {
    'use strict';

    const MAX_GITHUB_BLOB_BYTES = 100 * 1024 * 1024;
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

    function prepareBlob(content) {
        const compactContent = typeof content === 'string' ? content.replace(/\s/g, '') : '';
        const isBase64 = compactContent.length > 0
            && compactContent.length % 4 === 0
            && /^[A-Za-z0-9+/]*={0,2}$/.test(compactContent);

        if (isBase64) {
            const padding = compactContent.endsWith('==') ? 2 : (compactContent.endsWith('=') ? 1 : 0);
            return {
                content: compactContent,
                encoding: 'base64',
                size: (compactContent.length * 3 / 4) - padding
            };
        }

        const textContent = String(content);
        return {
            content: textContent,
            encoding: 'utf-8',
            size: new TextEncoder().encode(textContent).length
        };
    }

    async function commitWithGitDataApi(refName, commitMessage, changes) {
        const refData = await AdminAuth.githubApi(`/git/ref/heads/${refName}`);
        const baseSha = refData.object.sha;
        const baseCommit = await AdminAuth.githubApi(`/git/commits/${baseSha}`);
        const tree = [];

        for (let index = 0; index < changes.length; index++) {
            const change = changes[index];
            const content = await change.contentFn();
            const blob = prepareBlob(content);

            if (blob.size > MAX_GITHUB_BLOB_BYTES) {
                throw new Error(
                    `${change.filePath} is ${AdminCompress.formatBytes(blob.size)}. `
                    + 'GitHub only accepts files up to 100 MB; compress the video and try again.'
                );
            }

            const commitBtn = document.getElementById('btn-commit');
            commitBtn.textContent = `Uploading ${index + 1} of ${changes.length}...`;

            const blobData = await AdminAuth.githubApi('/git/blobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: blob.content, encoding: blob.encoding })
            });

            tree.push({
                path: change.filePath,
                mode: '100644',
                type: 'blob',
                sha: blobData.sha
            });
        }

        const treeData = await AdminAuth.githubApi('/git/trees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree })
        });

        const commitData = await AdminAuth.githubApi('/git/commits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: commitMessage,
                tree: treeData.sha,
                parents: [baseSha]
            })
        });

        await AdminAuth.githubApi(`/git/refs/heads/${refName}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sha: commitData.sha, force: false })
        });

        return commitData;
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
                await commitWithGitDataApi('main', commitMessage, pendingChanges);
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

                await commitWithGitDataApi(branchName, commitMessage, pendingChanges);

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
