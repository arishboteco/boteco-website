// Dynamically load the LightWidget script when the Instagram section is near the viewport
// and provide a fallback link if the script fails to load.
document.addEventListener('DOMContentLoaded', function () {
  var section = document.getElementById('instagram');
  if (!section) return;

  function loadLightWidget() {
    var script = document.createElement('script');
    script.src = 'https://cdn.lightwidget.com/widgets/lightwidget.js';
    script.async = true;
    script.onerror = function () {
      var container = section.querySelector('.instagram-feed');
      if (container) {
        var link = document.createElement('a');
        link.href = 'https://www.instagram.com/botecobengaluru/';
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'View on Instagram';
        container.appendChild(link);
      }
    };
    document.body.appendChild(script);
    if (observer) observer.disconnect();
  }

  var observer;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          loadLightWidget();
        }
      });
    }, { rootMargin: '200px' });
    observer.observe(section);
  } else {
    loadLightWidget();
  }
});
