"""Render the JEV logo (assets/logo.svg) into every app-icon format.

Run:  python assets/build_icons.py
Outputs (into assets/):
  icon_16..1024.png, icon.png (512, used by the desktop window),
  JEV.ico (Windows), JEV.icns (macOS).

Requires: cairosvg, Pillow  (pip install cairosvg Pillow)
"""

from __future__ import annotations

import io
from pathlib import Path

import cairosvg
from PIL import Image

HERE = Path(__file__).resolve().parent
SVG = HERE / "logo.svg"
SIZES = [16, 32, 64, 128, 256, 512, 1024]


def render(size: int) -> Image.Image:
    png = cairosvg.svg2png(url=str(SVG), output_width=size, output_height=size)
    return Image.open(io.BytesIO(png)).convert("RGBA")


def main() -> None:
    imgs = {s: render(s) for s in SIZES}
    for s, im in imgs.items():
        im.save(HERE / f"icon_{s}.png")
    imgs[512].save(HERE / "icon.png")

    # Windows .ico (multiple embedded sizes)
    imgs[256].save(
        HERE / "JEV.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )

    # macOS .icns
    try:
        imgs[1024].save(HERE / "JEV.icns", format="ICNS")
    except Exception as exc:  # pragma: no cover - platform dependent
        print(f"ICNS via Pillow failed ({exc}); writing an .iconset folder instead.")
        _iconset(imgs)

    print("Icons written to", HERE)


def _iconset(imgs: dict[int, Image.Image]) -> None:
    """Fallback: a macOS .iconset folder (turn into .icns with:
    iconutil -c icns assets/JEV.iconset)."""
    out = HERE / "JEV.iconset"
    out.mkdir(exist_ok=True)
    mapping = {
        16: ["icon_16x16.png"], 32: ["icon_16x16@2x.png", "icon_32x32.png"],
        64: ["icon_32x32@2x.png"], 128: ["icon_128x128.png"],
        256: ["icon_128x128@2x.png", "icon_256x256.png"],
        512: ["icon_256x256@2x.png", "icon_512x512.png"],
        1024: ["icon_512x512@2x.png"],
    }
    for s, names in mapping.items():
        for n in names:
            imgs[s].save(out / n)


if __name__ == "__main__":
    main()
