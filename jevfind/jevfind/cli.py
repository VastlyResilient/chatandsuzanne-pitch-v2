"""Command-line interface for JevFind.

Commands:
    jevfind setup                 configure your Jev API key and folders
    jevfind add-folder <path>     add a folder to index
    jevfind index                 build/refresh the content index
    jevfind search "<description>"  find files matching a description
    jevfind gui                   launch the desktop window
    jevfind status                show index + config status
"""

from __future__ import annotations

import argparse
import getpass
import sys
from pathlib import Path

from . import __version__
from .config import get_api_key, load_config, save_config
from .indexer import build_index, index_stats
from .jevclient import JevAuthError, JevClient, JevError
from .reveal import open_file, reveal
from .search import search


def _client(cfg) -> JevClient:
    return JevClient(api_key=get_api_key(cfg), model=cfg.get("model", "jev-latest"))


def cmd_setup(_args) -> int:
    cfg = load_config()
    print("JevFind setup — your key is stored in ~/.jevfind/config.json (chmod 600),")
    print("never inside any project folder. You can also set JEV_API_KEY instead.\n")
    existing = "set" if get_api_key(cfg) else "not set"
    key = getpass.getpass(f"Paste your Jev API key (currently {existing}, blank to keep): ").strip()
    if key:
        cfg["api_key"] = key
    folder = input("Folder to search (blank to skip, add more later): ").strip()
    if folder:
        fp = str(Path(folder).expanduser())
        if fp not in cfg["roots"]:
            cfg["roots"].append(fp)
    save_config(cfg)
    print("\nSaved. Next: 'jevfind index' then 'jevfind search \"...\"'.")
    return 0


def cmd_add_folder(args) -> int:
    cfg = load_config()
    fp = str(Path(args.path).expanduser())
    if not Path(fp).exists():
        print(f"Warning: {fp} does not exist yet.")
    if fp not in cfg["roots"]:
        cfg["roots"].append(fp)
        save_config(cfg)
        print(f"Added folder: {fp}")
    else:
        print("Folder already added.")
    return 0


def cmd_index(_args) -> int:
    cfg = load_config()
    if not cfg["roots"]:
        print("No folders configured. Run 'jevfind setup' or 'jevfind add-folder <path>'.")
        return 1
    print("Indexing:", ", ".join(cfg["roots"]))

    def prog(path, done, total):
        if total:
            end = "\r" if done < total else "\n"
            print(f"  {done}/{total}  {Path(path).name[:50]:<50}", end=end, flush=True)

    stats = build_index(
        roots=cfg["roots"], extensions=cfg["extensions"], skip_dirs=cfg["skip_dirs"],
        char_cap=cfg["content_char_cap"], max_file_mb=cfg["max_file_mb"], progress=prog,
        reindex_all=_args.rebuild,
    )
    print(
        f"Done. {stats['indexed']} indexed, {stats['skipped']} unchanged, "
        f"{stats['errors']} unreadable, {stats['removed']} removed."
    )
    return 0


def cmd_search(args) -> int:
    cfg = load_config()
    try:
        client = _client(cfg)
    except JevAuthError as e:
        print(e)
        return 2
    st = index_stats()
    if st["searchable"] == 0:
        print("Index is empty. Run 'jevfind index' first.")
        return 1

    print(f"Searching {st['searchable']} files for: {args.description!r}"
          f"{' (deep)' if args.deep else ''} …")

    def prog(done, total):
        print(f"  asked Jev about {done}/{total}", end="\r", flush=True)

    try:
        results = search(
            args.description, client,
            candidate_limit=cfg["candidate_limit"], concurrency=cfg["concurrency"],
            min_score=args.min_score if args.min_score is not None else cfg["min_score"],
            deep=args.deep, progress=prog,
        )
    except JevError as e:
        print("\n", e)
        return 2
    print(" " * 40, end="\r")

    if not results:
        print("No confident matches. Try rephrasing, or add --deep for a wider search.")
        return 0

    top = results[: args.limit]
    print(f"\nTop {len(top)} match{'es' if len(top) != 1 else ''}:\n")
    for i, r in enumerate(top, 1):
        print(f"  {i}. [{r.score*100:5.1f}%]  {r.path}")
        if r.snippet:
            print(f"        … {r.snippet}")
    if args.open:
        open_file(top[0].path)
    elif args.reveal:
        reveal(top[0].path)
    return 0


def cmd_status(_args) -> int:
    cfg = load_config()
    st = index_stats()
    print(f"JevFind {__version__}")
    print("API key:", "set" if get_api_key(cfg) else "NOT set (run 'jevfind setup')")
    print("Model:", cfg.get("model"))
    print("Folders:", cfg["roots"] or "(none)")
    print(f"Indexed files: {st['total']}  (searchable: {st['searchable']})")
    return 0


def cmd_gui(_args) -> int:
    from .gui import run_gui
    return run_gui()


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="jevfind", description="Find files by describing them.")
    p.add_argument("--version", action="version", version=f"jevfind {__version__}")
    sub = p.add_subparsers(dest="command")

    sub.add_parser("setup", help="configure API key and folders").set_defaults(func=cmd_setup)

    af = sub.add_parser("add-folder", help="add a folder to index")
    af.add_argument("path")
    af.set_defaults(func=cmd_add_folder)

    idx = sub.add_parser("index", help="build/refresh the content index")
    idx.add_argument("--rebuild", action="store_true", help="re-extract every file")
    idx.set_defaults(func=cmd_index)

    se = sub.add_parser("search", help="find files by description")
    se.add_argument("description")
    se.add_argument("--limit", type=int, default=10)
    se.add_argument("--deep", action="store_true", help="ask Jev about every file (slower, wider)")
    se.add_argument("--min-score", type=float, default=None, help="hide matches below this 0-1 score")
    se.add_argument("--open", action="store_true", help="open the top match")
    se.add_argument("--reveal", action="store_true", help="reveal the top match in Finder/Explorer")
    se.set_defaults(func=cmd_search)

    sub.add_parser("status", help="show index and config status").set_defaults(func=cmd_status)
    sub.add_parser("gui", help="launch the desktop window").set_defaults(func=cmd_gui)
    return p


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if not getattr(args, "func", None):
        parser.print_help()
        return 0
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
