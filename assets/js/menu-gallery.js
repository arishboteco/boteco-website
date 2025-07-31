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
        try {
          const res = await fetch(url, { method: 'HEAD' });
          if (!res.ok) break;
          imgs.push(url);
        } catch (e) {
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

    update();
  });
});
