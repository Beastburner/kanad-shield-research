"""Statute & judgment retrieval interface (the RAG layer).

The clean seam: `retrieve_statutes()` returns the top-k statute chunks for a
query. The default implementation uses Postgres full-text / ILIKE keyword match
so the classification slice is callable WITHOUT a wired embedding model.

To upgrade to true semantic search, implement `embed()` (e.g. via a
sentence-transformers model or an embedding API), populate statute_chunks.embedding,
and switch retrieve_statutes() to the vector query shown in `_vector_search`.
The agent code never changes — it only consumes the returned chunks."""

import re
from typing import Any

import httpx

from ..config import settings
from ..db import pool

_IK_BASE = "https://api.indiankanoon.org"

# words too generic to help ranking (would match unrelated statute boilerplate)
_STOPish = {"the", "and", "for", "with", "from", "out", "any", "person",
            "property", "committed", "punishable", "imprisonment"}


def _or_tsquery(query: str) -> str:
    """Build an OR tsquery from free text. plainto_tsquery ANDs every term, so a
    noisy query (names, places) matches nothing; OR lets a single salient word
    like 'theft' surface the right section."""
    terms = [w for w in re.findall(r"[a-zA-Z]{3,}", query.lower())
             if w not in _STOPish]
    return " | ".join(dict.fromkeys(terms))  # de-dup, preserve order


async def embed(text: str) -> list[float] | None:
    """Embedding hook. Returns None until a real model is wired.

    Wire a 384-dim embedder here (matching schema.sql vector(384)) to enable
    semantic retrieval. Left as a stub deliberately per build scope."""
    return None


async def retrieve_statutes(query: str, k: int = 6) -> list[dict[str, Any]]:
    """Top-k BNS/BNSS/BSA statute chunks relevant to `query`.

    Tries vector search if an embedding is available, else keyword search."""
    vec = await embed(query)
    if vec is not None:
        return await _vector_search(vec, k)
    return await _keyword_search(query, k)


async def _vector_search(vec: list[float], k: int) -> list[dict[str, Any]]:
    rows = await pool().fetch(
        """
        SELECT id, code, section_no, heading, text, old_code_ref
        FROM statute_chunks
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> $1::vector
        LIMIT $2
        """,
        vec,
        k,
    )
    return [dict(r) for r in rows]


async def _keyword_search(query: str, k: int) -> list[dict[str, Any]]:
    # OR-match over heading+text, returning ONLY chunks that actually match (the
    # @@ filter) so we never fall back to arbitrary section-number ordering.
    tsq = _or_tsquery(query)
    if not tsq:
        return []
    rows = await pool().fetch(
        """
        SELECT id, code, section_no, heading, text, old_code_ref,
               ts_rank(to_tsvector('english',
                          heading || ' ' || text || ' ' || coalesce(keywords,'')),
                       to_tsquery('english', $1)) AS rank
        FROM statute_chunks
        WHERE to_tsvector('english',
                  heading || ' ' || text || ' ' || coalesce(keywords,''))
              @@ to_tsquery('english', $1)
        ORDER BY rank DESC
        LIMIT $2
        """,
        tsq,
        k,
    )
    return [
        {"id": r["id"], "code": r["code"], "section_no": r["section_no"],
         "heading": r["heading"], "text": r["text"], "old_code_ref": r["old_code_ref"]}
        for r in rows
    ]


async def retrieve_judgments(query: str, k: int = 3) -> list[dict[str, Any]]:
    """Top-k Indian Kanoon judgments for `query`.

    If an API token is configured, query the LIVE Indian Kanoon API and cache the
    results; otherwise (no token, network failure, rate limit) fall back to the
    local judgments_cache keyword search. Either way only REAL judgments are
    returned — nothing is fabricated."""
    live = await _indiankanoon_live(query, k)
    if live:
        return live
    return await _judgments_from_cache(query, k)


def _strip_html(text: str) -> str:
    """Indian Kanoon returns <b>-highlighted HTML in titles/headlines."""
    return re.sub(r"<[^>]+>", "", text or "").strip()


async def _indiankanoon_live(query: str, k: int) -> list[dict[str, Any]] | None:
    """Call the live Indian Kanoon search API. Returns None (caller falls back to
    cache) when no token is set or the request fails."""
    token = settings.indiankanoon_api_token
    if not token:
        return None
    headers = {"Authorization": f"Token {token}"}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Indian Kanoon's API uses POST with the query in the form input.
            resp = await client.post(
                f"{_IK_BASE}/search/",
                params={"formInput": query, "pagenum": 0},
                headers=headers,
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:  # network / auth / rate-limit -> graceful fallback
        print(f"[indiankanoon] live API failed ({e}); falling back to cache")
        return None

    results: list[dict[str, Any]] = []
    for d in data.get("docs", [])[:k]:
        tid = d.get("tid")
        if tid is None:
            continue
        results.append({
            "indiankanoon_doc_id": f"IK-{tid}",
            "title": _strip_html(d.get("title", "")) or f"Indian Kanoon doc {tid}",
            "summary": _strip_html(d.get("headline", "")),
            "tags": [d["docsource"]] if d.get("docsource") else [],
        })
    if results:
        await _cache_judgments(results)   # persist for offline reuse
    return results or None


async def _cache_judgments(rows: list[dict[str, Any]]) -> None:
    """Upsert live results into judgments_cache so they remain available offline."""
    for r in rows:
        await pool().execute(
            """INSERT INTO judgments_cache (indiankanoon_doc_id, title, summary, tags)
               VALUES ($1,$2,$3,$4) ON CONFLICT (indiankanoon_doc_id) DO NOTHING""",
            r["indiankanoon_doc_id"], r["title"], r.get("summary"), r.get("tags") or [],
        )


async def _judgments_from_cache(query: str, k: int) -> list[dict[str, Any]]:
    tsq = _or_tsquery(query)
    if not tsq:
        return []
    rows = await pool().fetch(
        """
        SELECT indiankanoon_doc_id, title, summary, tags,
               ts_rank(to_tsvector('english', title || ' ' || coalesce(summary,'')),
                       to_tsquery('english', $1)) AS rank
        FROM judgments_cache
        WHERE to_tsvector('english', title || ' ' || coalesce(summary,''))
              @@ to_tsquery('english', $1)
        ORDER BY rank DESC
        LIMIT $2
        """,
        tsq,
        k,
    )
    return [dict(r) for r in rows]
