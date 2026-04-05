# Design: Second Outlet & About Us GIF Update

## Overview

Update the Boteco website to reflect the opening of the second outlet (Bagmane Solarium City) and replace About Us slide 4 with a GIF animation.

## Changes

### 1. About Us Slide 4 - GIF

- Convert `assets/images/about/About_Us GIF.MP4` to `assets/images/about/about-us-tile4.gif` using ffmpeg
- Replace the existing `<picture>` element for tile 4 in `index.html` with a `<video>` element (autoplay, loop, muted, playsinline) for performance
- Keep the GIF as a `<noscript>` fallback and as a poster fallback for browsers that don't support video autoplay
- Maintain the same `.rounded` class and responsive sizing

### 2. Find Us - Second Outlet (Bagmane Solarium City)

Update `assets/js/outlets.js`:
- **Name:** `Boteco - Bagmane Solarium City, Brookefield` (remove "Coming Soon")
- **Address:**
  ```
  366, Dodda Nekkundi Extension,
  Brookefield, Bengaluru,
  Karnataka 560037, India
  ```
- **Map embed:** `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.994918520729!2d77.708105!3d12.9721766!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae13d4b3c4fc31%3A0x918315b068024f40!2sBoteco%20-%20Restaurante%20Brasileiro%20(Bagmane%20Solarium%20City%2C%20Brookefield)!5e0!3m2!1sen!2sin!4v1775379958876!5m2!1sen!2sin`
- Phone and hours remain unchanged

## Files Modified

- `index.html` - About Us tile 4: replace `<picture>` with `<video>` + GIF fallback
- `assets/js/outlets.js` - Update second outlet data

## Files Created

- `assets/images/about/about-us-tile4.gif` - Converted from MP4
