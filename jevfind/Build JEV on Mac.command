#!/bin/bash
# Double-click to build JEV.app on your Mac.
# It creates a clean build environment, packages the app with your custom icon,
# and opens the folder containing JEV.app so you can drag it to Applications.
set -e
cd "$(dirname "$0")"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is required. Install it from https://www.python.org/downloads/ and re-run."
  read -r -p "Press Return to close."
  exit 1
fi

echo "Setting up build environment (first time takes a minute)…"
python3 -m venv .buildenv
./.buildenv/bin/python -m pip install --quiet --upgrade pip
./.buildenv/bin/python -m pip install --quiet pyinstaller -r requirements.txt

echo "Building JEV.app…"
./.buildenv/bin/pyinstaller --noconfirm JEV.spec

echo ""
echo "Done!  Your app is at:  dist/JEV.app"
echo "Drag JEV.app into your Applications folder to install it."
open dist 2>/dev/null || true
read -r -p "Press Return to close."
