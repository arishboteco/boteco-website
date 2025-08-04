// Validate that a string is a properly formed URL.
function isValidUrl(str) {
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
}

// Fetch event data from a local cache and build cards.
async function loadEvents() {
    const eventsSection = document.getElementById('events');
    const eventsGrid = document.getElementById('events-grid');
    const archiveSection = document.getElementById('events-archive');
    const archiveGrid = document.getElementById('archive-grid');
    if (!eventsSection || !eventsGrid) return;

    const sortByDate = (arr) =>
        arr.slice().sort((a, b) => new Date(a.date) - new Date(b.date));

    const renderEvents = (events, container, basePath, emptyMsg) => {
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
                anchor.href = '#';
                anchor.dataset.bsToggle = 'modal';
                anchor.dataset.bsTarget = '#eventLinkModal';
                anchor.addEventListener('click', (e) => {
                    e.preventDefault();
                    const iframe = document.getElementById('eventLinkIframe');
                    if (iframe) {
                        iframe.src = evt.link;
                        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('eventLinkModal'));
                        modal.show();
                    }
                });
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
    };

    const fetchAndRenderEvents = async (url, gridEl, sectionEl, basePath, emptyMsg) => {
        try {
            const res = await fetch(url);
            if (res.ok) {
                const events = await res.json();
                if (Array.isArray(events) && events.length > 0) {
                    const sorted = sortByDate(events);
                    renderEvents(sorted, gridEl, basePath, emptyMsg);
                } else if (sectionEl) {
                    sectionEl.style.display = 'none';
                } else {
                    renderEvents([], gridEl, basePath, emptyMsg);
                }
            } else if (sectionEl) {
                sectionEl.style.display = 'none';
            } else {
                renderEvents([], gridEl, basePath, emptyMsg);
            }
        } catch (e) {
            console.warn(`Could not load events from ${url}:`, e);
            if (sectionEl) {
                sectionEl.style.display = 'none';
            } else {
                renderEvents([], gridEl, basePath, emptyMsg);
            }
        }
    };

    // Load upcoming events from the local cache
    await fetchAndRenderEvents(
        'assets/events/events.json',
        eventsGrid,
        null,
        'assets/events',
        'No upcoming events'
    );

    // Load archived events
    if (archiveSection && archiveGrid) {
        await fetchAndRenderEvents(
            'assets/events/archive/archive.json',
            archiveGrid,
            archiveSection,
            'assets/events/archive',
            'No past events'
        );
    }
}

document.addEventListener('DOMContentLoaded', loadEvents);
