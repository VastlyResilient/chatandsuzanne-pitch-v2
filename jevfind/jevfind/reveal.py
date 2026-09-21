"""Reveal or open a found file in the native file manager (Finder / Explorer)."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


def reveal(path: str) -> None:
    """Show the file selected/highlighted in the OS file manager."""
    p = str(Path(path))
    if sys.platform == "darwin":
        subprocess.run(["open", "-R", p], check=False)
    elif os.name == "nt":
        # /select, must be one argument joined to the path
        subprocess.run(f'explorer /select,"{p}"', check=False, shell=True)
    else:
        subprocess.run(["xdg-open", str(Path(p).parent)], check=False)


def open_file(path: str) -> None:
    """Open the file with its default application."""
    p = str(Path(path))
    if sys.platform == "darwin":
        subprocess.run(["open", p], check=False)
    elif os.name == "nt":
        os.startfile(p)  # type: ignore[attr-defined]
    else:
        subprocess.run(["xdg-open", p], check=False)
