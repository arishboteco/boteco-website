document.addEventListener('DOMContentLoaded', () => {
  const galleries = document.querySelectorAll('[data-menu-gallery]');
  galleries.forEach(async (wrapper) => {
    const menu = wrapper.dataset.menuGallery;
    const imgEl = wrapper.querySelector('.menu-image');
    const pictureEl = imgEl.closest('picture');
    const container = pictureEl ? pictureEl.parentElement : imgEl.parentElement;
    const overlay = pictureEl ? pictureEl.cloneNode(true) : imgEl.cloneNode();
    overlay.style.position = 'absolute';
    overlay.style.inset = '0';
    overlay.style.opacity = 0;
    overlay.style.pointerEvents = 'none';
    (pictureEl || imgEl).style.pointerEvents = 'none';
    container.style.position = 'relative';
    container.appendChild(overlay);
    let activeImg = pictureEl || imgEl;
    let hiddenImg = overlay;
    const counterEl = wrapper.querySelector('.image-counter');
    const prevBtn = wrapper.querySelector('.prev-btn');
    const nextBtn = wrapper.querySelector('.next-btn');

    async function fetchImages() {
      const checks = Array.from({ length: 50 }, (_, i) => {
        const url = `assets/menus/${menu}-pg${i + 1}.jpg`;
        return new Promise(resolve => {
          const img = new Image();
          img.onload = () => resolve({ url, index: i });
          img.onerror = () => resolve({ url: null, index: i });
          img.src = url;
        });
      });

      const results = await Promise.all(checks);
      const imgs = [];
      for (const res of results) {
        if (res.url) {
          imgs.push(res.url);
        } else {
          break;
        }
      }
      return imgs;
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
        if (pictureEl) {
          const hiddenSource = hiddenImg.querySelector('source');
          const hiddenImage = hiddenImg.querySelector('img');
          hiddenSource.srcset = cached.src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
          hiddenImage.src = cached.src;
        } else {
          hiddenImg.src = cached.src;
        }
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
