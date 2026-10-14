(function() {
    const defaultTiles = [
        { "num": 1, "type": "image" },
        { "num": 2, "type": "image" },
        { "num": 3, "type": "image" },
        { "num": 4, "type": "video", "ext": "mp4" },
        { "num": 5, "type": "video", "ext": "mp4" },
        { "num": 6, "type": "image" }
    ];
    
    function renderTiles(tiles) {
        const grid = document.getElementById('about-images-grid');
        if (!grid) return;
        tiles.forEach(tile => {
            const container = document.createElement('div');
            const basePath = 'assets/images/about/about-us-tile' + tile.num;
            const webpPath = basePath + '.webp?v=20261014-perf1';
            if (tile.type === 'video') {
                const videoSrc = tile.url || ('assets/videos/optimized/about-tile' + tile.num + '.mp4');
                container.innerHTML = 
                    '<video data-lazy-video loop muted playsinline preload="none" class="rounded" width="1080" height="1080" poster="' + webpPath + '" aria-label="Boteco restaurant video ' + tile.num + '">' +
                        '<source data-src="' + videoSrc + '" type="video/mp4">' +
                        '<img loading="lazy" src="' + webpPath + '" alt="Boteco interior ' + tile.num + '" class="rounded" width="1080" height="1080">' +
                    '</video>';
            } else {
                container.innerHTML = 
                    '<picture>' +
                        '<source srcset="' + webpPath + '" type="image/webp">' +
                        '<img loading="lazy" src="' + basePath + '.jpg" alt="Boteco interior image ' + tile.num + '" class="rounded" width="1080" height="1080">' +
                    '</picture>';
            }
            grid.appendChild(container);
        });
        if (document.dispatchEvent) document.dispatchEvent(new Event('boteco:media-added'));
    }
    
    fetch('assets/data/about-tiles.json')
        .then(r => r.json())
        .then(renderTiles)
        .catch(() => renderTiles(defaultTiles));
})();
