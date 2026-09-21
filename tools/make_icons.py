#!/usr/bin/env python3
"""Generate the PWA icons (a cow face on a pasture-green field).

Usage (from the repo root):  python3 tools/make_icons.py
Requires Pillow. Not needed at runtime; the PNGs are committed to icons/.
"""
from pathlib import Path
from PIL import Image, ImageDraw

GREEN = (47, 93, 58)
INK = (29, 29, 27)
MILK = (251, 248, 241)
PINK = (240, 168, 168)
GOLD = (242, 182, 50)
HORN = (232, 220, 190)

SS = 4  # supersample factor for smooth edges
OUT = Path(__file__).resolve().parent.parent / "icons"


def draw_cow(size, scale, rounded):
    """Draw the icon on a size x size canvas; `scale` shrinks the cow (for maskable safe zone)."""
    big = size * SS
    img = Image.new("RGBA", (big, big), GREEN if not rounded else (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, big - 1, big - 1], radius=int(big * 0.22), fill=GREEN)

    c = big / 2
    u = big * scale / 100.0  # 1 unit = 1% of the (scaled) icon

    def box(cx, cy, w, h):
        return [c + (cx - w / 2) * u, c + (cy - h / 2) * u, c + (cx + w / 2) * u, c + (cy + h / 2) * u]

    # horns
    d.ellipse(box(-27, -33, 14, 20), fill=HORN, outline=INK, width=int(u * 1.6))
    d.ellipse(box(27, -33, 14, 20), fill=HORN, outline=INK, width=int(u * 1.6))
    # ears
    d.ellipse(box(-39, -14, 24, 14), fill=INK)
    d.ellipse(box(39, -14, 24, 14), fill=INK)
    d.ellipse(box(-38, -14, 15, 8), fill=PINK)
    d.ellipse(box(38, -14, 15, 8), fill=PINK)
    # head
    d.rounded_rectangle(box(0, -4, 58, 62), radius=int(u * 22), fill=MILK, outline=INK, width=int(u * 2))
    # spots
    d.ellipse(box(-14, -24, 22, 16), fill=INK)
    d.ellipse(box(19, -12, 12, 15), fill=INK)
    # eyes
    for ex in (-15, 15):
        d.ellipse(box(ex, -6, 9, 11), fill=(255, 255, 255), outline=INK, width=int(u * 1.2))
        d.ellipse(box(ex, -5, 4.5, 6), fill=INK)
    # snout
    d.rounded_rectangle(box(0, 19, 42, 24), radius=int(u * 11), fill=PINK, outline=INK, width=int(u * 2))
    for nx in (-9, 9):
        d.ellipse(box(nx, 19, 6, 8), fill=INK)
    # a little gold Cow Coin
    d.ellipse(box(33, 36, 20, 20), fill=GOLD, outline=INK, width=int(u * 1.6))
    d.ellipse(box(33, 36, 10, 10), outline=INK, width=int(u * 1.2))

    return img.resize((size, size), Image.LANCZOS)


def main():
    OUT.mkdir(exist_ok=True)
    draw_cow(192, 1.0, rounded=True).save(OUT / "icon-192.png")
    draw_cow(512, 1.0, rounded=True).save(OUT / "icon-512.png")
    # Maskable: full-bleed background, cow kept inside the central ~80% safe zone.
    draw_cow(512, 0.78, rounded=False).save(OUT / "icon-maskable-512.png")
    print("Wrote icons to", OUT)


if __name__ == "__main__":
    main()
