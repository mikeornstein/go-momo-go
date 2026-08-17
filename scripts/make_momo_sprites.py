#!/usr/bin/env python3
"""Cut Imagine Momo stills into Playdate-ready 1-bit sprites.

White interior stays opaque so he punches through grass. Corner-flooded
white becomes transparent. Output is nearest-neighbor scaled into a
fixed cell with feet on the bottom row.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "reference" / "imagine_momo"
OUT = ROOT / "source" / "images"

CELL_W = 48
CELL_H = 48
FOOT_PAD = 1
SIDE_PAD = 1
INK = 96  # below this luminance → black

# Engine poses only. pee.jpg bakes a puddle; pooed.jpg bakes a pile.
FRAMES = (
    ("momo-stand", "momo-stand.jpg"),
    ("momo-sniff", "momo-sniff.jpg"),
    ("momo-squat", "momo-squat.jpg"),
    ("momo-lift-leg", "momo-lift-leg.jpg"),
)


def threshold(im: Image.Image) -> Image.Image:
    rgb = im.convert("RGB")
    w, h = rgb.size
    out = Image.new("RGB", (w, h))
    px = rgb.load()
    dest = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            dest[x, y] = (0, 0, 0) if (r + g + b) / 3 < INK else (255, 255, 255)
    return out


def flood_background(im: Image.Image) -> Image.Image:
    """White connected to the border → transparent."""
    rgba = im.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()
    seen = set()
    stack = []
    for x in range(w):
        stack.append((x, 0))
        stack.append((x, h - 1))
    for y in range(h):
        stack.append((0, y))
        stack.append((w - 1, y))
    while stack:
        x, y = stack.pop()
        if (x, y) in seen or x < 0 or y < 0 or x >= w or y >= h:
            continue
        seen.add((x, y))
        r, g, b, a = px[x, y]
        if a == 0 or r < 250 or g < 250 or b < 250:
            continue
        px[x, y] = (255, 255, 255, 0)
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return rgba


def content_box(im: Image.Image) -> tuple[int, int, int, int]:
    px = im.load()
    w, h = im.size
    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            if px[x, y][3] == 0:
                continue
            min_x = min(min_x, x)
            min_y = min(min_y, y)
            max_x = max(max_x, x)
            max_y = max(max_y, y)
    return min_x, min_y, max_x + 1, max_y + 1


def fit_cell(im: Image.Image) -> Image.Image:
    box = content_box(im)
    cropped = im.crop(box)
    cw, ch = cropped.size
    max_w = CELL_W - SIDE_PAD * 2
    max_h = CELL_H - FOOT_PAD
    scale = min(max_w / cw, max_h / ch)
    nw = max(1, int(round(cw * scale)))
    nh = max(1, int(round(ch * scale)))
    scaled = cropped.resize((nw, nh), Image.Resampling.NEAREST)
    cell = Image.new("RGBA", (CELL_W, CELL_H), (0, 0, 0, 0))
    x = (CELL_W - nw) // 2
    y = CELL_H - FOOT_PAD - nh
    cell.paste(scaled, (x, y), scaled)
    return cell


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, filename in FRAMES:
        src = SRC / filename
        im = Image.open(src)
        sprite = fit_cell(flood_background(threshold(im)))
        dest = OUT / f"{name}.png"
        sprite.save(dest)
        print(f"{dest.relative_to(ROOT)} {sprite.size}")


if __name__ == "__main__":
    main()
