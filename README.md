# Boteco Website

This repository contains the static files for the Boteco restaurant website.

## Development Workflow

1. Install dependencies:

   ```bash
   npm install
   # for image conversion
   pip install pillow
   ```

2. Add or update assets as needed (see sections below for events, menus, images, and fonts).

3. Convert newly added images to WebP for faster loading:

   ```bash
   python3 scripts/convert_images_to_webp.py
   ```

   Use `--dry-run` to preview conversions.

4. Regenerate the events cache whenever event images change:

   ```bash
   python3 scripts/generate_events_json.py
   ```

5. Minify CSS and JavaScript for production:

   ```bash
   npm run build
   ```

6. Preview the site locally, for example:

   ```bash
   npx http-server .
   # or
   python3 -m http.server
   ```

7. Commit the resulting changes and deploy.

## Security

External CDN resources are loaded with [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) attributes to ensure the assets have not been tampered with. Event titles are inserted using the DOM API to prevent cross-site scripting.

## External Scripts

The Instagram feed uses a self-hosted copy of the LightWidget embed script (`assets/js/lightwidget.js`).
This file was downloaded from [https://cdn.lightwidget.com/widgets/lightwidget.js](https://cdn.lightwidget.com/widgets/lightwidget.js) on 2025-08-04.
Periodically check the upstream source for updates and replace the local file when necessary.
If reverting to the CDN-hosted script, include appropriate `integrity` and `crossorigin` attributes.

## Updating Events

Event cards on the homepage are built from images in `assets/events/`.
To avoid hitting GitHub API limits, a cached `events.json` file is also used.

1. **Add or remove event images** in `assets/events/` using the format
   `YYYY-MM-DD-Event-Name.jpg` (or `.png`, `.webp`).
2. Run `python3 scripts/generate_events_json.py` to rebuild
   `events.json` from those filenames. The generated file will contain an
   array of event objects like:

   ```json
   [
     {
       "date": "2025-08-08",
       "title": "Brazilian Churrasco Night",
       "image": "2025-08-08-Brazilian-Churrasco-Night.jpg"
     }
   ]
   ```

   - `date`: ISO `YYYY-MM-DD` format.
   - `title`: Display title for the card.
   - `image`: Filename relative to the `assets/events/` folder.

3. Commit the new image files and `events.json`. The website will load
   from `events.json` first and only fall back to the GitHub API if the
   file is missing or empty.

The `update-events` GitHub Actions workflow can regenerate `events.json`
automatically based on the filenames in `assets/events/` and commit any
changes.

When network errors or API limits occur, visitors will see a friendly
"No upcoming events" message instead of the section disappearing.

## Updating Menus

Each menu page (e.g. `food-menu.html`, `bar-menu.html`, `specials-menu.html`)
displays images stored in `assets/menus/` following the naming pattern
`<menu-name>-pg#.jpg` (for example, `food-menu-pg1.jpg`). All menu pages load
these images automatically, so simply add or remove files and they will appear
in their respective galleries.

## Image Optimization

Add images as `.jpg`, `.png`, or `.gif` and create faster-loading `.webp` copies with:

```bash
python3 scripts/convert_images_to_webp.py
```

Use `--dry-run` to preview conversions without writing files. A GitHub Action
will also run this script on pushes to ensure WebP versions are committed.

## Custom Fonts

Place your own font file(s) in `assets/fonts/` using the original file
name and extension of the downloaded font. For example,
`Fraunces-VariableFont_SOFT,WONK,opsz,wght.ttf`. Update the CSS
`@font-face` rule to reference this file. If the directory is empty the
site falls back to the Fraunces typeface served from Google Fonts.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
