#!/usr/bin/env python3
"""Generate events.json from image filenames and archive past events."""

import json
import re
from datetime import date
from pathlib import Path


def _slugify(event: dict) -> str:
    """Return a slug for looking up existing metadata such as links."""
    return f"{event['date']}-{event['title'].replace(' ', '-')}".lower()


def _load_existing_links() -> dict:
    """Load existing link fields from events and archive JSON files."""
    link_map = {}
    for file in [EVENT_DIR / "events.json", ARCHIVE_DIR / "archive.json"]:
        if not file.exists():
            continue
        try:
            with file.open("r", encoding="utf-8") as f:
                for event in json.load(f):
                    link = event.get("link")
                    if link:
                        link_map[_slugify(event)] = link
        except Exception:
            continue
    return link_map

EVENT_DIR = Path(__file__).resolve().parents[1] / "assets" / "events"
ARCHIVE_DIR = EVENT_DIR / "archive"
PATTERN = re.compile(r"(?P<date>\d{4}-\d{2}-\d{2})-(?P<title>.+?)\.(?:jpg|png|webp)$", re.IGNORECASE)


def parse_event(path: Path):
    """Return metadata from an event filename or ``None``."""
    m = PATTERN.match(path.name)
    if not m:
        return None
    return {
        "date": m.group("date"),
        "title": m.group("title").replace("-", " "),
        "image": path.name,
    }


def load_event_dir(dir_path: Path, target: dict, ext_priority: dict, archive: bool = False):
    """Populate ``target`` with events from ``dir_path`` honoring extension priority.

    When ``archive`` is ``False``, past events are moved into the archive
    directory before being processed when the archive itself is loaded.
    """

    today = date.today()
    skip_names = {"archive.json"} if archive else {"events.json", ARCHIVE_DIR.name}

    for path in sorted(dir_path.iterdir()):
        if path.name in skip_names or not path.is_file():
            continue

        event = parse_event(path)
        if not event:
            continue

        if not archive:
            event_date = date.fromisoformat(event["date"])
            if event_date < today:
                path.rename(ARCHIVE_DIR / path.name)
                continue

        key = path.stem.lower()
        ext = path.suffix.lower()
        existing = target.get(key)
        if not existing or ext_priority.get(ext, 0) > ext_priority.get(
            Path(existing["image"]).suffix.lower(), 0
        ):
            target[key] = event


def collect_events():
    """Separate upcoming and past events, moving past ones to the archive.

    If multiple image formats exist for the same event (e.g. ``.jpg`` and
    ``.webp``), prefer the ``.webp`` version to avoid duplicate entries in the
    generated ``events.json``.
    """

    # Use dictionaries keyed by the event slug (date + title) so that we can
    # de-duplicate different image formats for the same event.
    upcoming = {}
    archived = {}

    ARCHIVE_DIR.mkdir(exist_ok=True)

    # Define a simple priority for image formats. Higher wins.
    ext_priority = {".webp": 3, ".jpg": 2, ".jpeg": 2, ".png": 1}

    load_event_dir(EVENT_DIR, upcoming, ext_priority)
    load_event_dir(ARCHIVE_DIR, archived, ext_priority, archive=True)

    upcoming_list = sorted(upcoming.values(), key=lambda e: e["date"])
    archived_list = sorted(archived.values(), key=lambda e: e["date"], reverse=True)

    return upcoming_list, archived_list


def write_events(upcoming, archived):
    events_file = EVENT_DIR / "events.json"
    with events_file.open("w", encoding="utf-8") as f:
        json.dump(upcoming, f, indent=2)
        f.write("\n")

    archive_file = ARCHIVE_DIR / "archive.json"
    with archive_file.open("w", encoding="utf-8") as f:
        json.dump(archived, f, indent=2)
        f.write("\n")

    print(
        f"Wrote {len(upcoming)} upcoming events and {len(archived)} archived events."
    )


def main() -> None:
    link_map = _load_existing_links()
    upcoming, archived = collect_events()
    for event in upcoming:
        if (link := link_map.get(_slugify(event))):
            event["link"] = link
    for event in archived:
        if (link := link_map.get(_slugify(event))):
            event["link"] = link
    write_events(upcoming, archived)


if __name__ == "__main__":
    main()
