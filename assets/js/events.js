// Validate that a string is a properly formed URL.
function isValidUrl(str) {
    try {
        new URL(str);
        return true;
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

// Fetch event data from a local cache and build cards.
async function loadEvents() {
    const eventsSection = document.getElementById('events');
    const eventsGrid = document.getElementById('events-grid');
    const archiveSection = document.getElementById('events-archive');
    const archiveGrid = document.getElementById('archive-grid');
    if (!eventsSection || !eventsGrid) return;

    try {
        const res = await fetch('assets/events/events_combined.json');
        if (!res.ok) {
            throw new Error('Failed to fetch events');
        }
        const data = await res.json();

        const upcoming = Array.isArray(data.upcoming)
            ? sortByDate(data.upcoming)
            : [];
        renderEvents(upcoming, eventsGrid, 'assets/events', 'No upcoming events');

        if (archiveSection && archiveGrid) {
            const archive = Array.isArray(data.archive)
                ? sortByDate(data.archive)
                : [];
            if (archive.length > 0) {
                renderEvents(archive, archiveGrid, 'assets/events/archive', 'No past events');
            } else {
                archiveSection.style.display = 'none';
            }
        }
    } catch (e) {
        console.warn('Could not load events:', e);
        renderEvents([], eventsGrid, 'assets/events', 'No upcoming events');
        if (archiveSection) {
            archiveSection.style.display = 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', loadEvents);
