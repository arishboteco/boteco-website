#!/usr/bin/env python3
"""Process all menu PDFs from incoming/ and update website menu assets.

This utility is intended for automation in CI when PDFs are uploaded to the repo.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from update_menu_from_pdf import normalize_menu_name, regenerate_manifests, remove_existing_pages, render_pdf_pages, save_pages

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE_DIR = ROOT / "incoming"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert every PDF in a folder into menu images and refresh menu manifests."
    )
    parser.add_argument(
        "--source-dir",
        type=Path,
        default=DEFAULT_SOURCE_DIR,
        help="Folder that contains uploaded menu PDFs (default: incoming/).",
    )
    parser.add_argument(
        "--dpi",
        type=int,
        default=220,
        help="Render resolution in DPI (default: 220).",
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
        help="Keep existing pages for each menu instead of replacing them.",
    )
    args = parser.parse_args()

    if args.dpi < 72 or args.dpi > 600:
        parser.error("--dpi must be between 72 and 600.")
    if args.quality < 1 or args.quality > 100:
        parser.error("--quality must be between 1 and 100.")

    return args


def infer_menu_from_pdf_name(pdf_path: Path) -> str:
    """Infer menu slug from filename.

    Examples:
      food-menu.pdf -> food-menu
      bar.pdf -> bar-menu
      specials_menu.pdf -> specials-menu
    """
    return normalize_menu_name(pdf_path.stem)


def main() -> None:
    args = parse_args()
    source_dir = args.source_dir.resolve()
    if not source_dir.exists():
        print(f"No source folder found at: {source_dir}")
        return

    pdf_paths = sorted(path for path in source_dir.glob("*.pdf") if path.is_file())
    if not pdf_paths:
        print(f"No PDFs found in: {source_dir}")
        return

    total_pages = 0
    total_files_written = 0
    total_old_files_removed = 0

    for pdf_path in pdf_paths:
        menu = infer_menu_from_pdf_name(pdf_path)
        print(f"\nProcessing: {pdf_path.relative_to(ROOT)} -> {menu}")

        if args.keep_old:
            removed_count = 0
        else:
            removed_count = remove_existing_pages(menu)
            total_old_files_removed += removed_count

        pages = render_pdf_pages(pdf_path, dpi=args.dpi)
        files_written = save_pages(menu, pages, quality=args.quality)

        total_pages += len(pages)
        total_files_written += files_written

        if args.keep_old:
            print("Old files: kept")
        else:
            print(f"Old files removed for this menu: {removed_count}")
        print(f"Pages generated: {len(pages)}")
        print(f"Image files written: {files_written}")

    regenerate_manifests()

    print("\nDone processing uploaded PDFs.")
    print(f"PDF files processed: {len(pdf_paths)}")
    print(f"Total pages generated: {total_pages}")
    print(f"Total image files written: {total_files_written}")
    if args.keep_old:
        print("Old files removal: skipped (--keep-old)")
    else:
        print(f"Total old files removed: {total_old_files_removed}")


if __name__ == "__main__":
    main()
