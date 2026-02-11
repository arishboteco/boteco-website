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

4. Rebuild menu manifests if you added or removed menu images:

   ```bash
   python3 scripts/generate_menu_manifest.py
   # or
   npm run generate:menus
   ```

   This step is also run automatically during the build.

5. Build the site (regenerates event caches and minifies assets):

   ```bash
   npm run build
   ```

6. Preview the site locally, for example:

   ```bash
   npx http-server .
   # or
   python3 -m http.server
   ```

7. (Optional) Lint and run tests before committing:

   ```bash
   npm run lint
   # or
   npm test   # runs the lint task
   ```

   Linting checks HTML and JavaScript. `npm test` currently runs the lint task and can be expanded with additional tests later.

8. Commit the resulting changes and deploy.

## Deployment

Pushing to the `main` branch triggers a GitHub Actions workflow that installs dependencies, builds the site, and publishes the result to GitHub Pages. For manual deployments, run `npm run build` before pushing so the published files are up to date.

## Security

External CDN resources are loaded with [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) attributes to ensure the assets have not been tampered with. Event titles are inserted using the DOM API to prevent cross-site scripting.

## External Scripts

The Instagram feed uses a self-hosted copy of the LightWidget embed script (`assets/js/lightwidget.js`).
This file was downloaded from [https://cdn.lightwidget.com/widgets/lightwidget.js](https://cdn.lightwidget.com/widgets/lightwidget.js) on 2025-08-04.
Periodically check the upstream source for updates and replace the local file when necessary.
If reverting to the CDN-hosted script, include appropriate `integrity` and `crossorigin` attributes.

## Updating Events

Event cards on the homepage are built from images in `assets/events/`.
A cached `events.json` file, generated from the image filenames, is used so
the site can display events without making GitHub API requests.

1. **Add or remove event images** in `assets/events/` using the format
   `YYYY-MM-DD-Event-Name.jpg` (or `.png`, `.webp`).
2. Run `python3 scripts/generate_events_json.py` (or `npm run build`) to
   rebuild `events.json` from those filenames. The generated file will
   contain an array of event objects like:

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

3. Commit the new image files and `events.json`. The website loads events
   directly from this file; if it is missing or empty a friendly
   "No upcoming events" message is shown.

The `update-events` GitHub Actions workflow can regenerate `events.json`
automatically based on the filenames in `assets/events/` and commit any
changes.

If the cache cannot be loaded, visitors will see a friendly "No upcoming
events" message instead of the section disappearing.

## Updating Menus

Each menu page (e.g. `food-menu.html`, `bar-menu.html`, `specials-menu.html`)
displays images stored in `assets/menus/` following the naming pattern
`<menu-name>-pg#.jpg` (for example, `food-menu-pg1.jpg`). All menu pages load
these images automatically, so simply add or remove files and they will appear
in their respective galleries.

After changing menu images, regenerate the JSON manifests so pages know which
files to load:

```bash
python3 scripts/generate_menu_manifest.py
# or
npm run generate:menus
```

This command is also executed as part of `npm run build`.

### Update a menu directly from a PDF (recommended)

### Automatic mode (no command needed after upload)

If you upload a PDF to `incoming/` and push to GitHub, the workflow
`Update menus from uploaded PDFs` runs automatically.

- Trigger folder: `incoming/` (PDF files only).
- Example filenames:
  - `incoming/food-menu.pdf`
  - `incoming/bar-menu.pdf`
  - `incoming/specials-menu.pdf`
- The workflow converts the PDF pages into `assets/menus/` images and updates
  the related manifest JSON automatically.

How menu type is chosen in automatic mode:

- The PDF filename decides the menu target.
- `food-menu.pdf` updates `food-menu` pages.
- `bar-menu.pdf` updates `bar-menu` pages.
- A filename like `bar.pdf` is normalized to `bar-menu`.

### Exact click-by-click: how to run the command

Use this when you have never done it before.

1. Save your PDF file in the repo (recommended folder: `incoming/`).

   Example:

   ```bash
   mkdir -p incoming
   # then copy your file so it becomes:
   # incoming/food-menu.pdf
   ```

2. Open a terminal in the project root (`/workspace/boteco-website`) and run one command:

   ```bash
   # Food menu
   python3 scripts/update_menu_from_pdf.py --pdf incoming/food-menu.pdf --menu food-menu

   # Bar menu
   python3 scripts/update_menu_from_pdf.py --pdf incoming/bar-menu.pdf --menu bar-menu
   ```

3. Wait for a `Done.` message. The script will tell you:
   - how many old files were removed for that menu,
   - how many pages were generated,
   - and how many image files were written.

4. Check output files in `assets/menus/`:
   - images like `food-menu-pg1.jpg` and `food-menu-pg1.webp`
   - updated manifest like `food-menu.json`

5. Open the matching page in browser and verify:
   - `food-menu.html` for food
   - `bar-menu.html` for bar

If your file path or file name is different, just change the `--pdf` value to match the real location.

If your design team sends a new menu as a PDF, you can now convert it and
update the website in one command.

1. Place the PDF anywhere in the repo (for example: `incoming/food-menu.pdf`).
2. Run:

   ```bash
   python3 scripts/update_menu_from_pdf.py --pdf incoming/food-menu.pdf --menu food-menu
   # or
   npm run update:menu:pdf -- --pdf incoming/food-menu.pdf --menu food-menu
   ```

What this does automatically:

- Renders every PDF page as a high-quality image.
- Saves each page as `assets/menus/<menu>-pg#.jpg` and
  `assets/menus/<menu>-pg#.webp`.
- Regenerates `assets/menus/<menu>.json` so the gallery loads the new pages.

What happens to previous images:

- By default, old page images for the same menu are removed first
  (for example `food-menu-pg1.jpg`, `food-menu-pg2.webp`, etc.) and then
  replaced with pages from the new PDF.
- Only the target menu is touched; other menus are left as-is.
  Updating `food-menu` will not change `bar-menu`, and vice versa.
- If you want to keep existing files for that menu, add `--keep-old`.

Useful options:

- `--dpi 220` controls render resolution (higher = sharper + larger files).
- `--quality 88` controls JPEG/WebP compression quality.
- `--keep-old` keeps old pages instead of replacing them.

Examples for the main menus:

```bash
# Food menu
python3 scripts/update_menu_from_pdf.py --pdf incoming/food-menu.pdf --menu food-menu

# Bar menu
python3 scripts/update_menu_from_pdf.py --pdf incoming/bar-menu.pdf --menu bar-menu
```

After running the command, open the matching menu page in your browser and
confirm the new pages look correct.

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
