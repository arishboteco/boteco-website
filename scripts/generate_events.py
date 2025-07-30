import os
import json
import re

dir_path = os.path.join('assets', 'events')
pattern = re.compile(r'^(\d{4})-(\d{2})-(\d{2})-(.+)\.(png|jpe?g|webp)$', re.IGNORECASE)

events = []
for fname in os.listdir(dir_path):
    m = pattern.match(fname)
    if not m:
        continue
    year, month, day, title, _ = m.groups()
    date = f"{year}-{month}-{day}"
    title = title.replace('-', ' ').replace('_', ' ')
    events.append({'date': date, 'title': title, 'image': fname})

events.sort(key=lambda e: e['date'])
with open(os.path.join(dir_path, 'events.json'), 'w') as f:
    json.dump(events, f, indent=2)
    f.write('\n')
