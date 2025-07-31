#!/usr/bin/env python3
"""Generate events.json from image filenames."""

import json
import re
from pathlib import Path

EVENT_DIR = Path(__file__).resolve().parents[1] / "assets" / "events"
DATA_DIR = Path(__file__).resolve().parents[1] / "_data"
PATTERN = re.compile(r"(?P<date>\d{4}-\d{2}-\d{2})-(?P<title>.+?)\.(?:jpg|png|webp)$", re.IGNORECASE)


def parse_events():
    events = []
    for path in sorted(EVENT_DIR.iterdir()):
        if not path.is_file() or path.name.endswith(".json"):
            continue
        m = PATTERN.match(path.name)
        if not m:
            continue
        date = m.group("date")
        title = m.group("title").replace("-", " ")
        events.append({"date": date, "title": title, "image": path.name})
    return events


def main() -> None:
    events = parse_events()
    out_file = DATA_DIR / "events.json"
    with out_file.open("w", encoding="utf-8") as f:
        json.dump(events, f, indent=2)
        f.write("\n")
    print(f"Wrote {len(events)} events to {out_file}")


if __name__ == "__main__":
    main()
