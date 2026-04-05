(function () {
    'use strict';

    const HERO_FILES = [
        { path: 'assets/videos/hero/hero.mp4', label: 'Hero Video (MP4)' },
        { path: 'assets/videos/hero/hero-video.webm', label: 'Hero Video (WebM)' },
        { path: 'assets/images/hero.jpg', label: 'Hero Poster Image' }
    ];

    function render(container) {
        HERO_FILES.forEach(fileInfo => {
            const zone = document.createElement('div');
            zone.className = 'upload-zone';
            zone.dataset.file = fileInfo.path;

            zone.innerHTML = `
                <div class="upload-zone-content">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                    <p>${fileInfo.label}</p>
                    <p class="upload-hint">Drop file here or click to browse</p>
                </div>
                <input type="file" class="file-input" hidden>
            `;

            const fileInput = zone.querySelector('.file-input');
            const acceptType = fileInfo.path.endsWith('.mp4') ? 'video/mp4' :
                               fileInfo.path.endsWith('.webm') ? 'video/webm' : 'image/*';
            fileInput.accept = acceptType;

            zone.addEventListener('click', () => fileInput.click());
            zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
            zone.addEventListener('dragleave', () => { zone.classList.remove('drag-over'); });
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                if (e.dataTransfer.files.length) {
                    handleHeroUpload(fileInfo.path, e.dataTransfer.files[0], zone);
                }
            });

            fileInput.addEventListener('change', () => {
                if (fileInput.files.length) {
                    handleHeroUpload(fileInfo.path, fileInput.files[0], zone);
                }
            });

            container.appendChild(zone);
        });
    }

    async function handleHeroUpload(targetPath, file, zone) {
        try {
            let base64Content;

            if (AdminCompress.isImageFile(file)) {
                const compressed = await AdminCompress.compressImage(file);
                base64Content = await AdminCompress.blobToBase64(compressed.webp);
                AdminUtils.showToast(`Compressed: ${AdminCompress.formatBytes(file.size)} → ${AdminCompress.formatBytes(compressed.webpSize)}`, 'success');
            } else {
                if (file.size > 100 * 1024 * 1024) {
                    AdminUtils.showToast('Warning: Video files over 100MB may fail to commit via GitHub API. Consider compressing first.', 'warning');
                }
                base64Content = await AdminCompress.fileToBase64(file);
            }

            AdminCommit.addChange(
                targetPath,
                `Replace ${zone.querySelector('p').textContent}`,
                async () => base64Content
            );

            const preview = document.createElement(file.type.startsWith('video') ? 'video' : 'img');
            preview.className = 'upload-preview';
            preview.src = URL.createObjectURL(file);
            if (file.type.startsWith('video')) {
                preview.muted = true;
                preview.controls = true;
            }
            zone.appendChild(preview);
        } catch (err) {
            AdminUtils.showToast(`Upload failed: ${err.message}`, 'error');
        }
    }

    if (window.AdminDashboard) {
        window.AdminDashboard.registerSection('hero', render);
    }

    window.AdminHero = { render, HERO_FILES };
})();
