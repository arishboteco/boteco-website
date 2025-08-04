document.addEventListener('DOMContentLoaded', function () {
  var sections = document.querySelectorAll('.fade-in-section');
  if (sections.length === 0) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    sections.forEach(function (sec) {
      sec.classList.add('visible');
    });
    return;
  }

  var observer = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  sections.forEach(function (sec) { observer.observe(sec); });
});
