"""A simple cross-platform desktop window for JevFind (Tkinter, stdlib only).

Describe the file you're looking for, press Search, and Jev ranks your files by
how well their *contents* match — then open or reveal the winner in
Finder/Explorer. Long-running work (indexing, searching) runs on background
threads so the window stays responsive.
"""

from __future__ import annotations

import queue
import threading
from pathlib import Path

from .config import get_api_key, load_config, save_config
from .indexer import build_index, index_stats
from .jevclient import JevAuthError, JevClient, JevError
from .reveal import open_file, reveal
from .search import Result, search


def run_gui() -> int:
    try:
        import tkinter as tk
        from tkinter import filedialog, messagebox, ttk, simpledialog
    except Exception as exc:  # headless / no Tk
        print(f"Could not start the desktop window ({exc}). Use the CLI instead:")
        print("  python -m jevfind search \"...\"")
        return 1

    from .resources import icon_png

    cfg = load_config()
    ui_queue: "queue.Queue[tuple]" = queue.Queue()

    root = tk.Tk()
    root.title("JEV — describe a file, find it")
    root.geometry("880x620")
    root.minsize(720, 480)

    # App icon in the title bar / dock (best effort; PNG needs Tk 8.6+).
    try:
        _ico = icon_png()
        if _ico:
            root._jev_icon = tk.PhotoImage(file=_ico)  # keep a reference
            root.iconphoto(True, root._jev_icon)
    except Exception:
        pass

    results: list[Result] = []

    # ---- helpers to talk to the UI thread from workers ----
    def post(kind, *payload):
        ui_queue.put((kind, payload))

    def ensure_key() -> str | None:
        key = get_api_key(cfg)
        if key:
            return key
        key = simpledialog.askstring(
            "Jev API key",
            "Paste your Jev API key (stored in ~/.jevfind/config.json, chmod 600):",
            show="*",
        )
        if key:
            cfg["api_key"] = key.strip()
            save_config(cfg)
            return cfg["api_key"]
        return None

    # ---- top: folders ----
    top = ttk.Frame(root, padding=10)
    top.pack(fill="x")
    ttk.Label(top, text="Folders to search:").pack(side="left")
    folders_var = tk.StringVar(value=_folders_label(cfg))
    ttk.Label(top, textvariable=folders_var, foreground="#555").pack(side="left", padx=8)

    def add_folder():
        d = filedialog.askdirectory(title="Choose a folder to search")
        if d and d not in cfg["roots"]:
            cfg["roots"].append(d)
            save_config(cfg)
            folders_var.set(_folders_label(cfg))

    def clear_folders():
        cfg["roots"] = []
        save_config(cfg)
        folders_var.set(_folders_label(cfg))

    ttk.Button(top, text="Add folder…", command=add_folder).pack(side="right")
    ttk.Button(top, text="Clear", command=clear_folders).pack(side="right", padx=6)

    # ---- index row ----
    idx_row = ttk.Frame(root, padding=(10, 0))
    idx_row.pack(fill="x")
    index_status = tk.StringVar(value=_index_label())
    ttk.Label(idx_row, textvariable=index_status, foreground="#555").pack(side="left")

    def do_index(rebuild=False):
        if not cfg["roots"]:
            messagebox.showinfo("JevFind", "Add at least one folder first.")
            return
        set_busy(True, "Indexing…")

        def worker():
            def prog(path, done, total):
                post("index_prog", done, total)
            stats = build_index(
                roots=cfg["roots"], extensions=cfg["extensions"], skip_dirs=cfg["skip_dirs"],
                char_cap=cfg["content_char_cap"], max_file_mb=cfg["max_file_mb"],
                progress=prog, reindex_all=rebuild,
            )
            post("index_done", stats)

        threading.Thread(target=worker, daemon=True).start()

    ttk.Button(idx_row, text="Rebuild index", command=lambda: do_index(True)).pack(side="right")
    ttk.Button(idx_row, text="Update index", command=lambda: do_index(False)).pack(side="right", padx=6)

    # ---- search row ----
    search_row = ttk.Frame(root, padding=10)
    search_row.pack(fill="x")
    query_var = tk.StringVar()
    entry = ttk.Entry(search_row, textvariable=query_var, font=("", 13))
    entry.pack(side="left", fill="x", expand=True)
    entry.focus()
    deep_var = tk.BooleanVar(value=False)
    ttk.Checkbutton(search_row, text="Deep", variable=deep_var).pack(side="left", padx=8)

    def do_search():
        desc = query_var.get().strip()
        if not desc:
            return
        key = ensure_key()
        if not key:
            return
        if index_stats()["searchable"] == 0:
            messagebox.showinfo("JevFind", "Index is empty. Add a folder and index first.")
            return
        set_busy(True, "Asking Jev…")
        tree.delete(*tree.get_children())
        results.clear()

        def worker():
            try:
                client = JevClient(api_key=key, model=cfg.get("model", "jev-latest"))
                def prog(done, total):
                    post("search_prog", done, total)
                res = search(
                    desc, client, candidate_limit=cfg["candidate_limit"],
                    concurrency=cfg["concurrency"], min_score=cfg["min_score"],
                    deep=deep_var.get(), progress=prog,
                )
                post("search_done", res)
            except (JevAuthError, JevError) as e:
                post("error", str(e))

        threading.Thread(target=worker, daemon=True).start()

    ttk.Button(search_row, text="Search", command=do_search).pack(side="left", padx=6)
    entry.bind("<Return>", lambda _e: do_search())

    # ---- results ----
    mid = ttk.Frame(root, padding=(10, 0))
    mid.pack(fill="both", expand=True)
    cols = ("score", "file")
    tree = ttk.Treeview(mid, columns=cols, show="headings", selectmode="browse")
    tree.heading("score", text="Match")
    tree.heading("file", text="File")
    tree.column("score", width=80, anchor="center", stretch=False)
    tree.column("file", width=680)
    tree.pack(side="left", fill="both", expand=True)
    sb = ttk.Scrollbar(mid, orient="vertical", command=tree.yview)
    sb.pack(side="right", fill="y")
    tree.configure(yscrollcommand=sb.set)

    snippet_var = tk.StringVar(value="")
    ttk.Label(root, textvariable=snippet_var, foreground="#444", padding=(12, 4),
              wraplength=820, justify="left").pack(fill="x")

    def on_select(_e=None):
        sel = tree.selection()
        if not sel:
            return
        i = int(sel[0])
        snippet_var.set(results[i].snippet)

    tree.bind("<<TreeviewSelect>>", on_select)

    def selected_path() -> str | None:
        sel = tree.selection()
        return results[int(sel[0])].path if sel else None

    def do_open():
        p = selected_path()
        if p:
            open_file(p)

    def do_reveal():
        p = selected_path()
        if p:
            reveal(p)

    tree.bind("<Double-1>", lambda _e: do_reveal())

    # ---- bottom bar ----
    bottom = ttk.Frame(root, padding=10)
    bottom.pack(fill="x")
    status_var = tk.StringVar(value=("Ready." if get_api_key(cfg)
                                     else "No API key yet — you'll be asked on first search."))
    ttk.Label(bottom, textvariable=status_var).pack(side="left")
    ttk.Button(bottom, text="Reveal in Finder/Explorer", command=do_reveal).pack(side="right")
    ttk.Button(bottom, text="Open", command=do_open).pack(side="right", padx=6)

    busy = {"on": False}

    def set_busy(on: bool, msg: str = ""):
        busy["on"] = on
        if msg:
            status_var.set(msg)
        root.config(cursor="watch" if on else "")

    # ---- pump worker messages onto the UI thread ----
    def pump():
        try:
            while True:
                kind, payload = ui_queue.get_nowait()
                if kind == "index_prog":
                    done, total = payload
                    status_var.set(f"Indexing… {done}/{total}")
                elif kind == "index_done":
                    stats = payload[0]
                    index_status.set(_index_label())
                    status_var.set(
                        f"Indexed {stats['indexed']}, {stats['skipped']} unchanged, "
                        f"{stats['errors']} unreadable."
                    )
                    set_busy(False)
                elif kind == "search_prog":
                    done, total = payload
                    status_var.set(f"Asking Jev… {done}/{total}")
                elif kind == "search_done":
                    res = payload[0]
                    results.extend(res)
                    for i, r in enumerate(res):
                        tree.insert("", "end", iid=str(i),
                                    values=(f"{r.score*100:.0f}%", r.path))
                    status_var.set(
                        f"{len(res)} match{'es' if len(res) != 1 else ''}."
                        if res else "No confident matches — try 'Deep' or rephrase."
                    )
                    if res:
                        tree.selection_set("0")
                        on_select()
                    set_busy(False)
                elif kind == "error":
                    set_busy(False)
                    messagebox.showerror("JevFind", payload[0])
                    status_var.set("Error.")
        except queue.Empty:
            pass
        root.after(80, pump)

    root.after(80, pump)
    root.mainloop()
    return 0


def _folders_label(cfg) -> str:
    if not cfg["roots"]:
        return "(none — add one)"
    names = [Path(r).name or r for r in cfg["roots"]]
    return ", ".join(names[:4]) + (" …" if len(names) > 4 else "")


def _index_label() -> str:
    st = index_stats()
    return f"Index: {st['searchable']} searchable / {st['total']} files"
