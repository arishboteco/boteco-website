#!/usr/bin/env python3
"""Process uploaded menu PDFs and update website menu assets.

This utility is intended for automation in CI when PDFs are uploaded to the repo.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from update_menu_from_pdf import (
    normalize_menu_name,
    regenerate_manifests,
    remove_existing_pages,
    render_pdf_pages,
    save_pages,
)

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE_DIRS = [ROOT / "incoming", ROOT]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Convert uploaded menu PDFs into menu images and refresh menu manifests."
    )
    parser.add_argument(
        "--source-dir",
        action="append",
        dest="source_dirs",
        type=Path,
        help=(
            "Folder to scan for menu PDFs. Repeat the option to include multiple folders. "
            "Default scan locations: incoming/ and repo root."
        ),
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

    if not args.source_dirs:
        args.source_dirs = DEFAULT_SOURCE_DIRS

    return args


def infer_menu_from_pdf_name(pdf_path: Path) -> str:
    """Infer menu slug from filename.

    Examples:
      food-menu.pdf -> food-menu
      bar-menu.pdf -> bar-menu
      specials-menu.pdf -> specials-menu
    """
    return normalize_menu_name(pdf_path.stem)


def collect_pdf_paths(source_dirs: list[Path]) -> list[Path]:
    pdfs: dict[str, Path] = {}
    for source_dir in source_dirs:
        resolved_dir = source_dir.resolve()
        if not resolved_dir.exists():
            continue
        for path in resolved_dir.glob("*.pdf"):
            if not path.is_file():
                continue
            # Keep automation focused on menu uploads and avoid unrelated PDFs.
            if "menu" not in path.stem.lower():
                continue
            pdfs[str(path.resolve())] = path.resolve()
    return sorted(pdfs.values())


def main() -> None:
    args = parse_args()
    source_dirs = [p.resolve() for p in args.source_dirs]

    pdf_paths = collect_pdf_paths(source_dirs)
    if not pdf_paths:
        print("No menu PDFs found. Checked folders:")
        for folder in source_dirs:
            print(f"- {folder}")
        print("Tip: use names like 'food-menu.pdf' or 'bar-menu.pdf'.")
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

    print("\nDone processing uploaded menu PDFs.")
    print(f"PDF files processed: {len(pdf_paths)}")
    print(f"Total pages generated: {total_pages}")
    print(f"Total image files written: {total_files_written}")
    if args.keep_old:
        print("Old files removal: skipped (--keep-old)")
    else:
        print(f"Total old files removed: {total_old_files_removed}")


if __name__ == "__main__":
    main()
