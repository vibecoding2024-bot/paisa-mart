"""Generate Paisa Mart Android launcher icons from the approved Play store icon.

Source of truth: store-assets/google-play/icon-512.png (orange "P", the hi-res
icon already used on the Play store listing). Nothing new is drawn; every output
is derived from that file so the installed launcher matches the store listing.

Outputs (mobile/assets/branding/):
  app-icon.png                 legacy/full icon (copy of the approved 512 icon)
  adaptive-icon-foreground.png 1024x1024, white "P" on transparent
  adaptive-icon-monochrome.png 1024x1024, glyph alpha for Android 13+ themed icons

Adaptive layout: the store icon is scaled onto the 72dp visible viewport of the
108dp adaptive canvas, so the glyph keeps the same proportions as the store icon
and stays inside the 66dp safe zone. The background is the solid brand orange,
set as android.adaptiveIcon.backgroundColor in mobile/app.json.

Usage (from repo root):  python scripts/generate-android-launcher-icons.py
"""
from __future__ import annotations

import math
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "store-assets" / "google-play" / "icon-512.png"
OUT = ROOT / "mobile" / "assets" / "branding"
CANVAS = 1024
VIEWPORT = round(CANVAS * 72 / 108)  # visible area of an adaptive icon
SAFE_RADIUS = CANVAS * 66 / 108 / 2  # launcher masks never cut inside this
BRAND_ORANGE = (253, 135, 2)  # #FD8702, dominant colour of the source icon


def glyph_alpha(src: Image.Image) -> Image.Image:
    """Alpha mask of the white glyph: orange has blue≈2, white has blue≈253."""
    _, _, blue, _ = src.convert("RGBA").split()
    return blue.point(lambda b: max(0, min(255, round((b - 2) * 255 / 251))))


def main() -> None:
    src = Image.open(SOURCE)
    if src.size != (512, 512):
        raise SystemExit(f"unexpected source size {src.size}")
    OUT.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(SOURCE, OUT / "app-icon.png")

    mask = glyph_alpha(src).resize((VIEWPORT, VIEWPORT), Image.Resampling.LANCZOS)
    offset = (CANVAS - VIEWPORT) // 2
    full_mask = Image.new("L", (CANVAS, CANVAS), 0)
    full_mask.paste(mask, (offset, offset))

    # Safety check: no visible glyph pixel may fall outside the safe zone.
    bbox = full_mask.point(lambda a: 255 if a > 8 else 0).getbbox()
    if bbox is None:
        raise SystemExit("glyph not found")
    c = CANVAS / 2
    corners = [(bbox[0], bbox[1]), (bbox[2], bbox[1]), (bbox[0], bbox[3]), (bbox[2], bbox[3])]
    worst = max(math.hypot(x - c, y - c) for x, y in corners)
    if worst > SAFE_RADIUS:
        raise SystemExit(f"glyph exceeds safe zone: {worst:.0f} > {SAFE_RADIUS:.0f}")

    white = Image.new("RGBA", (CANVAS, CANVAS), (255, 255, 255, 0))
    white.putalpha(full_mask)
    white.save(OUT / "adaptive-icon-foreground.png", optimize=True)
    white.save(OUT / "adaptive-icon-monochrome.png", optimize=True)

    print(f"glyph bbox {bbox}, max corner radius {worst:.0f}px <= safe {SAFE_RADIUS:.0f}px")
    print("background colour #%02X%02X%02X" % BRAND_ORANGE)


if __name__ == "__main__":
    main()
