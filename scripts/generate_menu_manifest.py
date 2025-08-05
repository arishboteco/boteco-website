#!/usr/bin/env python3
"""Generate menu manifest JSON files based on available images."""

from __future__ import annotations

import json
import re
from pathlib import Path

MENU_DIR = Path(__file__).resolve().parents[1] / "assets" / "menus"
PATTERN = re.compile(r"(?P<menu>.+-menu)-pg(?P<page>\d+)\.(?P<ext>jpg|jpeg|png|webp)$", re.IGNORECASE)
def generate_manifest() -> None:
    menus: dict[str, dict[int, dict[str, str]]] = {}
    for path in MENU_DIR.iterdir():
        if not path.is_file():
            continue
        m = PATTERN.match(path.name)
        if not m:
            continue
        menu = m.group("menu").lower()
        page = int(m.group("page"))
        ext = path.suffix.lower().lstrip(".")
        menu_pages = menus.setdefault(menu, {})
        page_files = menu_pages.setdefault(page, {})
        page_files[ext] = path.name

    for menu, pages in menus.items():
        files: list[list[str]] = []
        for i in sorted(pages):
            page_files = pages[i]
            entry: list[str] = []
            webp = page_files.get("webp")
            jpg = page_files.get("jpg") or page_files.get("jpeg") or page_files.get("png")
            if webp:
                entry.append(webp)
            if jpg:
                entry.append(jpg)
            if not entry:
                continue
            files.append(entry)
        manifest_path = MENU_DIR / f"{menu}.json"
        with manifest_path.open("w", encoding="utf-8") as f:
            json.dump(files, f, indent=2)
            f.write("\n")
        print(f"Wrote {manifest_path.relative_to(Path(__file__).resolve().parents[1])}")


def main() -> None:
    generate_manifest()


if __name__ == "__main__":
    main()
