#!/usr/bin/env python3
"""Generate events.json from image filenames and archive past events."""

import json
import re
from datetime import date
from pathlib import Path

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


def collect_events():
    """Separate upcoming and past events, moving past ones to the archive."""
    today = date.today()
    upcoming = []
    archived = []

    ARCHIVE_DIR.mkdir(exist_ok=True)

    for path in sorted(EVENT_DIR.iterdir()):
        if path.name in {"events.json", ARCHIVE_DIR.name} or not path.is_file():
            continue
        event = parse_event(path)
        if not event:
            continue
        event_date = date.fromisoformat(event["date"])
        if event_date < today:
            path.rename(ARCHIVE_DIR / path.name)
            archived.append(event)
        else:
            upcoming.append(event)

    for path in sorted(ARCHIVE_DIR.iterdir()):
        if path.name == "archive.json" or not path.is_file():
            continue
        event = parse_event(path)
        if event:
            archived.append(event)

    upcoming.sort(key=lambda e: e["date"])
    archived.sort(key=lambda e: e["date"], reverse=True)

    return upcoming, archived


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
    upcoming, archived = collect_events()
    write_events(upcoming, archived)


if __name__ == "__main__":
    main()
