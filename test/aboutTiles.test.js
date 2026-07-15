const assert = require('node:assert/strict');
const test = require('node:test');

test('About tile renderer uses an external video URL when configured', async () => {
    const children = [];
    const grid = {
        appendChild(child) { children.push(child); }
    };
    const videoUrl = 'https://github.com/arishboteco/boteco-website/releases/download/admin-media/about-tile5.mp4';

    global.document = {
        getElementById(id) { return id === 'about-images-grid' ? grid : null; },
        createElement() { return { innerHTML: '' }; }
    };
    global.fetch = async () => ({
        async json() { return [{ num: 5, type: 'video', ext: 'mp4', url: videoUrl }]; }
    });

    require('../assets/js/about-tiles.js');
    await new Promise(resolve => setImmediate(resolve));

    assert.equal(children.length, 1);
    assert.match(children[0].innerHTML, new RegExp(videoUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

    delete global.document;
    delete global.fetch;
});
