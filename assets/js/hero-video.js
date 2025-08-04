document.addEventListener('DOMContentLoaded', () => {
  const video = document.querySelector('.hero-video');
  if (!video) return;
  const poster = video.getAttribute('poster');
  const sources = video.querySelectorAll('source');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefersReducedData = window.matchMedia('(prefers-reduced-data: reduce)').matches || (navigator.connection && navigator.connection.saveData);

  const swapToImage = () => {
    const img = document.createElement('img');
    img.src = poster;
    img.alt = 'Boteco hero image';
    img.className = 'hero-video';
    video.replaceWith(img);
  };

  if (prefersReducedMotion || prefersReducedData) {
    swapToImage();
    return;
  }

  const loadVideo = () => {
    sources.forEach(source => {
      source.src = source.dataset.src;
    });
    video.addEventListener('error', swapToImage, { once: true });
    video.load();
    video.play().catch(() => {});
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadVideo();
          obs.disconnect();
        }
      });
    });
    observer.observe(video);
  } else {
    loadVideo();
  }
});
