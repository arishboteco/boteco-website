#!/usr/bin/env python3
"""Generate menus.json listing available menu image files."""

from pathlib import Path
import json
import re

MENU_DIR = Path(__file__).resolve().parents[1] / "assets" / "menus"
PATTERN = re.compile(r"(?P<menu>.+)-pg(?P<num>\d+)\.jpg", re.IGNORECASE)

menus = {}
for path in sorted(MENU_DIR.glob("*.jpg")):
    m = PATTERN.match(path.name)
    if not m:
        continue
    menu = m.group("menu")
    num = int(m.group("num"))
    menus.setdefault(menu, []).append((num, path.name))

for menu, items in menus.items():
    menus[menu] = [name for _, name in sorted(items)]

out_file = MENU_DIR / "menus.json"
with out_file.open("w", encoding="utf-8") as f:
    json.dump(menus, f, indent=2)
    f.write("\n")
print(f"Wrote {len(menus)} menus to {out_file}")
