<p align="center">
  <img src="assets/icon_256.png" width="140" alt="JEV app icon"/>
</p>

# JEV

**Describe a file in plain English — find it on your Mac or Windows PC, even if you don't know its name.**

*(Package name is `jevfind`; the app is branded **JEV**.)*

You know the file exists. You just remember *what it's about* — "that PDF with the
sourdough recipe," "the letter about the roof warranty," "my Q3 budget with the
travel line items." macOS/Windows search makes you guess the filename or the exact
words inside. JevFind lets you describe it instead.

Under the hood it indexes the **contents** of your files and asks
[TypeSafe's Jev model](https://docs.typesafe.ai) a yes/no question for each
promising candidate — *"is this the file the person is describing?"* — then ranks
them by Jev's confidence. **The filename is never used** for the match, so a file
called `IMG_2231.pdf` still turns up when you describe what's inside it.

---

## How it works

```
Your folders ──▶ [1] Index contents ──▶ local SQLite cache (~/.jevfind/index.db)
                                              │
Your description ──▶ [2] Lexical pre-filter (local, no AI) ──▶ top candidates
                                              │
                     [3] Jev judges each candidate's CONTENT ──▶ ranked matches
                                              │
                     [4] Open / Reveal the winner in Finder or Explorer
```

- **Step 1 & 3 are the only smart parts, and only step 3 uses AI** — your Jev API
  key. No other AI service is contacted.
- **Step 2** is a fast local relevance filter (BM25-lite) so that even with
  thousands of files, only a handful of Jev calls are needed per search. Turn it
  off with **Deep** search when your wording doesn't overlap the file's wording.

> **Note on "computer use":** Jev is a *judgment* model — it reads text and returns
> a typed answer/probability. It does not itself drive your computer. JevFind does
> the computer part (scanning folders, reading files, opening Finder/Explorer) and
> uses Jev purely to decide *which* file matches your description.

---

## Make it a real app (JEV.app / JEV.exe)

Because a macOS `.app` can only be built on a Mac and a Windows `.exe` only on
Windows, you build the app once on your own machine — one double-click, custom
icon included:

1. Install [Python 3.10+](https://www.python.org/downloads/).
2. Download this `jevfind/` folder.
3. **Mac:** double-click **`Build JEV on Mac.command`** → produces **`dist/JEV.app`**.
   Drag it into your **Applications** folder.
   **Windows:** double-click **`Build JEV on Windows.bat`** → produces
   **`dist/JEV/JEV.exe`**. Right-click → *Send to → Desktop* for a shortcut.
4. Launch **JEV**, click **Add folder…**, **Update index**, then describe a file
   and hit **Search**.

> First launch on macOS: right-click **JEV.app → Open** once (it's unsigned, so
> Gatekeeper asks the first time). To ship it to others without that prompt
> you'd sign & notarize it with an Apple Developer ID — ask me and I'll add that.

## Or just run it (no build step)

1. Get a Jev API key from the [TypeSafe dashboard](https://console.typesafe.ai/keys).
2. **Mac:** double-click `run_mac.command`. **Windows:** double-click `run_windows.bat`.
   (First launch sets things up and opens the window.)
3. **Add folder…**, **Update index**, then search.

You'll be asked for your API key once; it's stored in `~/.jevfind/config.json`
(readable only by you) — **never inside this project folder**, so it can't be
committed to git.

### Rebuild / customize the icon

The icon is `assets/logo.svg`. Regenerate every format after editing it with:

```bash
pip install cairosvg Pillow
python assets/build_icons.py     # writes JEV.icns, JEV.ico, icon*.png
```

---

## Command line

```bash
# from the jevfind/ folder
python -m jevfind setup                      # store API key + a folder (interactive)
python -m jevfind add-folder ~/Documents     # add more folders
python -m jevfind index                      # build/refresh the content index
python -m jevfind search "recipe for baking bread"
python -m jevfind search "roof warranty letter" --reveal   # reveal the top hit
python -m jevfind search "budget with travel costs" --deep # wider, slower search
python -m jevfind status
```

Prefer an environment variable over the stored key? Set `JEV_API_KEY` (or
`TYPESAFE_API_KEY`) and JevFind will use it.

---

## Supported file types

Plain text, Markdown, CSV/TSV, JSON/YAML, HTML, and source code work out of the
box. For rich formats, install the optional readers:

```bash
pip install -r requirements.txt   # pypdf, python-docx, openpyxl, python-pptx, striprtf
```

| Type | Reader |
|------|--------|
| `.pdf` | pypdf |
| `.docx` | python-docx |
| `.xlsx` | openpyxl |
| `.pptx` | python-pptx |
| `.rtf` | striprtf (basic fallback works without it) |

A file type without its reader installed is simply skipped, not crashed on.

---

## Privacy & cost

- Only the **content preview** of candidate files (capped, default 6000 chars) is
  sent to Jev, and only for the files that pass the local pre-filter — not your
  whole disk on every search.
- Filenames and full paths are **not** sent to Jev.
- Everything else (the index, your key) stays on your machine.
- Each candidate is one Jev call; the local pre-filter keeps that number small.

## Security note

Keep your API key private. If you ever paste it somewhere shared (chat, email, a
screenshot), rotate it in the TypeSafe dashboard. JevFind stores it only in your
home folder with owner-only permissions and keeps it out of the repository via
`.gitignore`.

## Tuning

`~/.jevfind/config.json` holds adjustable settings: `candidate_limit`,
`content_char_cap`, `concurrency`, `min_score`, `max_file_mb`, and the list of
indexed `extensions` and skipped directories.
