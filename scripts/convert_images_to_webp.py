#!/usr/bin/env python3
"""Convert JPG and PNG images under assets/ to WebP format."""

from __future__ import annotations

import argparse
from pathlib import Path

try:
    from PIL import Image
except ImportError as exc:
    raise SystemExit("Pillow is required to convert images: pip install pillow") from exc

ASSETS_DIR = Path(__file__).resolve().parents[1] / "assets"
IMAGE_EXTS = {".jpg", ".jpeg", ".png"}


def convert_image(path: Path, *, dry_run: bool = False) -> None:
    """Convert a single image to WebP if needed."""
    out_path = path.with_suffix(".webp")
    if out_path.exists() and out_path.stat().st_mtime >= path.stat().st_mtime:
        return
    print(f"Converting {path.relative_to(ASSETS_DIR.parent)} -> {out_path.relative_to(ASSETS_DIR.parent)}")
    if dry_run:
        return
    with Image.open(path) as img:
        img.save(out_path, "WEBP", quality=80)


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert images to WebP")
    parser.add_argument("--dry-run", action="store_true", help="Show actions without writing files")
    args = parser.parse_args()

    for path in ASSETS_DIR.rglob("*"):
        if path.is_file() and path.suffix.lower() in IMAGE_EXTS:
            convert_image(path, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
