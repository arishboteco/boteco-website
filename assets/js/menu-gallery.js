const manifestCache = new Map();

document.addEventListener('DOMContentLoaded', () => {
  const galleries = document.querySelectorAll('[data-menu-gallery]');
  galleries.forEach(async (wrapper) => {
    const menu = wrapper.dataset.menuGallery;
    const manifest = wrapper.dataset.menuManifest || `assets/menus/${menu}.json`;
    const imgEl = wrapper.querySelector('.menu-image');
    const container = imgEl.parentElement;
    const overlay = imgEl.cloneNode();
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.opacity = 0;
    overlay.style.pointerEvents = 'none';
    imgEl.style.pointerEvents = 'none';
    container.style.position = 'relative';
    container.appendChild(overlay);
    let activeImg = imgEl;
    let hiddenImg = overlay;
    const counterEl = wrapper.querySelector('.image-counter');
    const prevBtn = wrapper.querySelector('.prev-btn');
    const nextBtn = wrapper.querySelector('.next-btn');

    async function fetchImages() {
      if (!manifestCache.has(manifest)) {
        const promise = (async () => {
          try {
            const res = await fetch(manifest);
            if (!res.ok) throw new Error('Manifest not found');
            const files = await res.json();
            const base = manifest.replace(/[^/]+$/, '');
            return Array.isArray(files) ? files.map(name => `${base}${name}`) : [];
          } catch {
            return [];
          }
        })();
        manifestCache.set(manifest, promise);
        const images = await promise;
        manifestCache.set(manifest, images);
        return images;
      }
      return manifestCache.get(manifest);
    }

    const images = await fetchImages();
    if (images.length === 0) {
      wrapper.innerHTML = `<p>No ${menu.replace('-', ' ')} images available.</p>`;
      return;
    }

    const cache = images.map(src => {
      const img = new Image();
      img.src = src;
      return img;
    });

    let index = 0;
    const update = () => {
      const cached = cache[index];
      const show = () => {
        hiddenImg.src = cached.src;
        counterEl.textContent = `${index + 1} / ${images.length}`;
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === images.length - 1;
        requestAnimationFrame(() => {
          activeImg.style.opacity = 0;
          hiddenImg.style.opacity = 1;
        });
        const tmp = activeImg;
        activeImg = hiddenImg;
        hiddenImg = tmp;
      };

      if (cached.complete) {
        show();
      } else {
        cached.addEventListener('load', show, { once: true });
      }
    };

    prevBtn.addEventListener('click', () => {
      if (index > 0) {
        index--;
        update();
      }
    });

    nextBtn.addEventListener('click', () => {
      if (index < images.length - 1) {
        index++;
        update();
      }
    });

    let startX = null;
    wrapper.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
    });

    wrapper.addEventListener('pointermove', (e) => {
      if (startX === null) return;
      const diff = e.clientX - startX;
      if (diff > 50 && index > 0) {
        index--;
        startX = e.clientX;
        update();
      } else if (diff < -50 && index < images.length - 1) {
        index++;
        startX = e.clientX;
        update();
      }
    });

    wrapper.addEventListener('pointerup', () => { startX = null; });
    wrapper.addEventListener('pointercancel', () => { startX = null; });

    update();
  });
});
