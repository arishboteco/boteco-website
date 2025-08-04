// Fetch event data from a local cache or the GitHub API and build cards.
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
            card.appendChild(img);
            card.appendChild(body);
            col.appendChild(card);
            fragment.appendChild(col);
        });
        container.appendChild(fragment);
    };

    // Attempt to load cached events first
    let loadedUpcoming = false;
    try {
        const localRes = await fetch('assets/events/events.json');
        if (localRes.ok) {
            const cachedEvents = await localRes.json();
            if (Array.isArray(cachedEvents) && cachedEvents.length > 0) {
                const sorted = sortByDate(cachedEvents);
                renderEvents(sorted, eventsGrid, 'assets/events', 'No upcoming events');
                loadedUpcoming = true;
            }
        }
    } catch (e) {
        console.warn('Could not load local events cache:', e);
    }

    // Fallback to GitHub API
    if (!loadedUpcoming) {
        try {
            const apiUrl = 'https://api.github.com/repos/arishboteco/boteco-website/contents/assets/events?ref=main';
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            const files = await response.json();
            const imageFiles = files.filter(item => item.type === 'file' && /\.(png|jpe?g|webp)$/i.test(item.name));
            if (imageFiles.length === 0) {
                renderEvents([], eventsGrid, 'assets/events', 'No upcoming events');
            } else {
                const events = imageFiles.map(file => {
                    const baseName = file.name.replace(/\.[^.]+$/, '');
                    const parts = baseName.split('-');
                    if (parts.length < 4) return null;
                    const [year, month, day, ...titleParts] = parts;
                    if (!year || !month || !day || titleParts.length === 0) return null;
                    const isoDate = `${year}-${month}-${day}`;
                    const title = titleParts.join(' ').replace(/_/g, ' ');
                    return { date: isoDate, title, image: file.name };
                }).filter(Boolean);
                const sortedEvents = sortByDate(events);
                renderEvents(sortedEvents, eventsGrid, 'assets/events', 'No upcoming events');
            }
        } catch (error) {
            console.error('Error loading events:', error);
            renderEvents([], eventsGrid, 'assets/events', 'No upcoming events'); // Show friendly message
        }
    }

    // Load archived events
    if (archiveSection && archiveGrid) {
        try {
            const archRes = await fetch('assets/events/archive/archive.json');
            if (archRes.ok) {
                const archivedEvents = await archRes.json();
                if (Array.isArray(archivedEvents) && archivedEvents.length > 0) {
                    const sortedArchived = sortByDate(archivedEvents);
                    renderEvents(sortedArchived, archiveGrid, 'assets/events/archive', 'No past events');
                } else {
                    archiveSection.style.display = 'none';
                }
            } else {
                archiveSection.style.display = 'none';
            }
        } catch (e) {
            archiveSection.style.display = 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', loadEvents);
