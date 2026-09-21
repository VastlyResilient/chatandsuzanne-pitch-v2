"""Minimal Jev (TypeSafe System One) API client using only the standard library.

Endpoint contract (https://docs.typesafe.ai/api):

    POST https://api.typesafe.ai/v1/systemone
    Authorization: Bearer <API_KEY>
    Content-Type: application/json

    { "state": <str|obj|list>, "model": "jev-latest",
      "questions": { "<id>": {"type": "noul"|"choice"|"score", ...} } }

Only ``urllib`` is used so the tool has no third-party dependency for the part
that touches the network. TLS uses the system trust store (or ``SSL_CERT_FILE``
if set, which Python honors automatically).
"""

from __future__ import annotations

import json
import ssl
import time
import urllib.error
import urllib.request
from typing import Any


API_URL = "https://api.typesafe.ai/v1/systemone"


class JevError(RuntimeError):
    """Raised when the Jev API returns an error or cannot be reached."""


class JevAuthError(JevError):
    """Raised specifically on 401/403 — usually a bad or revoked API key."""


class JevClient:
    def __init__(
        self,
        api_key: str,
        model: str = "jev-latest",
        url: str = API_URL,
        timeout: float = 45.0,
        max_retries: int = 3,
    ) -> None:
        if not api_key:
            raise JevAuthError(
                "No Jev API key set. Run 'jevfind setup' or set JEV_API_KEY."
            )
        self.api_key = api_key
        self.model = model
        self.url = url
        self.timeout = timeout
        self.max_retries = max_retries
        # Default context uses the system CA store; SSL_CERT_FILE overrides it.
        self._ctx = ssl.create_default_context()

    def system_one(
        self, state: Any, questions: dict[str, dict[str, Any]]
    ) -> dict[str, Any]:
        """Send one evaluation request and return the parsed JSON response."""
        payload = json.dumps(
            {"state": state, "model": self.model, "questions": questions}
        ).encode("utf-8")

        last_err: Exception | None = None
        for attempt in range(self.max_retries + 1):
            req = urllib.request.Request(self.url, data=payload, method="POST")
            req.add_header("Authorization", f"Bearer {self.api_key}")
            req.add_header("Content-Type", "application/json")
            try:
                with urllib.request.urlopen(
                    req, timeout=self.timeout, context=self._ctx
                ) as resp:
                    return json.loads(resp.read().decode("utf-8"))
            except urllib.error.HTTPError as exc:
                body = _safe_read(exc)
                if exc.code in (401, 403):
                    raise JevAuthError(f"Auth failed ({exc.code}): {body}") from exc
                # Retry on rate limits and transient server errors.
                if exc.code in (429, 500, 502, 503, 504) and attempt < self.max_retries:
                    time.sleep(_backoff(attempt, exc))
                    last_err = JevError(f"HTTP {exc.code}: {body}")
                    continue
                raise JevError(f"HTTP {exc.code}: {body}") from exc
            except (urllib.error.URLError, TimeoutError, ssl.SSLError) as exc:
                if attempt < self.max_retries:
                    time.sleep(_backoff(attempt))
                    last_err = exc
                    continue
                raise JevError(f"Could not reach Jev API: {exc}") from exc
        raise JevError(f"Jev API failed after retries: {last_err}")

    def noul(
        self,
        state: Any,
        question: str,
        criteria: dict[str, str] | None = None,
        key: str = "match",
    ) -> float:
        """Ask a single yes/no question and return the probability (0.0–1.0)."""
        q: dict[str, Any] = {"type": "noul", "instructions": question}
        if criteria:
            q["criteria"] = criteria
        resp = self.system_one(state, {key: q})
        ans = resp.get("answers", {}).get(key, {})
        val = ans.get("noul")
        return float(val) if val is not None else 0.0


def _safe_read(exc: urllib.error.HTTPError) -> str:
    try:
        return exc.read().decode("utf-8", "replace")[:500]
    except Exception:
        return "<no body>"


def _backoff(attempt: int, exc: urllib.error.HTTPError | None = None) -> float:
    # Honor Retry-After when the server provides it, else exponential backoff.
    if exc is not None:
        retry_after = exc.headers.get("Retry-After") if exc.headers else None
        if retry_after and retry_after.isdigit():
            return min(float(retry_after), 30.0)
    return min(2.0 ** attempt, 16.0)
