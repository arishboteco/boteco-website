# Boteco Website

This repository contains the static files for the Boteco restaurant website.

## Updating Events

Event cards on the homepage are built from images in `assets/events/`.
To avoid hitting GitHub API limits, a cached `events.json` file is also used.

1. **Add or remove event images** in `assets/events/` using the format
   `YYYY-MM-DD-Event-Name.jpg` (or `.png`, `.webp`).
2. **Update `events.json`** in the same folder with an array of event objects:

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

When network errors or API limits occur, visitors will see a friendly
"No upcoming events" message instead of the section disappearing.
