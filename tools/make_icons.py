#!/usr/bin/env python3
"""Generate the PWA icons: a seamless cow print (black blotches on white).

Usage (from the repo root):  python3 tools/make_icons.py
Requires Pillow. Not needed at runtime; the PNGs are committed to icons/.
"""
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw

INK = (29, 29, 27)
MILK = (251, 248, 241)

SS = 4        # supersample factor for smooth edges
SEED = 7      # change for a different print
OUT = Path(__file__).resolve().parent.parent / "icons"


def make_blobs(rng, count=9, min_gap=8.0):
    """Blob centres/radii on a 100x100 tile, spaced so the print looks natural."""
    blobs = []
    tries = 0
    while len(blobs) < count and tries < 5000:
        tries += 1
        x, y, r = rng.uniform(0, 100), rng.uniform(0, 100), rng.uniform(11, 19)
        ok = True
        for bx, by, br in blobs:
            # distance on a wrapped (tileable) canvas
            dx = min(abs(x - bx), 100 - abs(x - bx))
            dy = min(abs(y - by), 100 - abs(y - by))
            if math.hypot(dx, dy) < r + br + min_gap:
                ok = False
                break
        if ok:
            blobs.append((x, y, r))
    return blobs


def blob_polygon(rng, cx, cy, r, big, steps=90):
    """An irregular, smooth blotch outline (radius wobbles with a few harmonics)."""
    harmonics = [(k, rng.uniform(0.06, 0.20), rng.uniform(0, math.tau)) for k in (2, 3, 4, 5)]
    pts = []
    for i in range(steps):
        t = math.tau * i / steps
        rr = r * (1 + sum(a * math.sin(k * t + p) for k, a, p in harmonics))
        pts.append(((cx + rr * math.cos(t)) * big / 100, (cy + rr * math.sin(t)) * big / 100))
    return pts


def draw_print(size, rounded):
    big = size * SS
    img = Image.new("RGBA", (big, big), MILK if not rounded else (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, big - 1, big - 1], radius=int(big * 0.22), fill=MILK)

    rng = random.Random(SEED)
    shapes = [(cx, cy, r, rng.random()) for cx, cy, r in make_blobs(rng)]

    # Draw blobs onto a mask, then composite so the rounded corners clip the print.
    mask = Image.new("L", (big, big), 0)
    md = ImageDraw.Draw(mask)
    for cx, cy, r, seed in shapes:
        # draw wrapped copies too so the pattern tiles; same outline for every copy
        for ox in (-100, 0, 100):
            for oy in (-100, 0, 100):
                md.polygon(blob_polygon(random.Random(seed), cx + ox, cy + oy, r, big), fill=255)
    ink = Image.new("RGBA", (big, big), INK + (255,))
    if rounded:
        corner = Image.new("L", (big, big), 0)
        ImageDraw.Draw(corner).rounded_rectangle([0, 0, big - 1, big - 1], radius=int(big * 0.22), fill=255)
        mask = Image.composite(mask, Image.new("L", (big, big), 0), corner)
    img.paste(ink, (0, 0), mask)
    return img.resize((size, size), Image.LANCZOS)


def main():
    OUT.mkdir(exist_ok=True)
    draw_print(192, rounded=True).save(OUT / "icon-192.png")
    draw_print(512, rounded=True).save(OUT / "icon-512.png")
    # Maskable / Apple touch icon: full-bleed (the OS applies its own mask).
    draw_print(512, rounded=False).save(OUT / "icon-maskable-512.png")
    print("Wrote icons to", OUT)


if __name__ == "__main__":
    main()
