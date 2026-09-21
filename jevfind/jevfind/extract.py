"""Extract readable text from a file so Jev can judge what it is *about*.

Plain-text formats are read directly. Rich formats (PDF, Word, Excel,
PowerPoint, RTF) use optional third-party libraries; if a library is not
installed, that file type is simply skipped (with the reason available to the
caller) rather than crashing the whole index.

Nothing here sends the *filename* anywhere — only the content is extracted,
honoring the goal of finding files by what they contain, not what they're named.
"""

from __future__ import annotations

import html
import re
from pathlib import Path


# --- optional dependency probes (imported lazily so absence is non-fatal) ---

def _has(mod: str) -> bool:
    try:
        __import__(mod)
        return True
    except Exception:
        return False


TEXT_EXTS = {
    ".txt", ".md", ".markdown", ".rst", ".log", ".csv", ".tsv",
    ".json", ".yaml", ".yml", ".xml", ".py", ".js", ".ts", ".java",
    ".c", ".cpp", ".h", ".go", ".rb", ".sh", ".ini", ".cfg", ".toml",
}
HTML_EXTS = {".html", ".htm"}


def extract_text(path: Path, char_cap: int = 6000) -> tuple[str, str | None]:
    """Return ``(text, error)``. ``error`` is None on success.

    ``text`` is a content preview capped at ``char_cap`` characters, built from
    the head of the document plus a couple of interior samples so topics buried
    deeper in a long file can still be matched.
    """
    ext = path.suffix.lower()
    try:
        if ext in TEXT_EXTS:
            raw = _read_text(path)
        elif ext in HTML_EXTS:
            raw = _strip_html(_read_text(path))
        elif ext == ".pdf":
            raw = _read_pdf(path)
        elif ext == ".docx":
            raw = _read_docx(path)
        elif ext in (".xlsx",):
            raw = _read_xlsx(path)
        elif ext == ".pptx":
            raw = _read_pptx(path)
        elif ext == ".rtf":
            raw = _read_rtf(path)
        else:
            return "", f"unsupported type {ext}"
    except MissingDependency as exc:
        return "", str(exc)
    except BaseException as exc:  # never let one bad file (or native panic) break indexing
        return "", f"{type(exc).__name__}: {exc}"

    text = _condense(raw, char_cap)
    if not text.strip():
        return "", "no extractable text"
    return text, None


class MissingDependency(RuntimeError):
    pass


def _read_text(path: Path) -> str:
    data = path.read_bytes()
    for enc in ("utf-8", "utf-16", "latin-1"):
        try:
            return data.decode(enc)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", "replace")


def _strip_html(raw: str) -> str:
    raw = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", raw)
    raw = re.sub(r"(?s)<[^>]+>", " ", raw)
    return html.unescape(raw)


def _read_pdf(path: Path) -> str:
    try:
        from pypdf import PdfReader  # type: ignore
    except BaseException:  # missing, or a broken native build
        raise MissingDependency("install 'pypdf' to read PDFs")
    reader = PdfReader(str(path))
    parts = []
    for page in reader.pages[:40]:  # cap pages for speed
        try:
            parts.append(page.extract_text() or "")
        except Exception:
            continue
    return "\n".join(parts)


def _read_docx(path: Path) -> str:
    try:
        import docx  # type: ignore  (python-docx)
    except BaseException:
        raise MissingDependency("install 'python-docx' to read .docx files")
    doc = docx.Document(str(path))
    parts = [p.text for p in doc.paragraphs]
    for table in doc.tables:
        for row in table.rows:
            parts.append(" ".join(c.text for c in row.cells))
    return "\n".join(parts)


def _read_xlsx(path: Path) -> str:
    try:
        import openpyxl  # type: ignore
    except BaseException:
        raise MissingDependency("install 'openpyxl' to read .xlsx files")
    wb = openpyxl.load_workbook(str(path), read_only=True, data_only=True)
    parts = []
    for ws in wb.worksheets:
        parts.append(str(ws.title))
        for i, row in enumerate(ws.iter_rows(values_only=True)):
            if i > 500:
                break
            parts.append(" ".join("" if v is None else str(v) for v in row))
    wb.close()
    return "\n".join(parts)


def _read_pptx(path: Path) -> str:
    try:
        from pptx import Presentation  # type: ignore  (python-pptx)
    except BaseException:
        raise MissingDependency("install 'python-pptx' to read .pptx files")
    prs = Presentation(str(path))
    parts = []
    for slide in prs.slides:
        for shape in slide.shapes:
            if shape.has_text_frame:
                parts.append(shape.text_frame.text)
    return "\n".join(parts)


def _read_rtf(path: Path) -> str:
    raw = _read_text(path)
    try:
        from striprtf.striprtf import rtf_to_text  # type: ignore
        return rtf_to_text(raw)
    except Exception:
        # crude fallback: drop control words and braces
        return re.sub(r"\\[a-zA-Z]+-?\d* ?|[{}]", " ", raw)


def _condense(raw: str, char_cap: int) -> str:
    raw = re.sub(r"[ \t]+", " ", raw)
    raw = re.sub(r"\n{3,}", "\n\n", raw).strip()
    if len(raw) <= char_cap:
        return raw
    head = raw[: int(char_cap * 0.6)]
    # sample from the middle and near the end so buried topics survive the cap
    mid_start = len(raw) // 2
    mid = raw[mid_start : mid_start + int(char_cap * 0.25)]
    tail = raw[-int(char_cap * 0.15):]
    return f"{head}\n…\n{mid}\n…\n{tail}"
