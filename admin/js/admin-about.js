(function () {
    'use strict';

    const ABOUT_BLOCKS = [
        { key: 'our-story', label: 'Our Story: Where It All Began' },
        { key: 'experience', label: 'The Boteco Experience' },
        { key: 'chef', label: 'Meet the Chef Behind the Magic' },
        { key: 'menu-desc', label: 'Our Menu: A Taste of Brazil' }
    ];

    const ABOUT_IMAGES = [
        { file: 'assets/images/about/about-us-tile1.jpg', label: 'About Image 1' },
        { file: 'assets/images/about/about-us-tile2.jpg', label: 'About Image 2' },
        { file: 'assets/images/about/about-us-tile3.jpg', label: 'About Image 3' },
        { file: 'assets/images/about/about-us-tile4.jpg', label: 'About Image 4 (GIF poster)' },
        { file: 'assets/images/about/about-us-tile5.jpg', label: 'About Image 5' },
        { file: 'assets/images/about/about-us-tile6.jpg', label: 'About Image 6' }
    ];

    async function fetchAboutText() {
        try {
            const data = await AdminAuth.githubApi('/contents/index.html');
            return decodeURIComponent(escape(atob(data.content)));
        } catch (err) {
            AdminUtils.showToast(`Failed to load index.html: ${err.message}`, 'error');
            return '';
        }
    }

    function extractTextBlock(html, blockKey) {
        const block = ABOUT_BLOCKS.find(b => b.key === blockKey);
        if (!block) return '';

        const labelRegex = new RegExp(`<p class="h5 mb-2">${block.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</p>\\s*<p class="small mb-0">(.*?)</p>`, 's');
        const match = html.match(labelRegex);
        return match ? match[1] : '';
    }

    function render(container) {
        const textSection = document.createElement('div');
        textSection.className = 'about-text-section';

        const sectionLabel = document.createElement('h3');
        sectionLabel.className = 'section-subtitle';
        sectionLabel.textContent = 'About Text';
        textSection.appendChild(sectionLabel);

        ABOUT_BLOCKS.forEach(block => {
            const group = document.createElement('div');
            group.className = 'form-group';

            const label = document.createElement('label');
            label.textContent = block.label;
            label.setAttribute('for', `about-${block.key}`);

            const textarea = document.createElement('textarea');
            textarea.id = `about-${block.key}`;
            textarea.className = 'form-textarea';
            textarea.rows = 6;
            textarea.maxLength = 10000;
            textarea.placeholder = 'Loading...';

            textarea.addEventListener('input', () => {
                const newText = textarea.value;
                AdminCommit.addChange(
                    'index.html',
                    `Update "${block.label}" text`,
                    async () => generateUpdatedHtml(block, newText)
                );
            });

            group.appendChild(label);
            group.appendChild(textarea);
            textSection.appendChild(group);
        });

        container.appendChild(textSection);

        const imageSection = document.createElement('div');
        imageSection.className = 'about-images-section';

        const imageLabel = document.createElement('h3');
        imageLabel.className = 'section-subtitle';
        imageLabel.textContent = 'About Images';
        imageSection.appendChild(imageLabel);

        ABOUT_IMAGES.forEach(imgInfo => {
            const uploadZone = createUploadZone(imgInfo);
            imageSection.appendChild(uploadZone);
        });

        container.appendChild(imageSection);

        loadAboutText(container);
    }

    function createUploadZone(imgInfo) {
        const zone = document.createElement('div');
        zone.className = 'upload-zone';
        zone.dataset.file = imgInfo.file;

        zone.innerHTML = `
            <div class="upload-zone-content">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p>${imgInfo.label}</p>
                <p class="upload-hint">Drop image or video here or click to browse</p>
            </div>
            <input type="file" accept="image/*,video/*" class="file-input" hidden>
        `;

        const fileInput = zone.querySelector('.file-input');

        zone.addEventListener('click', () => fileInput.click());
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            if (e.dataTransfer.files.length) {
                handleImageUpload(imgInfo.file, e.dataTransfer.files[0], zone);
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length) {
                handleImageUpload(imgInfo.file, fileInput.files[0], zone);
            }
        });

        return zone;
    }

    async function updateTilesConfig(tileNum, type, ext) {
        try {
            const data = await AdminAuth.githubApi('/contents/assets/data/about-tiles.json');
            const config = JSON.parse(atob(data.content));
            const tile = config.find(t => t.num === tileNum);
            if (tile) {
                tile.type = type;
                if (ext) tile.ext = ext;
                else delete tile.ext;
            }
            return { sha: data.sha, content: JSON.stringify(config, null, 2) };
        } catch (err) {
            console.error('Failed to update tiles config:', err);
            return null;
        }
    }

    async function handleImageUpload(targetPath, file, zone) {
        try {
            const isVideo = file.type.startsWith('video/');
            let base64Content;
            let commitMessage;
            
            if (isVideo) {
                base64Content = await AdminCompress.fileToBase64(file);
                const ext = file.name.split('.').pop().toLowerCase();
                const num = parseInt(targetPath.match(/tile(\d+)/)[1]);
                targetPath = 'assets/images/about/about-us-tile' + num + '.' + ext;
                commitMessage = 'Replace about tile ' + num + ' video';
                
                const configUpdate = await updateTilesConfig(num, 'video', ext);
                if (configUpdate) {
                    AdminCommit.addChange(
                        'assets/data/about-tiles.json',
                        'Update tiles config',
                        async () => configUpdate.content
                    );
                }
            } else if (AdminCompress.isImageFile(file)) {
                const compressed = await AdminCompress.compressImage(file);
                base64Content = await AdminCompress.blobToBase64(compressed.webp);
                AdminUtils.showToast('Compressed: ' + AdminCompress.formatBytes(file.size) + ' → ' + AdminCompress.formatBytes(compressed.webpSize), 'success');
                commitMessage = 'Replace image';
                
                const num = parseInt(targetPath.match(/tile(\d+)/)[1]);
                const configUpdate = await updateTilesConfig(num, 'image');
                if (configUpdate) {
                    AdminCommit.addChange(
                        'assets/data/about-tiles.json',
                        'Update tiles config',
                        async () => configUpdate.content
                    );
                }
            } else {
                base64Content = await AdminCompress.fileToBase64(file);
                commitMessage = 'Replace file';
            }

            AdminCommit.addChange(
                targetPath,
                commitMessage,
                async () => base64Content
            );

            const preview = document.createElement(isVideo ? 'video' : 'img');
            preview.className = 'upload-preview';
            preview.src = URL.createObjectURL(file);
            preview.autoplay = true;
            preview.loop = true;
            preview.muted = true;
            preview.playsInline = true;
            zone.appendChild(preview);
        } catch (err) {
            AdminUtils.showToast('Upload failed: ' + err.message, 'error');
        }
    }

    async function generateUpdatedHtml(block, newText) {
        const currentHtml = await fetchAboutText();
        const labelRegex = new RegExp(`(<p class="h5 mb-2">${block.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</p>\\s*<p class="small mb-0">)(.*?)(</p>)`, 's');
        return currentHtml.replace(labelRegex, `$1${newText}$3`);
    }

    async function loadAboutText(container) {
        const html = await fetchAboutText();
        if (!html) return;

        ABOUT_BLOCKS.forEach(block => {
            const textarea = document.getElementById(`about-${block.key}`);
            if (textarea) {
                const text = extractTextBlock(html, block.key);
                textarea.value = text;
                textarea.placeholder = '';
            }
        });
    }

    if (window.AdminDashboard) {
        window.AdminDashboard.registerSection('about', render);
    }

    window.AdminAbout = { render, ABOUT_BLOCKS, ABOUT_IMAGES };
})();
