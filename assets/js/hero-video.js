document.addEventListener('DOMContentLoaded', () => {
  const video = document.querySelector('.hero-video');
  if (!video) return;
  const poster = video.getAttribute('poster');
  const sources = video.querySelectorAll('source');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefersReducedData = window.matchMedia('(prefers-reduced-data: reduce)').matches || (navigator.connection && navigator.connection.saveData);

  let attemptPlay;
  let onVisibilityChange;

  const swapToImage = () => {
    const img = document.createElement('img');
    img.src = poster;
    img.alt = 'Boteco hero image';
    img.className = 'hero-video';
    video.replaceWith(img);
    video.removeEventListener('pause', attemptPlay);
    video.removeEventListener('ended', attemptPlay);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };

  if (prefersReducedMotion || prefersReducedData) {
    swapToImage();
    return;
  }

  attemptPlay = () => {
    video.play().catch(swapToImage);
  };

  onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      attemptPlay();
    }
  };

  const loadVideo = () => {
    sources.forEach(source => {
      source.src = source.dataset.src;
    });
    video.addEventListener('error', swapToImage, { once: true });
    video.load();
    attemptPlay();
    video.addEventListener('pause', attemptPlay);
    video.addEventListener('ended', attemptPlay);
    document.addEventListener('visibilitychange', onVisibilityChange);
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
