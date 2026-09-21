"""Walk chosen folders, extract file contents, and cache them in a local SQLite
index. Re-indexing is incremental: unchanged files (same size + mtime) are
skipped, so keeping the index fresh is cheap.
"""

from __future__ import annotations

import re
import sqlite3
import time
from pathlib import Path
from typing import Callable, Iterable, Iterator

from .config import INDEX_PATH, ensure_config_dir
from .extract import extract_text


_WORD_RE = re.compile(r"[a-z0-9]{2,}")


def tokenize(text: str) -> list[str]:
    return _WORD_RE.findall(text.lower())


def _connect() -> sqlite3.Connection:
    ensure_config_dir()
    conn = sqlite3.connect(str(INDEX_PATH))
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS files (
            path       TEXT PRIMARY KEY,
            mtime      REAL,
            size       INTEGER,
            ext        TEXT,
            text       TEXT,
            tokens     TEXT,
            indexed_at REAL,
            error      TEXT
        )
        """
    )
    conn.execute("CREATE INDEX IF NOT EXISTS idx_ext ON files(ext)")
    return conn


def _iter_files(
    roots: Iterable[str], exts: set[str], skip_dirs: set[str], max_bytes: int
) -> Iterator[Path]:
    for root in roots:
        base = Path(root).expanduser()
        if not base.exists():
            continue
        for p in base.rglob("*"):
            try:
                if p.is_dir():
                    continue
                # skip anything under an excluded directory or a hidden dir
                parts = set(p.parts)
                if parts & skip_dirs:
                    continue
                if any(part.startswith(".") and part not in (".",) for part in p.parts[len(base.parts):]):
                    continue
                if p.suffix.lower() not in exts:
                    continue
                if p.stat().st_size > max_bytes:
                    continue
            except OSError:
                continue
            yield p


def build_index(
    roots: list[str],
    extensions: list[str],
    skip_dirs: list[str],
    char_cap: int,
    max_file_mb: int,
    progress: Callable[[str, int, int], None] | None = None,
    reindex_all: bool = False,
) -> dict[str, int]:
    """Build/refresh the index. Returns counts. ``progress(path, done, total)``
    is called as files are processed (total is 0 until known)."""
    exts = {e.lower() for e in extensions}
    skip = set(skip_dirs)
    max_bytes = max_file_mb * 1024 * 1024

    conn = _connect()
    known: dict[str, tuple[float, int]] = {}
    for path, mtime, size in conn.execute("SELECT path, mtime, size FROM files"):
        known[path] = (mtime, size)

    files = list(_iter_files(roots, exts, skip, max_bytes))
    total = len(files)
    stats = {"total": total, "indexed": 0, "skipped": 0, "errors": 0, "removed": 0}
    seen: set[str] = set()

    for i, p in enumerate(files, 1):
        sp = str(p)
        seen.add(sp)
        try:
            st = p.stat()
        except OSError:
            continue
        if progress:
            progress(sp, i, total)
        if not reindex_all and sp in known:
            kmtime, ksize = known[sp]
            if abs(kmtime - st.st_mtime) < 1e-6 and ksize == st.st_size:
                stats["skipped"] += 1
                continue

        text, err = extract_text(p, char_cap)
        toks = " ".join(sorted(set(tokenize(text)))) if text else ""
        conn.execute(
            "REPLACE INTO files(path, mtime, size, ext, text, tokens, indexed_at, error)"
            " VALUES(?,?,?,?,?,?,?,?)",
            (sp, st.st_mtime, st.st_size, p.suffix.lower(), text, toks, time.time(), err),
        )
        if err:
            stats["errors"] += 1
        else:
            stats["indexed"] += 1
        if i % 50 == 0:
            conn.commit()

    # drop entries whose files no longer exist under the current roots
    for old in list(known):
        if old not in seen and _under_roots(old, roots):
            conn.execute("DELETE FROM files WHERE path=?", (old,))
            stats["removed"] += 1

    conn.commit()
    conn.close()
    return stats


def _under_roots(path: str, roots: list[str]) -> bool:
    pp = Path(path)
    for r in roots:
        try:
            pp.relative_to(Path(r).expanduser())
            return True
        except ValueError:
            continue
    return False


def load_documents(only_with_text: bool = True) -> list[tuple[str, str, str]]:
    """Return ``[(path, text, tokens), ...]`` from the index."""
    conn = _connect()
    q = "SELECT path, text, tokens FROM files"
    if only_with_text:
        q += " WHERE text IS NOT NULL AND text != ''"
    rows = conn.execute(q).fetchall()
    conn.close()
    return rows


def index_stats() -> dict[str, int]:
    conn = _connect()
    total = conn.execute("SELECT COUNT(*) FROM files").fetchone()[0]
    with_text = conn.execute(
        "SELECT COUNT(*) FROM files WHERE text IS NOT NULL AND text != ''"
    ).fetchone()[0]
    conn.close()
    return {"total": total, "searchable": with_text}
