/* Download and play gallery clips only while on screen. */
(function () {
    'use strict';
    const observed = new WeakSet();
    const visible = new Set();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        (navigator.connection && navigator.connection.saveData);
    function play(video) {
        if (document.hidden || reduced) return;
        if (!video.dataset.loaded) {
            video.querySelectorAll('source[data-src]').forEach(source => {
                source.src = source.dataset.src;
            });
            video.dataset.loaded = 'true';
            video.load();
        }
        video.play().catch(() => {});
    }
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                visible.add(entry.target);
                play(entry.target);
            } else {
                visible.delete(entry.target);
                entry.target.pause();
            }
        });
    }, { threshold: 0.05 }) : null;
    function scan() {
        document.querySelectorAll('video[data-lazy-video]').forEach(video => {
            if (observed.has(video)) return;
            observed.add(video);
            if (reduced) return;
            if (observer) observer.observe(video);
            else {
                visible.add(video);
                play(video);
            }
        });
    }
    document.addEventListener('DOMContentLoaded', scan);
    document.addEventListener('boteco:media-added', scan);
    document.addEventListener('visibilitychange', () => {
        visible.forEach(video => document.hidden ? video.pause() : play(video));
    });
})();
