document.addEventListener('DOMContentLoaded', () => {
  const images = Array.from(document.querySelectorAll('.menus-section .menu-card img'));
  if (images.length === 0) return;

  let loaded = 0;
  let minHeight = Infinity;

  function checkDone() {
    if (loaded !== images.length) return;
    if (!isFinite(minHeight)) return;
    images.forEach(img => {
      img.style.height = `${minHeight}px`;
      img.style.objectFit = 'contain';
    });
  }

  images.forEach(img => {
    const applyHeight = () => {
      // Use the rendered height after layout so all cards scale
      // relative to their displayed size rather than the image's
      // intrinsic dimensions. Fallback to naturalHeight if the
      // element isn't rendered yet.
      const rendered = img.clientHeight || img.naturalHeight;
      if (rendered > 0) {
        minHeight = Math.min(minHeight, rendered);
      }
      loaded++;
      checkDone();
    };

    if (img.complete) {
      applyHeight();
    } else {
      img.addEventListener('load', applyHeight);
      img.addEventListener('error', applyHeight);
    }
  });
});
