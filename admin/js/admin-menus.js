(function () {
    'use strict';

    const MENU_CONFIGS = {
        'food-menu': {
            label: 'Food Menu',
            jsonPath: 'assets/menus/food-menu.json',
            incomingPath: 'incoming/food-menu.pdf'
        },
        'bar-menu': {
            label: 'Bar Menu',
            jsonPath: 'assets/menus/bar-menu.json',
            incomingPath: 'incoming/bar-menu.pdf'
        },
        'specials-menu': {
            label: 'Specials Menu',
            jsonPath: 'assets/menus/specials-menu.json',
            incomingPath: 'incoming/specials-menu.pdf'
        }
    };

    async function fetchMenuPages(menuKey) {
        const config = MENU_CONFIGS[menuKey];
        if (!config) return [];

        try {
            const data = await AdminAuth.githubApi(`/contents/${config.jsonPath}`);
            return JSON.parse(decodeURIComponent(escape(atob(data.content))));
        } catch (err) {
            AdminUtils.showToast(`Failed to load ${config.label}: ${err.message}`, 'error');
            return [];
        }
    }

    function render(container, menuKey) {
        const config = MENU_CONFIGS[menuKey];
        if (!config) return;

        const uploadSection = document.createElement('div');
        uploadSection.className = 'menu-upload-section';

        const uploadZone = document.createElement('div');
        uploadZone.className = 'upload-zone menu-upload-zone';
        uploadZone.innerHTML = `
            <div class="upload-zone-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <p>Upload ${config.label} PDF</p>
                <p class="upload-hint">Drop PDF here or click to browse. Existing pages will be replaced.</p>
            </div>
            <input type="file" accept=".pdf" class="file-input" hidden>
        `;

        const fileInput = uploadZone.querySelector('.file-input');

        uploadZone.addEventListener('click', () => fileInput.click());
        uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
        uploadZone.addEventListener('dragleave', () => { uploadZone.classList.remove('drag-over'); });
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length) {
                handlePdfUpload(menuKey, e.dataTransfer.files[0], uploadZone);
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length) {
                handlePdfUpload(menuKey, fileInput.files[0], uploadZone);
            }
        });

        uploadSection.appendChild(uploadZone);
        container.appendChild(uploadSection);

        const pagesSection = document.createElement('div');
        pagesSection.className = 'menu-pages-section';
        pagesSection.innerHTML = `<h3 class="section-subtitle">Current Pages</h3>`;
        const pagesGrid = document.createElement('div');
        pagesGrid.className = 'menu-pages-grid';
        pagesGrid.id = `menu-pages-${menuKey}`;
        pagesSection.appendChild(pagesGrid);
        container.appendChild(pagesSection);

        loadMenuPages(menuKey, pagesGrid);
    }

    async function handlePdfUpload(menuKey, file, zone) {
        if (file.type !== 'application/pdf') {
            AdminUtils.showToast('Please upload a PDF file.', 'error');
            return;
        }

        AdminUtils.showToast(`Uploading ${file.name}... This may take a moment.`, 'info');

        try {
            const config = MENU_CONFIGS[menuKey];
            const base64Content = await AdminCompress.fileToBase64(file);

            AdminCommit.addChange(
                config.incomingPath,
                `Upload ${config.label} PDF`,
                async () => base64Content
            );

            zone.innerHTML = `
                <div class="upload-zone-content">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <p style="color: var(--success);">${file.name} queued for upload</p>
                    <p class="upload-hint">Commit changes to trigger PDF conversion pipeline</p>
                </div>
            `;
        } catch (err) {
            AdminUtils.showToast(`Upload failed: ${err.message}`, 'error');
        }
    }

    async function loadMenuPages(menuKey, grid) {
        const pages = await fetchMenuPages(menuKey);
        grid.innerHTML = '';

        if (pages.length === 0) {
            grid.innerHTML = '<p class="text-muted">No pages found. Upload a PDF to get started.</p>';
            return;
        }

        pages.forEach((page, index) => {
            const card = document.createElement('div');
            card.className = 'menu-page-card';
            card.innerHTML = `
                <div class="menu-page-thumb">
                    <img src="https://raw.githubusercontent.com/${AdminUtils.REPO_OWNER}/${AdminUtils.REPO_NAME}/main/${page.image}" alt="Page ${index + 1}" loading="lazy">
                </div>
                <div class="menu-page-info">
                    <span>Page ${index + 1}</span>
                    <span class="menu-page-filename">${page.image}</span>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    if (window.AdminDashboard) {
        window.AdminDashboard.registerSection('food-menu', (container) => render(container, 'food-menu'));
        window.AdminDashboard.registerSection('bar-menu', (container) => render(container, 'bar-menu'));
        window.AdminDashboard.registerSection('specials-menu', (container) => render(container, 'specials-menu'));
    }

    window.AdminMenus = { render, MENU_CONFIGS, fetchMenuPages };
})();
