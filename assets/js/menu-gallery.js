document.addEventListener('DOMContentLoaded', () => {
  const galleries = document.querySelectorAll('[data-menu-gallery]');
  galleries.forEach(async (wrapper) => {
    const menu = wrapper.dataset.menuGallery;
    const imgEl = wrapper.querySelector('.menu-image');
    const pictureEl = imgEl.parentElement;
    const container = pictureEl.parentElement;
    const overlayPicture = pictureEl.cloneNode(true);
    const overlayImg = overlayPicture.querySelector('img');
    overlayPicture.style.position = 'absolute';
    overlayPicture.style.inset = '0';
    overlayPicture.style.opacity = 0;
    overlayPicture.style.pointerEvents = 'none';
    imgEl.style.pointerEvents = 'none';
    container.style.position = 'relative';
    container.appendChild(overlayPicture);
    let activePicture = pictureEl;
    let activeImg = imgEl;
    let hiddenPicture = overlayPicture;
    let hiddenImg = overlayImg;
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
        const webpSrc = cached.src.replace('.jpg', '.webp');
        hiddenPicture.querySelector('source').srcset = webpSrc;
        hiddenImg.src = cached.src;
        counterEl.textContent = `${index + 1} / ${images.length}`;
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === images.length - 1;
        requestAnimationFrame(() => {
          activePicture.style.opacity = 0;
          hiddenPicture.style.opacity = 1;
        });
        let tmpPicture = activePicture;
        activePicture = hiddenPicture;
        hiddenPicture = tmpPicture;
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
