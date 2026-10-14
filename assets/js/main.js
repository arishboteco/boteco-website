// Keep the footer year current on every page load.
document.addEventListener('DOMContentLoaded', () => {
    const year = document.getElementById('copyright-year');
    if (year) year.textContent = String(new Date().getFullYear());
});

// Main JavaScript file for Boteco Website
// This file combines all modular JavaScript components

// ============================================================================
// EVENTS MODULE
// ============================================================================

// Validate that a string is a properly formed URL.
function isValidUrl(str) {
    try {
        const url = new URL(str);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

// Sort events by date.
function sortByDate(arr) {
    return arr.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Render events into the specified container.
function renderEvents(events, container, basePath, emptyMsg) {
    if (!events || events.length === 0) {
        container.innerHTML = `<p class="text-center w-100">${emptyMsg}</p>`;
        return;
    }
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();
    events.forEach(evt => {
        const dateObj = new Date(evt.date);
        const dateString = isNaN(dateObj)
            ? evt.date
            : dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

        const col = document.createElement('div');
        col.className = 'col-md-4';

        const card = document.createElement('div');
        card.className = 'card event-card h-100';

        const img = document.createElement('img');
        img.loading = 'lazy';
        img.src = `${basePath}/${evt.image}`;
        img.className = 'card-img-top';
        img.alt = evt.title;

        let media = img;
        if (isValidUrl(evt.link)) {
            const anchor = document.createElement('a');
            anchor.href = evt.link;
            if (evt.embeddable === false) {
                anchor.target = '_blank';
                anchor.rel = 'noopener';
            } else {
                anchor.addEventListener('click', (e) => {
                    const modalEl = document.getElementById('eventLinkModal');
                    if (typeof bootstrap !== 'undefined' && modalEl) {
                        e.preventDefault();
                        const iframe = document.getElementById('eventLinkIframe');
                        if (iframe) {
                            iframe.src = '';
                            iframe.setAttribute('data-src', evt.link);
                        }
                        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                        modal.show();
                    }
                });
            }
            anchor.appendChild(img);
            media = anchor;
        }

        const body = document.createElement('div');
        body.className = 'card-body';

        const titleEl = document.createElement('h5');
        titleEl.className = 'card-title';
        titleEl.textContent = evt.title;

        const dateEl = document.createElement('p');
        dateEl.className = 'card-text';
        dateEl.textContent = dateString;

        body.appendChild(titleEl);
        body.appendChild(dateEl);
        card.appendChild(media);
        card.appendChild(body);
        col.appendChild(card);
        fragment.appendChild(col);
    });
    container.appendChild(fragment);
}

// Use the restaurant's calendar date, even when visitors are abroad.
function upcomingEvents(events, now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(now);
    const part = type => parts.find(item => item.type === type).value;
    const today = `${part('year')}-${part('month')}-${part('day')}`;
    return events.filter(event =>
        /^\d{4}-\d{2}-\d{2}$/.test(event.date) && event.date >= today
    );
}

// Fetch and render events from JSON files
async function fetchAndRenderEvents(jsonPath, container, section, basePath, emptyMsg) {
    try {
        const res = await fetch(jsonPath);
        if (!res.ok) {
            throw new Error('Failed to fetch events');
        }
        const raw = await res.json();
        const data = Array.isArray(raw) ? upcomingEvents(raw) : [];
        if (Array.isArray(data) && data.length > 0) {
            renderEvents(sortByDate(data), container, basePath, emptyMsg);
        } else {
            if (section) section.style.display = 'none';
            else renderEvents([], container, basePath, emptyMsg);
        }
    } catch (e) {
        console.warn(`Could not load events from ${jsonPath}:`, e);
        if (section) section.style.display = 'none';
        else renderEvents([], container, basePath, emptyMsg);
    }
}

// Load events on page load
async function loadEvents() {
    const eventsSection = document.getElementById('events');
    const eventsGrid = document.getElementById('events-grid');
    if (!eventsSection || !eventsGrid) return;

    await fetchAndRenderEvents(
        'assets/events/events.json',
        eventsGrid,
        null,
        'assets/events',
        'No upcoming events'
    );

}

document.addEventListener('DOMContentLoaded', loadEvents);

// ============================================================================
// LIGHTWIDGET MODULE (Instagram Feed)
// ============================================================================

((e, i, d) => {
    var g;
    void 0 === e.lightwidget && (e.lightwidget = {}, g = null, e.addEventListener('message', function (e) {
        var t;
        -1 !== d.indexOf(e.origin.replace(/^https?:\/\//i, '')) && ('lightwidget_lightbox' === (t = 'object' == typeof e.data ? e.data : JSON.parse(e.data)).type && null === g ? ((g = i.createElement('script')).src = 'https://cdn.lightwidget.com/widgets/lightwidget-lightbox.y.js'.replace('y', t.version),
            i.body.appendChild(g)) : t.size <= 0 || [].forEach.call(i.querySelectorAll('iframe[src*="lightwidget.com/widgets/x"],iframe[data-src*="lightwidget.com/widgets/x"],iframe[src*="instansive.com/widgets/x"]'.replace(/x/g, t.widgetId)), function (e) {
                e.style.height = t.size + 'px';
            }));
    }, !1));
})(window, document, ['lightwidget.com', 'dev.lightwidget.com', 'cdn.lightwidget.com']);

// ============================================================================
// LIGHTWIDGET LIGHTBOX Z-INDEX FIX
// ============================================================================

(() => {
    var LIGHTBOX_Z = '999999';
    var OVERLAY_Z = '999998';

    function setStyle(el, name, value) {
        if (el.style.getPropertyValue(name) !== value || el.style.getPropertyPriority(name) !== 'important') {
            el.style.setProperty(name, value, 'important');
        }
    }

    function forceOnTop(el) {
        if (el.nodeType !== 1 || !el.className || typeof el.className !== 'string') return;
        var cls = el.className;
        if (/\blw-lightbox\b/.test(cls) || /\blightbox-/.test(cls)) {
            setStyle(el, 'z-index', LIGHTBOX_Z);
            setStyle(el, 'position', 'fixed');
            setStyle(el, 'top', '0');
            setStyle(el, 'left', '0');
            setStyle(el, 'width', '100vw');
            setStyle(el, 'height', '100vh');
        }
        if (/\blw-overlay\b/.test(cls)) {
            setStyle(el, 'z-index', OVERLAY_Z);
            setStyle(el, 'position', 'fixed');
            setStyle(el, 'top', '0');
            setStyle(el, 'left', '0');
            setStyle(el, 'width', '100vw');
            setStyle(el, 'height', '100vh');
        }
        if (/\blw-lightbox-container\b/.test(cls)) {
            setStyle(el, 'position', 'fixed');
        }
    }

    function scanAll() {
        try {
            document.querySelectorAll('[class*="lw-"], [class*="lightbox-"]').forEach(forceOnTop);
        } catch (e) { /* selector unsupported */ }
    }

    scanAll();

    var scanPending = false;
    var observer = new MutationObserver(function () {
        if (scanPending) return;
        scanPending = true;
        requestAnimationFrame(function () {
            scanPending = false;
            scanAll();
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
    });
})();

// ============================================================================
// HERO VIDEO MODULE
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    const video = document.querySelector('.hero-video');
    if (!video) return;

    const poster = video.getAttribute('poster');
    const sources = video.querySelectorAll('source');

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersReducedData = window.matchMedia('(prefers-reduced-data: reduce)').matches ||
        (navigator.connection && navigator.connection.saveData);

    let attemptPlay;
    let onVisibilityChange;
    let heroVisible = false;
    let heroLoaded = false;

    const swapToImage = () => {
        const img = document.createElement('img');
        img.src = poster;
        img.alt = 'Boteco hero image';
        img.className = 'hero-video';
        video.replaceWith(img);
        video.removeEventListener('pause', attemptPlay);
        video.removeEventListener('ended', attemptPlay);
        document.removeEventListener('visibilitychange', onVisibilityChange);
    };

    if (prefersReducedMotion || prefersReducedData) {
        swapToImage();
        return;
    }

    attemptPlay = () => {
        video.play().catch(swapToImage);
    };

    onVisibilityChange = () => {
        if (document.visibilityState === 'visible' && heroVisible) {
            attemptPlay();
        } else {
            video.pause();
        }
    };

    const loadVideo = () => {
        if (heroLoaded || !heroVisible || document.hidden) return;
        heroLoaded = true;
        sources.forEach(source => {
            source.src = source.dataset.src;
        });
        video.addEventListener('error', swapToImage, { once: true });
        video.load();
        attemptPlay();
        video.addEventListener('ended', attemptPlay);
        document.addEventListener('visibilitychange', onVisibilityChange);
    };

    let pageReady = document.readyState === 'complete';
    function startWhenReady() {
        if (pageReady && heroVisible) loadVideo();
    }
    if (!pageReady) {
        window.addEventListener('load', () => {
            window.setTimeout(() => {
                pageReady = true;
                startWhenReady();
            }, 500);
        }, { once: true });
    }
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                heroVisible = entry.isIntersecting;
                if (!heroVisible) video.pause();
                else if (heroLoaded) attemptPlay();
                else startWhenReady();
            });
        });
        observer.observe(video);
    } else {
        heroVisible = true;
        startWhenReady();
    }

});

// ============================================================================
// IFRAME LAZY LOADING
// ============================================================================

// Booking forms load only when opened; other embeds load near the viewport.
document.addEventListener('DOMContentLoaded', () => {
    function loadFrame(iframe) {
        const src = iframe.getAttribute('data-src');
        if (src && !iframe.getAttribute('src')) {
            iframe.src = src;
        }
    }

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('shown.bs.modal', () => {
            modal.querySelectorAll('iframe[data-src]').forEach(loadFrame);
        });
    });

    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            loadFrame(entry.target);
            observer.unobserve(entry.target);
        });
    }, { rootMargin: '200px' }) : null;

    document.querySelectorAll('iframe[data-src]').forEach(iframe => {
        if (iframe.closest('.modal')) return;
        if (observer) observer.observe(iframe);
        else loadFrame(iframe);
    });
});

// ============================================================================
// HEADER / NAVIGATION MODULE
// ============================================================================

document.addEventListener('DOMContentLoaded', function () {
    const navbar = document.querySelector('nav.navbar');
    if (!navbar) return;

    let pointerInTop = false;
    let scrolledPastTop = false;

    // Create a sentinel element to track scroll position
    const sentinel = document.createElement('div');
    sentinel.style.position = 'absolute';
    sentinel.style.top = 0;
    sentinel.style.left = 0;
    sentinel.style.width = '100%';
    sentinel.style.height = '1px';
    sentinel.style.pointerEvents = 'none';
    document.body.prepend(sentinel);

    const observer = new IntersectionObserver(function (entries) {
        scrolledPastTop = !entries[0].isIntersecting;
        updateVisibility();
    });
    observer.observe(sentinel);

    document.addEventListener('mousemove', function (e) {
        pointerInTop = e.clientY <= 80 || navbar.contains(e.target);
        updateVisibility();
    });

    function updateVisibility() {
        if (scrolledPastTop || pointerInTop) {
            navbar.classList.remove('navbar-hidden');
        } else {
            navbar.classList.add('navbar-hidden');
        }
    }
});

// ============================================================================
// FADE-IN ANIMATIONS MODULE
// ============================================================================

document.addEventListener('DOMContentLoaded', function () {
    const sections = document.querySelectorAll('.fade-in-section');
    if (sections.length === 0) return;

    // Skip animations if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        sections.forEach(function (sec) {
            sec.classList.add('visible');
        });
        return;
    }

    const observer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    sections.forEach(function (sec) {
        observer.observe(sec);
    });
});

// ============================================================================
// MENU CARD HEIGHT NORMALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    const menuImages = Array.from(document.querySelectorAll('.menus-section .menu-card img'));
    if (menuImages.length === 0) return;

    let loaded = 0;
    let minHeight = Infinity;

    menuImages.forEach(img => {
        const onLoad = () => {
            const h = img.clientHeight || img.naturalHeight;
            if (h > 0) {
                minHeight = Math.min(minHeight, h);
            }
            loaded++;
            if (loaded === menuImages.length && isFinite(minHeight)) {
                menuImages.forEach(image => {
                    image.style.height = minHeight + 'px';
                    image.style.objectFit = 'contain';
                });
            }
        };

        if (img.complete) {
            onLoad();
        } else {
            img.addEventListener('load', onLoad);
            img.addEventListener('error', onLoad);
        }
    });
});

// ============================================================================
// CAROUSEL COUNTER MODULE
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    const carousels = document.querySelectorAll('.modal .carousel');
    carousels.forEach(carouselEl => {
        const instance = bootstrap.Carousel.getOrCreateInstance(carouselEl);
        const items = carouselEl.querySelectorAll('.carousel-item');
        const total = items.length;
        const modal = carouselEl.closest('.modal');
        const counterEl = modal.querySelector('.image-counter');
        const prevBtn = modal.querySelector('.prev-btn');
        const nextBtn = modal.querySelector('.next-btn');

        function update(index) {
            if (counterEl) {
                counterEl.textContent = `${index + 1} / ${total}`;
            }
        }

        const active = Array.from(items).indexOf(carouselEl.querySelector('.carousel-item.active'));
        update(active >= 0 ? active : 0);

        carouselEl.addEventListener('slid.bs.carousel', e => {
            const idx = typeof e.to === 'number'
                ? e.to
                : Array.from(items).indexOf(carouselEl.querySelector('.carousel-item.active'));
            update(idx >= 0 ? idx : 0);
        });

        if (prevBtn) prevBtn.addEventListener('click', () => instance.prev());
        if (nextBtn) nextBtn.addEventListener('click', () => instance.next());
    });
});

// ============================================================================
// SMOOTH SCROLLING FOR ANCHOR LINKS
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        const hash = link.getAttribute('href');
        if (hash.length > 1 && !link.hasAttribute('data-bs-toggle')) {
            link.addEventListener('click', e => {
                const target = document.querySelector(hash);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    });
});
