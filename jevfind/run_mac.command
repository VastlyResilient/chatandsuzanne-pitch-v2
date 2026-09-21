#!/bin/bash
# Double-click this file on a Mac to launch JevFind.
# It creates a local Python environment on first run, installs the optional
# file readers, and opens the desktop window.
set -e
cd "$(dirname "$0")"

PY="$(command -v python3 || true)"
if [ -z "$PY" ]; then
  echo "Python 3 is required. Install it from https://www.python.org/downloads/ and try again."
  read -r -p "Press Return to close."
  exit 1
fi

if [ ! -d ".venv" ]; then
  echo "First-time setup: creating environment…"
  "$PY" -m venv .venv
  ./.venv/bin/python -m pip install --quiet --upgrade pip
  ./.venv/bin/python -m pip install --quiet -r requirements.txt || true
fi

# JEV_API_KEY may be set here or you'll be prompted once (stored in ~/.jevfind).
exec ./.venv/bin/python -m jevfind gui
