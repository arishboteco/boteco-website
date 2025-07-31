document.addEventListener('DOMContentLoaded', () => {
  const carousels = document.querySelectorAll('.modal .carousel');
  carousels.forEach(carouselEl => {
    const instance = bootstrap.Carousel.getOrCreateInstance(carouselEl);
    const items = carouselEl.querySelectorAll('.carousel-item');
    const total = items.length;
    const modal = carouselEl.closest('.modal');
    const counterEl = modal.querySelector('.image-counter');
    const prevBtn = modal.querySelector('.prev-btn');
    const nextBtn = modal.querySelector('.next-btn');

    function update(index) {
      if (counterEl) {
        counterEl.textContent = `${index + 1} / ${total}`;
      }
    }

    const active = Array.from(items).indexOf(carouselEl.querySelector('.carousel-item.active'));
    update(active >= 0 ? active : 0);

    carouselEl.addEventListener('slid.bs.carousel', e => {
      const idx = typeof e.to === 'number' ? e.to : Array.from(items).indexOf(carouselEl.querySelector('.carousel-item.active'));
      update(idx >= 0 ? idx : 0);
    });

    if (prevBtn) prevBtn.addEventListener('click', () => instance.prev());
    if (nextBtn) nextBtn.addEventListener('click', () => instance.next());
  });
});
