document.addEventListener('DOMContentLoaded', async () => {
  let menuLists = {};
  try {
    const res = await fetch('assets/menus/menus.json');
    if (res.ok) {
      menuLists = await res.json();
    }
  } catch (e) {
    console.warn('Could not load menus.json', e);
  }

  const galleries = document.querySelectorAll('[data-menu-gallery]');
  galleries.forEach((wrapper) => {
    const menu = wrapper.dataset.menuGallery;
    const imgEl = wrapper.querySelector('.menu-image');
    const counterEl = wrapper.querySelector('.image-counter');
    const prevBtn = wrapper.querySelector('.prev-btn');
    const nextBtn = wrapper.querySelector('.next-btn');

    const images = menuLists[menu] ? menuLists[menu].map(name => `assets/menus/${name}`) : [];
    if (images.length === 0) {
      wrapper.innerHTML = `<p>No ${menu.replace('-', ' ')} images available.</p>`;
      return;
    }

    let index = 0;
    const update = () => {
      imgEl.src = images[index];
      counterEl.textContent = `${index + 1} / ${images.length}`;
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === images.length - 1;
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
