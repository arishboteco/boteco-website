const assert = require('node:assert/strict');
const test = require('node:test');

test('admin commits queued files atomically through the Git data API', async () => {
    const apiCalls = [];
    const toasts = [];
    let executeCommit;

    const commitButton = {
        disabled: false,
        textContent: 'Commit Changes',
        addEventListener(event, handler) {
            if (event === 'click') executeCommit = handler;
        }
    };
    const elements = {
        'btn-commit': commitButton,
        'commit-message': { value: 'admin: test atomic upload' },
        'commit-mode': { value: 'direct' },
        'pending-changes': {
            innerHTML: '',
            appendChild() {},
            querySelectorAll() { return []; }
        },
        'change-count': { textContent: '' },
        'commit-panel-body': { style: { display: 'none' } }
    };

    global.window = {};
    global.document = {
        addEventListener(event, handler) {
            if (event === 'DOMContentLoaded') handler();
        },
        getElementById(id) {
            return elements[id] || null;
        },
        createElement() {
            return { className: '', innerHTML: '' };
        }
    };
    global.AdminUtils = {
        showToast(message, type) { toasts.push({ message, type }); }
    };
    global.AdminCompress = {
        formatBytes(bytes) { return `${bytes} bytes`; }
    };
    global.AdminAuth = {
        async githubApi(path, options = {}) {
            apiCalls.push({ path, options });
            if (path === '/git/ref/heads/main') return { object: { sha: 'base-commit' } };
            if (path === '/git/commits/base-commit') return { tree: { sha: 'base-tree' } };
            if (path === '/git/blobs') return { sha: `blob-${apiCalls.filter(call => call.path === '/git/blobs').length}` };
            if (path === '/git/trees') return { sha: 'new-tree' };
            if (path === '/git/commits') return { sha: 'new-commit' };
            if (path === '/git/refs/heads/main') return {};
            throw new Error(`Unexpected API path: ${path}`);
        }
    };

    require('../admin/js/admin-commit.js');

    window.AdminCommit.addChange('assets/images/about/about-us-tile5.mp4', 'Replace video', async () => 'AQID');
    window.AdminCommit.addChange('assets/data/about-tiles.json', 'Update config', async () => '[{"num":5}]');
    await executeCommit();

    assert.equal(apiCalls.some(call => call.path.startsWith('/contents/')), false);
    assert.deepEqual(
        apiCalls.filter(call => call.path === '/git/blobs').map(call => JSON.parse(call.options.body).encoding),
        ['base64', 'utf-8']
    );

    const treeBody = JSON.parse(apiCalls.find(call => call.path === '/git/trees').options.body);
    assert.equal(treeBody.base_tree, 'base-tree');
    assert.deepEqual(treeBody.tree.map(entry => entry.path), [
        'assets/images/about/about-us-tile5.mp4',
        'assets/data/about-tiles.json'
    ]);
    assert.equal(apiCalls.at(-1).path, '/git/refs/heads/main');
    assert.equal(apiCalls.at(-1).options.method, 'PATCH');
    assert.deepEqual(toasts.at(-1), { message: 'Changes committed successfully!', type: 'success' });
    assert.equal(commitButton.disabled, false);
    assert.equal(commitButton.textContent, 'Commit Changes');

    delete global.window;
    delete global.document;
    delete global.AdminUtils;
    delete global.AdminCompress;
    delete global.AdminAuth;
});
