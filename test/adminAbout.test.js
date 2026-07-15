const assert = require('node:assert/strict');
const test = require('node:test');

test('large About videos upload as binary release assets', async () => {
    const apiCalls = [];
    let uploaded;

    global.window = {};
    global.AdminCompress = {
        formatBytes(bytes) { return `${bytes} bytes`; }
    };
    global.AdminAuth = {
        async githubApi(path, options = {}) {
            apiCalls.push({ path, options });
            if (path === '/releases/tags/admin-media') {
                const error = new Error('Not Found');
                error.status = 404;
                throw error;
            }
            if (path === '/releases') {
                return {
                    upload_url: 'https://uploads.github.com/repos/arishboteco/boteco-website/releases/123/assets{?name,label}'
                };
            }
            throw new Error(`Unexpected API path: ${path}`);
        },
        async githubUpload(url, file) {
            uploaded = { url, file };
            return {
                browser_download_url: 'https://github.com/arishboteco/boteco-website/releases/download/admin-media/about-tile5.mp4'
            };
        }
    };

    require('../admin/js/admin-about.js');

    const file = { size: 75 * 1024 * 1024, type: 'video/mp4' };
    const url = await window.AdminAbout.uploadAboutVideo(file, 5, 'mp4');

    assert.equal(apiCalls[0].path, '/releases/tags/admin-media');
    assert.equal(apiCalls[1].path, '/releases');
    assert.equal(JSON.parse(apiCalls[1].options.body).tag_name, 'admin-media');
    assert.match(uploaded.url, /^https:\/\/uploads\.github\.com\/.+\?name=about-tile5-\d+\.mp4$/);
    assert.equal(uploaded.file, file);
    assert.equal(url, 'https://github.com/arishboteco/boteco-website/releases/download/admin-media/about-tile5.mp4');

    delete global.window;
    delete global.AdminCompress;
    delete global.AdminAuth;
});
