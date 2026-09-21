"""Configuration and secure API-key handling for JevFind.

The Jev API key is NEVER stored in the project/repo. It is read from, in order:

  1. The ``JEV_API_KEY`` environment variable
  2. The ``TYPESAFE_API_KEY`` environment variable
  3. ``~/.jevfind/config.json`` (created locally by ``jevfind setup``)

The config directory lives in the user's home folder, well outside any git
repository, so the key cannot be accidentally committed.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any


# ~/.jevfind holds the local index and (optionally) the API key.
CONFIG_DIR = Path(os.environ.get("JEVFIND_HOME", str(Path.home() / ".jevfind")))
CONFIG_PATH = CONFIG_DIR / "config.json"
INDEX_PATH = CONFIG_DIR / "index.db"

DEFAULTS: dict[str, Any] = {
    "api_key": "",              # prefer the env var; kept here only for convenience
    "model": "jev-latest",
    "roots": [],                # folders to index
    "candidate_limit": 60,      # how many lexical candidates to send to Jev per search
    "content_char_cap": 6000,   # max characters of a file's content sent to Jev
    "max_file_mb": 40,          # skip files larger than this when indexing
    "concurrency": 8,           # parallel Jev requests during a search
    "min_score": 0.35,          # hide results Jev scores below this probability
    # File extensions we know how to read. Everything else is skipped.
    "extensions": [
        ".txt", ".md", ".markdown", ".rst", ".log", ".csv", ".tsv",
        ".json", ".yaml", ".yml", ".xml", ".html", ".htm",
        ".pdf", ".docx", ".doc", ".rtf", ".odt",
        ".xlsx", ".xls", ".ods", ".pptx", ".key",
        ".py", ".js", ".ts", ".java", ".c", ".cpp", ".go", ".rb", ".sh",
    ],
    # Directory names never worth indexing.
    "skip_dirs": [
        ".git", "node_modules", "__pycache__", ".venv", "venv", "env",
        "Library", "AppData", ".Trash", "$RECYCLE.BIN", ".cache",
        "site-packages", "dist-packages", ".npm", ".gradle", ".m2",
    ],
}


def ensure_config_dir() -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)


def load_config() -> dict[str, Any]:
    cfg = dict(DEFAULTS)
    if CONFIG_PATH.exists():
        try:
            cfg.update(json.loads(CONFIG_PATH.read_text(encoding="utf-8")))
        except (json.JSONDecodeError, OSError):
            pass
    return cfg


def save_config(cfg: dict[str, Any]) -> None:
    ensure_config_dir()
    CONFIG_PATH.write_text(json.dumps(cfg, indent=2), encoding="utf-8")
    # Keep the config (which may hold the key) readable only by the owner.
    try:
        os.chmod(CONFIG_PATH, 0o600)
    except OSError:
        pass


def get_api_key(cfg: dict[str, Any] | None = None) -> str:
    """Resolve the API key from env first, then config. Empty string if unset."""
    env = os.environ.get("JEV_API_KEY") or os.environ.get("TYPESAFE_API_KEY")
    if env:
        return env.strip()
    if cfg is None:
        cfg = load_config()
    return str(cfg.get("api_key", "") or "").strip()
