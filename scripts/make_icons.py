#!/usr/bin/env python3
"""Generate the breathe. app icons: concentric rings on a black ground.
Outputs maskable + apple-touch sizes into ../icons/.
"""
import os
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), "..", "icons")
os.makedirs(OUT, exist_ok=True)

BG = (243, 236, 227)        # creme ground
RING = (64, 30, 1)          # espresso
SS = 4                     # supersample for crisp anti-aliased rings


def draw_icon(size, padding_ratio=0.0, rounded=False):
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # ground (rounded square for maskable safety, or full bleed)
    if rounded:
        r = int(s * 0.22)
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=r, fill=BG)
    else:
        d.rectangle([0, 0, s, s], fill=BG)

    cx = cy = s / 2
    pad = s * padding_ratio
    max_r = (s / 2) - pad - s * 0.10
    rings = 4
    stroke = max(2 * SS, int(s * 0.012))
    for i in range(rings):
        rr = max_r * (i + 1) / rings
        d.ellipse(
            [cx - rr, cy - rr, cx + rr, cy + rr],
            outline=RING,
            width=stroke,
        )
    # solid center dot
    dot = max_r * 0.12
    d.ellipse([cx - dot, cy - dot, cx + dot, cy + dot], fill=RING)

    img = img.resize((size, size), Image.LANCZOS)
    return img


def main():
    # Standard PWA icons (full-bleed black ground)
    for sz in (192, 512):
        draw_icon(sz, padding_ratio=0.06).save(os.path.join(OUT, f"icon-{sz}.png"))
    # Maskable (extra safe padding so rings survive the mask crop)
    draw_icon(512, padding_ratio=0.18).save(os.path.join(OUT, "maskable-512.png"))
    # Apple touch icon (rounded handled by iOS, so full bleed)
    draw_icon(180, padding_ratio=0.10).save(os.path.join(OUT, "apple-touch-icon.png"))
    # Favicon
    draw_icon(64, padding_ratio=0.06).save(os.path.join(OUT, "favicon.png"))
    print("icons written to", os.path.abspath(OUT))


if __name__ == "__main__":
    main()
