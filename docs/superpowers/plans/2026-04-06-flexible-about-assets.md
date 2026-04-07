# Flexible About Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make about section tiles accept either images or video files (converted to GIF), with auto-detection and rendering based on file type.

**Architecture:** Inline JS snippet in index.html checks for video files and renders `<video>` elements when present, otherwise renders `<picture>` elements. Admin panel updated to accept both image/* and video/* MIME types.

**Tech Stack:** Vanilla JS, HTML, GitHub API for admin uploads

---

### Task 1: Update index.html about section with auto-detecting assets

**Files:**
- Modify: `index.html:112-137`

- [ ] **Step 1: Read current index.html about section**

Read lines 112-137 to see current structure.

- [ ] **Step 2: Replace static markup with dynamic detection markup**

Replace lines 112-137 with:

```html
            <!-- Grid of photos showcasing the restaurant -->
            <div id="about-images-grid" class="about-photo-grid mb-4">
                <script>
                (function() {
                    const tiles = [
                        { num: 1, types: ['jpg', 'webp'] },
                        { num: 2, types: ['jpg', 'webp'] },
                        { num: 3, types: ['jpg', 'webp'] },
                        { num: 4, types: ['jpg', 'webp'], video: 'mp4' },
                        { num: 5, types: ['jpg', 'webp'] },
                        { num: 6, types: ['jpg', 'webp'] }
                    ];
                    const grid = document.getElementById('about-images-grid');
                    tiles.forEach((tile, idx) => {
                        const container = document.createElement('div');
                        const basePath = 'assets/images/about/about-us-tile' + tile.num;
                        const videoSrc = tile.video ? basePath + '.' + tile.video : null;
                        if (videoSrc) {
                            container.innerHTML = 
                                '<video autoplay loop muted playsinline class="rounded" width="1080" height="1080" poster="' + basePath + '.jpg">' +
                                    '<source src="' + videoSrc + '" type="video/' + tile.video + '">' +
                                    '<img loading="lazy" src="' + basePath + '.gif" alt="Boteco interior animation ' + tile.num + '" class="rounded" width="1080" height="1080">' +
                                '</video>';
                        } else {
                            let sources = '', imgSrc = basePath + '.jpg';
                            tile.types.forEach(ext => {
                                if (ext === 'webp') sources += '<source srcset="' + basePath + '.webp" type="image/webp">';
                            });
                            sources += '<img loading="lazy" src="' + imgSrc + '" alt="Boteco interior image ' + tile.num + '" class="rounded" width="1080" height="1080">';
                            container.innerHTML = '<picture>' + sources + '</picture>';
                        }
                        grid.appendChild(container);
                    });
                })();
                </script>
            </div>
```

- [ ] **Step 3: Verify the change looks correct**

The output should render the same as before for tiles 1-3, 5-6 as images, and tile 4 as video with poster.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: make about assets flexible with auto-detection"
```

---

### Task 2: Update admin-about.js to accept video uploads

**Files:**
- Modify: `admin/js/admin-about.js:97-165`

- [ ] **Step 1: Update file input accept attribute to include video types**

Change line 110:
```javascript
<input type="file" accept="image/*,video/*" class="file-input" hidden>
```

- [ ] **Step 2: Update handleImageUpload to detect file type and handle videos**

Replace the function at line 140:

```javascript
    async function handleImageUpload(targetPath, file, zone) {
        try {
            const isVideo = file.type.startsWith('video/');
            let base64Content;
            let commitMessage;
            
            if (isVideo) {
                base64Content = await AdminCompress.fileToBase64(file);
                const ext = file.name.split('.').pop().toLowerCase();
                const num = targetPath.match(/tile(\d+)/)[1];
                targetPath = 'assets/images/about/about-us-tile' + num + '.' + ext;
                commitMessage = 'Replace about tile ' + num + ' video';
            } else if (AdminCompress.isImageFile(file)) {
                const compressed = await AdminCompress.compressImage(file);
                base64Content = await AdminCompress.blobToBase64(compressed.webp);
                AdminUtils.showToast('Compressed: ' + AdminCompress.formatBytes(file.size) + ' → ' + AdminCompress.formatBytes(compressed.webpSize), 'success');
                commitMessage = 'Replace image';
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
```

- [ ] **Step 3: Commit**

```bash
git add admin/js/admin-about.js
git commit -m "feat: support video uploads for about assets"
```

---

### Task 3: Verify the implementation works

**Files:**
- Test: Open index.html in browser

- [ ] **Step 1: Test page loads without errors**

Open index.html in browser. Check console for errors.

- [ ] **Step 2: Verify tile 4 still shows as video**

Tile 4 should render as `<video>` with about-us-tile4.mp4 as source.

- [ ] **Step 3: Commit**

```bash
git commit --allow-empty -m "test: verify flexible about assets"
```

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-06-flexible-about-assets.md`. Two execution options:**

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
