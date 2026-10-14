"""Build small homepage videos and posters from the preserved originals."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import subprocess
import imageio_ffmpeg
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/videos/optimized'
OUT.mkdir(parents=True, exist_ok=True)
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

def encode(job):
    source, target, width = job
    dest = OUT / target
    subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', str(ROOT / source),
        '-vf', f'scale={width}:-2,fps=20', '-an', '-c:v', 'libx264', '-crf', '29',
        '-preset', 'fast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(dest)], check=True)
    print(f'{target}: {dest.stat().st_size} bytes', flush=True)

jobs = [(f'assets/images/about/about-us-tile{i}.mp4', f'about-tile{i}.mp4', 640) for i in (3, 4, 5)]
jobs += [('assets/images/placeholders/specials-placeholder.gif', 'specials.mp4', 480),
         ('assets/videos/hero/hero.mp4', 'hero.mp4', 960)]
with ThreadPoolExecutor(max_workers=2) as pool:
    list(pool.map(encode, jobs))

poster = ROOT / 'assets/images/hero.jpg'
subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-ss', '1', '-i', str(OUT / 'hero.mp4'),
    '-frames:v', '1', '-update', '1', str(poster)], check=True)
with Image.open(poster) as im:
    im.save(poster, quality=82, optimize=True)
with Image.open(ROOT / 'assets/images/placeholders/specials-placeholder.gif') as im:
    im.convert('RGB').save(ROOT / 'assets/images/placeholders/specials-poster.webp', quality=80)
for p in (ROOT / 'assets/images/about').glob('*.webp'):
    with Image.open(p) as im:
        if im.width <= 1200 and im.height <= 1200:
            continue
        small = ImageOps.exif_transpose(im).convert('RGB')
        small.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
        small.save(p, quality=82, method=6)
for i in (3, 4, 5):
    poster = ROOT / f'assets/images/about/about-us-tile{i}.webp'
    if not poster.exists():
        frame = OUT / f'about-tile{i}-poster.jpg'
        subprocess.run([FFMPEG, '-y', '-loglevel', 'error', '-i', str(OUT / f'about-tile{i}.mp4'),
            '-frames:v', '1', '-update', '1', str(frame)], check=True)
        with Image.open(frame) as im:
            im.save(poster, quality=80, method=6)
