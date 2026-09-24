#!/bin/bash
# Double-click to start the Absolute Advisor on a Mac.
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Opening the download page: install the LTS version, then double-click this file again."
  open "https://nodejs.org/en/download"
  read -n 1 -s -r -p "Press any key to close."
  exit 1
fi
[ -d node_modules ] || npm install --no-audit --no-fund
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env. Paste your Anthropic API key into it, save, then double-click this file again."
  open -e .env
  read -n 1 -s -r -p "Press any key to close."
  exit 0
fi
PORT=$(grep -E '^PORT=' .env | cut -d= -f2); PORT=${PORT:-3000}
(sleep 1.5 && open "http://localhost:$PORT") &
node server.js
