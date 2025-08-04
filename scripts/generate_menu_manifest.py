#!/usr/bin/env python3
"""Generate menu manifest JSON files based on available images."""

from __future__ import annotations

import json
import re
from pathlib import Path

MENU_DIR = Path(__file__).resolve().parents[1] / "assets" / "menus"
PATTERN = re.compile(r"(?P<menu>.+-menu)-pg(?P<page>\d+)\.(?P<ext>jpg|jpeg|png|webp)$", re.IGNORECASE)
EXT_PRIORITY = {".webp": 3, ".jpg": 2, ".jpeg": 2, ".png": 1}

def generate_manifest() -> None:
    menus: dict[str, dict[int, str]] = {}
    for path in MENU_DIR.iterdir():
        if not path.is_file():
            continue
        m = PATTERN.match(path.name)
        if not m:
            continue
        menu = m.group("menu").lower()
        page = int(m.group("page"))
        ext = path.suffix.lower()
        menu_pages = menus.setdefault(menu, {})
        existing = menu_pages.get(page)
        if not existing or EXT_PRIORITY.get(ext, 0) > EXT_PRIORITY.get(Path(existing).suffix.lower(), 0):
            menu_pages[page] = path.name
    for menu, pages in menus.items():
        files = [pages[i] for i in sorted(pages)]
        manifest_path = MENU_DIR / f"{menu}.json"
        with manifest_path.open("w", encoding="utf-8") as f:
            json.dump(files, f, indent=2)
            f.write("\n")
        print(f"Wrote {manifest_path.relative_to(Path(__file__).resolve().parents[1])}")


def main() -> None:
    generate_manifest()


if __name__ == "__main__":
    main()
