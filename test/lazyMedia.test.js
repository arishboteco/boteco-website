const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup(reduced = false) {
    const handlers = {};
    let intersection;
    const source = { dataset: { src: 'clip.mp4' } };
    const video = { dataset: {}, loads: 0, plays: 0, pauses: 0,
        querySelectorAll: () => [source],
        load() { this.loads++; },
        play() { this.plays++; return Promise.resolve(); },
        pause() { this.pauses++; }
    };
    const document = { hidden: false,
        addEventListener: (name, fn) => { handlers[name] = fn; },
        querySelectorAll: () => [video]
    };
    class Observer { constructor(fn) { intersection = fn; } observe() {} }
    vm.runInNewContext(fs.readFileSync('assets/js/lazy-media.js', 'utf8'), {
        document, navigator: {}, IntersectionObserver: Observer,
        window: { matchMedia: () => ({ matches: reduced }), IntersectionObserver: Observer }
    });
    handlers.DOMContentLoaded();
    return { video, source, document, handlers,
        enter: () => intersection([{ target: video, isIntersecting: true }]),
        leave: () => intersection([{ target: video, isIntersecting: false }]) };
}
test('gallery video downloads only on screen and only once', () => {
    const s = setup();
    assert.equal(s.source.src, undefined);
    s.enter();
    assert.equal(s.video.loads, 1);
    s.leave();
    assert.equal(s.video.pauses, 1);
    s.enter();
    assert.equal(s.video.loads, 1);
});
test('hidden tabs pause playback and resume visible clips', () => {
    const s = setup(); s.enter(); s.document.hidden = true;
    s.handlers.visibilitychange(); assert.equal(s.video.pauses, 1);
    s.document.hidden = false; s.handlers.visibilitychange();
    assert.equal(s.video.plays, 2);
});
test('reduced motion keeps still posters without animation downloads', () => {
    const s = setup(true); s.enter();
    assert.equal(s.source.src, undefined);
    assert.equal(s.video.plays, 0);
});
