# Speed Optimization Tasks

This document consolidates performance improvements planned for the Boteco website.

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

