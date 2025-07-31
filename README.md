# Boteco Website

This repository contains the source files for the Boteco restaurant website. The site is built using a simple Node.js-based build script.

## Prerequisites

- Node.js
- Python 3

## Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Build the website:**
    ```bash
    npm run build
    ```
    This will generate the static website in the `dist/` directory.

## Updating Content

### Menus

To update the food or bar menus, edit the JSON files in the `_data` directory:

-   `_data/food-menu.json`
-   `_data/bar-menu.json`

The structure of these files is an array of categories, each with an array of items. Follow the existing structure to add, remove, or modify menu items. After editing, run `npm run build` to regenerate the website.

### Events

Event cards on the homepage are built from images in `assets/events/`.

1.  **Add or remove event images** in `assets/events/` using the format
    `YYYY-MM-DD-Event-Name.jpg` (or `.png`, `.webp`).
2.  Run `python3 scripts/generate_events_json.py` to rebuild
    `_data/events.json` from those filenames.
3.  Commit the new image files and the updated `_data/events.json`.

The `update-events` GitHub Actions workflow will also run daily to regenerate the `events.json` file automatically.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
