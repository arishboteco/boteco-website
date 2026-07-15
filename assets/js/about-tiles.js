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
            if (tile.type === 'video') {
                const videoSrc = tile.url || (basePath + '.' + tile.ext);
                container.innerHTML = 
                    '<video autoplay loop muted playsinline class="rounded" width="1080" height="1080" poster="' + basePath + '.jpg">' +
                        '<source src="' + videoSrc + '" type="video/' + tile.ext + '">' +
                        '<img loading="lazy" src="' + basePath + '.gif" alt="Boteco interior animation ' + tile.num + '" class="rounded" width="1080" height="1080">' +
                    '</video>';
            } else {
                container.innerHTML = 
                    '<picture>' +
                        '<source srcset="' + basePath + '.webp" type="image/webp">' +
                        '<img loading="lazy" src="' + basePath + '.jpg" alt="Boteco interior image ' + tile.num + '" class="rounded" width="1080" height="1080">' +
                    '</picture>';
            }
            grid.appendChild(container);
        });
    }
    
    fetch('assets/data/about-tiles.json')
        .then(r => r.json())
        .then(renderTiles)
        .catch(() => renderTiles(defaultTiles));
})();
