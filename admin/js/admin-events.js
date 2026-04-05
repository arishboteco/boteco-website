(function () {
    'use strict';

    async function fetchEvents() {
        try {
            const data = await AdminAuth.githubApi('/contents/assets/events/events.json');
            return JSON.parse(decodeURIComponent(escape(atob(data.content))));
        } catch (err) {
            AdminUtils.showToast(`Failed to load events: ${err.message}`, 'error');
            return [];
        }
    }

    function render(container) {
        const uploadSection = document.createElement('div');
        uploadSection.className = 'events-upload-section';

        const uploadZone = document.createElement('div');
        uploadZone.className = 'upload-zone';
        uploadZone.innerHTML = `
            <div class="upload-zone-content">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p>Upload Event Images</p>
                <p class="upload-hint">Drop images here. Use format: YYYY-MM-DD-Event-Name.jpg</p>
            </div>
            <input type="file" accept="image/*" multiple class="file-input" hidden>
        `;

        const fileInput = uploadZone.querySelector('.file-input');

        uploadZone.addEventListener('click', () => fileInput.click());
        uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
        uploadZone.addEventListener('dragleave', () => { uploadZone.classList.remove('drag-over'); });
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length) {
                handleEventUpload(e.dataTransfer.files);
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length) {
                handleEventUpload(fileInput.files);
            }
        });

        uploadSection.appendChild(uploadZone);

        const formGroup = document.createElement('div');
        formGroup.className = 'event-form-group';
        formGroup.innerHTML = `
            <div class="form-row">
                <div class="form-field">
                    <label for="event-date">Event Date</label>
                    <input type="date" id="event-date" class="form-input">
                </div>
                <div class="form-field">
                    <label for="event-title">Event Title</label>
                    <input type="text" id="event-title" class="form-input" placeholder="e.g. Brazilian Churrasco Night">
                </div>
            </div>
            <p class="form-hint">Images will be named automatically from the date and title above.</p>
        `;
        uploadSection.appendChild(formGroup);

        container.appendChild(uploadSection);

        const currentSection = document.createElement('div');
        currentSection.innerHTML = `<h3 class="section-subtitle">Current Events</h3>`;
        const currentGrid = document.createElement('div');
        currentGrid.className = 'events-grid';
        currentGrid.id = 'events-current-grid';
        currentSection.appendChild(currentGrid);
        container.appendChild(currentSection);

        loadEvents(currentGrid);
    }

    async function handleEventUpload(files) {
        const dateInput = document.getElementById('event-date');
        const titleInput = document.getElementById('event-title');

        const date = dateInput ? dateInput.value : '';
        const title = titleInput ? titleInput.value.trim() : '';

        if (!date || !title) {
            AdminUtils.showToast('Please set the event date and title before uploading images.', 'warning');
            return;
        }

        const slug = `${date}-${title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').trim()}`;

        for (const file of files) {
            try {
                let base64Content;
                if (AdminCompress.isImageFile(file)) {
                    const compressed = await AdminCompress.compressImage(file);
                    base64Content = await AdminCompress.blobToBase64(compressed.webp);
                } else {
                    base64Content = await AdminCompress.fileToBase64(file);
                }

                const ext = file.name.split('.').pop();
                const filename = `${slug}.${ext}`;
                const targetPath = `assets/events/${filename}`;

                AdminCommit.addChange(
                    targetPath,
                    `Add event: ${title}`,
                    async () => base64Content
                );

                AdminUtils.showToast(`Queued: ${filename}`, 'success');
            } catch (err) {
                AdminUtils.showToast(`Failed to process ${file.name}: ${err.message}`, 'error');
            }
        }
    }

    async function loadEvents(grid) {
        const events = await fetchEvents();
        grid.innerHTML = '';

        if (events.length === 0) {
            grid.innerHTML = '<p class="text-muted">No upcoming events. Upload event images to get started.</p>';
            return;
        }

        events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'event-card';
            card.innerHTML = `
                <div class="event-thumb">
                    <img src="https://raw.githubusercontent.com/${AdminUtils.REPO_OWNER}/${AdminUtils.REPO_NAME}/main/assets/events/${event.image}" alt="${event.title}" loading="lazy">
                </div>
                <div class="event-info">
                    <span class="event-date">${event.date}</span>
                    <span class="event-title">${event.title}</span>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    if (window.AdminDashboard) {
        window.AdminDashboard.registerSection('events', render);
    }

    window.AdminEvents = { render, fetchEvents };
})();
