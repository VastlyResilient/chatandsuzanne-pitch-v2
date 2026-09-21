"""Locate bundled resources (the app icon) whether running from source or from a
PyInstaller/py2app one-file/one-dir app bundle."""

from __future__ import annotations

import sys
from pathlib import Path

APP_NAME = "JEV"


def _candidates(filename: str) -> list[Path]:
    here = Path(__file__).resolve().parent
    paths = [
        here.parent / "assets" / filename,          # running from source: jevfind/assets/
        here / "assets" / filename,                  # assets shipped inside the package
    ]
    # PyInstaller unpacks data files under sys._MEIPASS
    meipass = getattr(sys, "_MEIPASS", None)
    if meipass:
        paths.insert(0, Path(meipass) / "assets" / filename)
        paths.insert(1, Path(meipass) / filename)
    return paths


def resource_path(filename: str) -> str | None:
    for p in _candidates(filename):
        if p.exists():
            return str(p)
    return None


def icon_png() -> str | None:
    return resource_path("icon.png")
