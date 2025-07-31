document.addEventListener('DOMContentLoaded', () => {
  const galleries = document.querySelectorAll('[data-menu-gallery]');
  galleries.forEach(async (wrapper) => {
    const menu = wrapper.dataset.menuGallery;
    const imgEl = wrapper.querySelector('.menu-image');
    const counterEl = wrapper.querySelector('.image-counter');
    const prevBtn = wrapper.querySelector('.prev-btn');
    const nextBtn = wrapper.querySelector('.next-btn');

    async function fetchImages() {
      const imgs = [];
      for (let i = 1; i <= 50; i++) {
        const url = `assets/menus/${menu}-pg${i}.jpg`;
        const exists = await new Promise(res => {
          const img = new Image();
          img.onload = () => res(true);
          img.onerror = () => res(false);
          img.src = url;
        });
        if (!exists) break;
        imgs.push(url);
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
        imgEl.src = cached.src;
        counterEl.textContent = `${index + 1} / ${images.length}`;
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === images.length - 1;
        requestAnimationFrame(() => { imgEl.style.opacity = 1; });
      };

      imgEl.style.opacity = 0;
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

    let touchStartX = null;
    wrapper.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
      }
    });

    wrapper.addEventListener('touchend', (e) => {
      if (touchStartX === null || e.changedTouches.length !== 1) return;
      const diff = e.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(diff) > 50) {
        if (diff < 0 && index < images.length - 1) {
          index++;
          update();
        } else if (diff > 0 && index > 0) {
          index--;
          update();
        }
      }
    });

    update();
  });
});
