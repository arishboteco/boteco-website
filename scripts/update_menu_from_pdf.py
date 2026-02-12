#!/usr/bin/env python3
"""Convert a menu PDF into numbered JPG/WEBP pages and refresh menu manifests.

Example:
    python3 scripts/update_menu_from_pdf.py --pdf incoming/food-menu.pdf --menu food-menu
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MENU_DIR = ROOT / "assets" / "menus"
MANIFEST_SCRIPT = ROOT / "scripts" / "generate_menu_manifest.py"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert a menu PDF into website-ready page images and regenerate menu manifests."
    )
    parser.add_argument(
        "--pdf",
        required=True,
        type=Path,
        help="Path to the source PDF file.",
    )
    parser.add_argument(
        "--menu",
        required=True,
        help="Menu slug used in filenames, for example: food-menu, bar-menu, specials-menu.",
    )
    parser.add_argument(
        "--dpi",
        type=int,
        default=220,
        help="Render resolution in DPI. Higher values increase quality and file size (default: 220).",
    )
    parser.add_argument(
        "--quality",
        type=int,
        default=88,
        help="JPEG/WebP quality from 1-100 (default: 88).",
    )
    parser.add_argument(
        "--keep-old",
        action="store_true",
        help="Keep existing pages for this menu instead of deleting and replacing them.",
    )
    args = parser.parse_args()

    if args.dpi < 72 or args.dpi > 600:
        parser.error("--dpi must be between 72 and 600.")
    if args.quality < 1 or args.quality > 100:
        parser.error("--quality must be between 1 and 100.")

    return args


def normalize_menu_name(menu: str) -> str:
    cleaned = menu.strip().lower().replace("_", "-").replace(" ", "-")
    if not cleaned.endswith("-menu"):
        cleaned = f"{cleaned}-menu"
    return cleaned


def list_menu_page_images(menu: str) -> list[Path]:
    candidates = sorted(MENU_DIR.glob(f"{menu}-pg*"))
    supported = {".jpg", ".jpeg", ".png", ".webp"}
    return [path for path in candidates if path.suffix.lower() in supported and path.is_file()]


def remove_existing_pages(menu: str) -> int:
    existing_files = list_menu_page_images(menu)
    for file_path in existing_files:
        file_path.unlink(missing_ok=True)
    return len(existing_files)


def render_pdf_pages(pdf_path: Path, dpi: int) -> list[Image.Image]:
    try:
        import fitz  # PyMuPDF
    except ImportError as exc:  # pragma: no cover - runtime dependency guard
        raise RuntimeError(
            "PyMuPDF is required to render PDFs. Install dependencies with: pip install -r requirements.txt"
        ) from exc

    doc = fitz.open(pdf_path)
    if doc.page_count == 0:
        raise RuntimeError("The provided PDF has no pages.")

    scale = dpi / 72
    matrix = fitz.Matrix(scale, scale)
    pages: list[Image.Image] = []

    for page_index in range(doc.page_count):
        page = doc.load_page(page_index)
        pix = page.get_pixmap(matrix=matrix, alpha=False)
        image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        pages.append(image)

    doc.close()
    return pages


def save_pages(menu: str, pages: list[Image.Image], quality: int) -> int:
    files_written = 0
    for index, image in enumerate(pages, start=1):
        jpg_name = f"{menu}-pg{index}.jpg"
        webp_name = f"{menu}-pg{index}.webp"
        jpg_path = MENU_DIR / jpg_name
        webp_path = MENU_DIR / webp_name

        image.save(jpg_path, format="JPEG", optimize=True, quality=quality)
        image.save(webp_path, format="WEBP", method=6, quality=quality)
        print(f"Wrote {jpg_path.relative_to(ROOT)}")
        print(f"Wrote {webp_path.relative_to(ROOT)}")
        files_written += 2

    return files_written


def regenerate_manifests() -> None:
    result = subprocess.run(
        [sys.executable, str(MANIFEST_SCRIPT)],
        cwd=ROOT,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError("Failed to regenerate menu manifests.")


def main() -> None:
    args = parse_args()
    pdf_path = args.pdf.resolve()
    if not pdf_path.is_file():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    menu = normalize_menu_name(args.menu)
    MENU_DIR.mkdir(parents=True, exist_ok=True)

    deleted_count = 0
    if not args.keep_old:
        deleted_count = remove_existing_pages(menu)

    pages = render_pdf_pages(pdf_path, dpi=args.dpi)
    files_written = save_pages(menu, pages, quality=args.quality)
    regenerate_manifests()

    print("\nDone.")
    print(f"Target menu: {menu}")
    if args.keep_old:
        print("Old files: kept (only new page files were added/overwritten)")
    else:
        print(f"Old files removed for this menu: {deleted_count}")
    print("Other menus were not modified.")
    print(f"Menu updated from PDF: {pdf_path}")
    print(f"Pages generated: {len(pages)}")
    print(f"Image files written: {files_written}")
    print("Open the corresponding menu page in your browser to verify visual quality.")


if __name__ == "__main__":
    main()
