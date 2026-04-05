(function () {
    'use strict';

    const IMAGE_DIRS = [
        'assets/images/about',
        'assets/images/placeholders',
        'assets/images/logos',
        'assets/images/awards'
    ];

    async function listDirectory(path) {
        try {
            const data = await AdminAuth.githubApi(`/contents/${path}`);
            if (!Array.isArray(data)) return [];
            return data.filter(item => item.type === 'file' && /\.(jpg|jpeg|png|webp|gif|svg|mp4|webm)$/i.test(item.name));
        } catch (err) {
            return [];
        }
    }

    function render(container) {
        const dirSection = document.createElement('div');
        dirSection.className = 'images-dir-section';

        const select = document.createElement('select');
        select.id = 'image-dir-select';
        select.className = 'form-input';
        IMAGE_DIRS.forEach(dir => {
            const option = document.createElement('option');
            option.value = dir;
            option.textContent = dir;
            select.appendChild(option);
        });

        const uploadZone = document.createElement('div');
        uploadZone.className = 'upload-zone';
        uploadZone.innerHTML = `
            <div class="upload-zone-content">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p>Upload Images</p>
                <p class="upload-hint">Drop images here to add to the current directory</p>
            </div>
            <input type="file" accept="image/*" multiple class="file-input" hidden>
        `;

        const fileInput = uploadZone.querySelector('.file-input');

        const grid = document.createElement('div');
        grid.className = 'images-grid';
        grid.id = 'images-grid';

        select.addEventListener('change', () => loadDirectory(select.value, grid));

        uploadZone.addEventListener('click', () => fileInput.click());
        uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
        uploadZone.addEventListener('dragleave', () => { uploadZone.classList.remove('drag-over'); });
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length) {
                handleImageUpload(select.value, e.dataTransfer.files, grid);
            }
        });
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length) {
                handleImageUpload(select.value, fileInput.files, grid);
            }
        });

        dirSection.appendChild(select);
        container.appendChild(dirSection);
        container.appendChild(uploadZone);
        container.appendChild(grid);

        loadDirectory(IMAGE_DIRS[0], grid);
    }

    async function loadDirectory(path, grid) {
        if (!grid) return;
        grid.innerHTML = '<p class="text-muted">Loading...</p>';

        const files = await listDirectory(path);
        grid.innerHTML = '';

        if (files.length === 0) {
            grid.innerHTML = '<p class="text-muted">No images in this directory.</p>';
            return;
        }

        files.forEach(file => {
            const card = document.createElement('div');
            card.className = 'image-card';
            const isVideo = /\.(mp4|webm)$/i.test(file.name);
            card.innerHTML = `
                <div class="image-thumb">
                    ${isVideo
                        ? `<video src="https://raw.githubusercontent.com/${AdminUtils.REPO_OWNER}/${AdminUtils.REPO_NAME}/main/${file.path}" muted preload="metadata"></video>`
                        : `<img src="https://raw.githubusercontent.com/${AdminUtils.REPO_OWNER}/${AdminUtils.REPO_NAME}/main/${file.path}" alt="${file.name}" loading="lazy">`
                    }
                </div>
                <div class="image-info">
                    <span class="image-name" title="${file.name}">${file.name}</span>
                    <span class="image-size">${AdminCompress.formatBytes(file.size)}</span>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    async function handleImageUpload(dirPath, files, grid) {
        for (const file of files) {
            try {
                let base64Content;
                if (AdminCompress.isImageFile(file)) {
                    const compressed = await AdminCompress.compressImage(file);
                    base64Content = await AdminCompress.blobToBase64(compressed.webp);
                } else {
                    base64Content = await AdminCompress.fileToBase64(file);
                }

                const targetPath = `${dirPath}/${file.name}`;
                AdminCommit.addChange(
                    targetPath,
                    `Upload ${file.name}`,
                    async () => base64Content
                );

                AdminUtils.showToast(`Queued: ${file.name}`, 'success');
            } catch (err) {
                AdminUtils.showToast(`Failed: ${file.name}: ${err.message}`, 'error');
            }
        }

        loadDirectory(dirPath, grid);
    }

    if (window.AdminDashboard) {
        window.AdminDashboard.registerSection('images', render);
    }

    window.AdminImages = { render, listDirectory };
})();
