# Boteco Website

This repository contains the static files for the Boteco restaurant website.

## Security

External CDN resources are loaded with [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) attributes to ensure the assets have not been tampered with. Event titles are inserted using the DOM API to prevent cross-site scripting.

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

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
