"""Entry point for the packaged JEV desktop app (used by PyInstaller)."""

import sys

from jevfind.gui import run_gui

if __name__ == "__main__":
    sys.exit(run_gui())
