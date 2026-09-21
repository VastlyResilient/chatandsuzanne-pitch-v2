"""Search: turn a plain-English description into ranked file matches.

Two stages, matching TypeSafe's "retrieve candidates, then judge" pattern:

  1. Local pre-filter (no AI): a BM25-lite lexical score over the indexed
     content picks the most promising candidate files. This keeps the number of
     Jev calls small even when you have thousands of files.
  2. Jev judgment: each candidate's *content* is sent to Jev with a yes/no
     (Noul) question — "is this what the person is describing?" — and results
     are ranked by Jev's probability. The filename is never sent.

Deep mode skips the lexical pre-filter and asks Jev about every indexed file
(up to a safety cap) for maximum recall when the words you use don't overlap
the words in the file.
"""

from __future__ import annotations

import math
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import Callable

from .indexer import load_documents, tokenize
from .jevclient import JevClient


@dataclass
class Result:
    path: str
    score: float          # Jev probability 0.0–1.0
    snippet: str
    lexical_rank: int


def _bm25lite_candidates(
    description: str, docs: list[tuple[str, str, str]], limit: int
) -> list[tuple[str, str]]:
    """Return up to ``limit`` (path, text) candidates by lexical relevance."""
    q_tokens = set(tokenize(description))
    if not q_tokens:
        return [(p, t) for p, t, _ in docs][:limit]

    n = len(docs)
    df: dict[str, int] = {}
    doc_tokens: list[set[str]] = []
    for _p, _t, toks in docs:
        s = set(toks.split()) if toks else set()
        doc_tokens.append(s)
        for term in q_tokens & s:
            df[term] = df.get(term, 0) + 1

    scored: list[tuple[float, str, str]] = []
    for (path, text, _toks), s in zip(docs, doc_tokens):
        score = 0.0
        for term in q_tokens & s:
            idf = math.log(1 + (n - df[term] + 0.5) / (df[term] + 0.5))
            score += idf
        if score > 0:
            scored.append((score, path, text))

    scored.sort(key=lambda x: x[0], reverse=True)
    if not scored:
        # no lexical overlap at all — fall back to a slice so Jev still gets a look
        return [(p, t) for p, t, _ in docs][:limit]
    return [(p, t) for _s, p, t in scored[:limit]]


def _snippet(text: str, description: str, width: int = 220) -> str:
    q = set(tokenize(description))
    best_pos, best_hits = 0, -1
    words = text.split()
    for i in range(0, max(1, len(words)), 12):
        window = words[i : i + 40]
        hits = sum(1 for w in window if w.lower().strip(".,;:!?") in q)
        if hits > best_hits:
            best_hits, best_pos = hits, i
    snip = " ".join(words[best_pos : best_pos + 40])
    snip = snip.strip()
    return (snip[:width] + "…") if len(snip) > width else snip


def search(
    description: str,
    client: JevClient,
    candidate_limit: int = 60,
    concurrency: int = 8,
    min_score: float = 0.35,
    deep: bool = False,
    deep_cap: int = 400,
    progress: Callable[[int, int], None] | None = None,
) -> list[Result]:
    docs = load_documents(only_with_text=True)
    if not docs:
        return []

    if deep:
        candidates = [(p, t) for p, t, _ in docs][:deep_cap]
    else:
        candidates = _bm25lite_candidates(description, docs, candidate_limit)

    question = (
        "Based only on what this document is about, is it the file the person "
        "is looking for? They describe it as: " + description.strip()
    )
    criteria = {
        "true": "The document's subject/content clearly matches the description",
        "false": "The document is about something else",
    }

    results: list[Result] = []
    total = len(candidates)
    done = 0

    def judge(idx_path_text: tuple[int, str, str]) -> Result | None:
        idx, path, text = idx_path_text
        try:
            prob = client.noul(text, question, criteria)
        except Exception:
            return None
        return Result(path=path, score=prob, snippet=_snippet(text, description),
                      lexical_rank=idx)

    work = [(i, p, t) for i, (p, t) in enumerate(candidates)]
    with ThreadPoolExecutor(max_workers=max(1, concurrency)) as pool:
        futures = [pool.submit(judge, item) for item in work]
        for fut in as_completed(futures):
            done += 1
            if progress:
                progress(done, total)
            r = fut.result()
            if r and r.score >= min_score:
                results.append(r)

    results.sort(key=lambda r: r.score, reverse=True)
    return results
