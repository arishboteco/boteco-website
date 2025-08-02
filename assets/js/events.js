// Fetch event data from a local cache or the GitHub API and build cards.
async function loadEvents() {
    const eventsSection = document.getElementById('events');
    const eventsGrid = document.getElementById('events-grid');
    if (!eventsSection || !eventsGrid) return;

    const sortByDate = (arr) =>
        arr.slice().sort((a, b) => new Date(a.date) - new Date(b.date));

    const renderEvents = (events) => {
        if (!events || events.length === 0) {
            eventsGrid.innerHTML = '<p class="text-center w-100">No upcoming events</p>';
            return;
        }
        eventsGrid.innerHTML = '';
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
            img.src = `assets/events/${evt.image}`;
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

            eventsGrid.appendChild(col);
        });
    };

    // Attempt to load cached events first
    try {
        const localRes = await fetch('assets/events/events.json');
        if (localRes.ok) {
            const cachedEvents = await localRes.json();
            if (Array.isArray(cachedEvents) && cachedEvents.length > 0) {
                const sorted = sortByDate(cachedEvents);
                renderEvents(sorted);
                return; // Skip API call when cache is available
            }
        }
    } catch (e) {
        console.warn('Could not load local events cache:', e);
    }

    // Fallback to GitHub API
    try {
        const apiUrl = 'https://api.github.com/repos/arishboteco/boteco-website/contents/assets/events?ref=main';
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        const files = await response.json();
        const imageFiles = files.filter(item => item.type === 'file' && /\.(png|jpe?g|webp)$/i.test(item.name));
        if (imageFiles.length === 0) {
            renderEvents([]);
            return;
        }
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
        renderEvents(sortedEvents);
    } catch (error) {
        console.error('Error loading events:', error);
        renderEvents([]); // Show friendly message
    }
}

document.addEventListener('DOMContentLoaded', loadEvents);
