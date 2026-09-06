/* Meta advertising: visits and reservation intent, not confirmed bookings. */
(function () {
  'use strict';

  if (window.botecoMetaTracking) return;
  window.botecoMetaTracking = true;

  const pixelId = '7009693355782863';
  if (!window.fbq) {
    const fbq = window.fbq = function () {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
      else fbq.queue.push(arguments);
    };
    if (!window._fbq) window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }

  window.fbq('init', pixelId);
  window.fbq('trackSingle', pixelId, 'PageView');

  document.addEventListener('click', function (event) {
    const target = event.target.closest && event.target.closest(
      '[data-bs-target="#reservationsModal"], a[href="https://tinyurl.com/26vp8xgh"]'
    );
    if (!target) return;
    window.fbq('trackSingleCustom', pixelId, 'ReservationClick');
  });
})();
