# Speed Optimization Tasks

This document consolidates performance improvements planned for the Boteco website.

## Homepage improvements, 14 October 2026

- Optimized the hero, three gallery videos, and the specials animation from
  178,604,326 to 11,737,046 bytes in total (93.4% smaller). These are file-size
  measurements, not a measured improvement in page-load time.
- Replaced the specials GIF with a video and still poster. Gallery videos load
  only in view, pause out of view, and stay as stills for reduced-motion/data users.
- Preloaded the hero poster and delayed the hero video until after page load.
- Resized oversized gallery images; the three changed WebP files total 479,116
  bytes, down from 4,037,122 (88.1% smaller).
- Booking and enquiry forms load only when their modal opens. Instagram loads
  near the viewport. The logo loads immediately; gallery scripts are deferred.
- Excluded video/audio streams and byte-range requests from service-worker
  caching, and advanced the cache version so existing visitors receive the change.
- Fixed events loading to parse each JSON response once.
- Rebuilt the changed minified scripts, gzip copies, and precache manifest.

To regenerate homepage media after changing the originals, install
`requirements.txt` and run `python scripts/optimize_home_media.py`, then rebuild
the site. Run `npm test` to check loading behavior and lint.

Browser timing and visual verification still need to be performed; browser
automation and local HTTP access were unavailable in this session.

1. **Refactor menu gallery to load images in parallel**
   - Implemented in `assets/js/menu-gallery.js` using `Promise.all` to check pages concurrently.
2. **Minified asset pipeline**
   - Add `npm` scripts to generate minified JS and CSS files for production.
3. **Serve WebP images with fallbacks**
   - Convert existing JPEG/PNG images to WebP and use `<picture>` or `srcset` for browsers that support it.
4. **Optimize font delivery**
   - Added preconnect hints for Google Fonts in all HTML files.
   - Optionally self-host fonts under `assets/fonts/`.
5. **Introduce Service Worker**
   - Create a Service Worker that caches static assets for offline support and faster loads.
6. **Reduce scroll event usage**
   - Navbar visibility now relies on `IntersectionObserver` instead of frequent scroll events.

