"""Statute & judgment retrieval interface (the RAG layer).

The clean seam: `retrieve_statutes()` returns the top-k statute chunks for a query.
It runs semantic (pgvector cosine) search via `embed()` + `_vector_search` when a
fastembed model is loaded and `statute_chunks.embedding` is populated
(`python -m scripts.embed_statutes`), and transparently falls back to Postgres
full-text / keyword match otherwise — so it is callable with OR without embeddings.
The agent code never changes — it only consumes the returned chunks."""

import re
from typing import Any

import anyio
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


# Lazily-loaded fastembed model (ONNX runtime, no torch). Load once, off the hot
# path; _model_failed latches True if the package/model can't be loaded so we
# don't retry the slow import on every query — we just use keyword search.
_model: Any = None
_model_failed = False


def _load_model() -> Any:
    global _model, _model_failed
    if _model is not None or _model_failed:
        return _model
    try:
        from fastembed import TextEmbedding

        _model = TextEmbedding(model_name=settings.embedding_model)
    except Exception as e:  # package missing / no model / offline — degrade gracefully
        print(f"[embed] semantic model unavailable ({e}); using keyword retrieval")
        _model_failed = True
    return _model


async def embed(text: str) -> list[float] | None:
    """Encode `text` to a 384-dim vector (matches schema.sql vector(384)).

    Returns None when the embedding model can't be loaded, so retrieval falls back
    to PostgreSQL keyword search. Encoding runs in a worker thread to keep the
    async event loop responsive."""
    model = _load_model()
    if model is None:
        return None
    # fastembed .embed() returns a generator of numpy arrays (one per input).
    vec = await anyio.to_thread.run_sync(lambda: next(iter(model.embed([text]))))
    return vec.tolist()


def _to_pgvector(vec: list[float]) -> str:
    """pgvector accepts a bracketed literal; passing a string + ::vector cast avoids
    needing an asyncpg type codec registration."""
    return "[" + ",".join(f"{x:.6f}" for x in vec) + "]"


async def retrieve_statutes(
    query: str, k: int = 6, codes: tuple[str, ...] | None = None
) -> list[dict[str, Any]]:
    """Top-k statute chunks relevant to `query`.

    `codes` optionally restricts the search to specific law codes. Charge
    classification passes codes=('BNS',): only the BNS defines punishable
    offences, so a procedural BNSS section or an evidentiary BSA section can never
    be returned as a candidate "charge". Tries vector search if an embedding is
    available, else keyword search."""
    vec = await embed(query)
    if vec is not None:
        rows = await _vector_search(vec, k, codes)
        if rows:
            return rows
        # Model is loaded but embeddings aren't populated yet (run
        # scripts/embed_statutes.py) — fall back to keyword so we never return
        # empty just because the vector column is unfilled.
    return await _keyword_search(query, k, codes)


async def _vector_search(
    vec: list[float], k: int, codes: tuple[str, ...] | None
) -> list[dict[str, Any]]:
    rows = await pool().fetch(
        """
        SELECT id, code, section_no, heading, text, old_code_ref
        FROM statute_chunks
        WHERE embedding IS NOT NULL
          AND ($2::text[] IS NULL OR code = ANY($2))
        ORDER BY embedding <=> $1::vector
        LIMIT $3
        """,
        _to_pgvector(vec),
        list(codes) if codes else None,
        k,
    )
    return [dict(r) for r in rows]


async def _keyword_search(
    query: str, k: int, codes: tuple[str, ...] | None
) -> list[dict[str, Any]]:
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
          AND ($3::text[] IS NULL OR code = ANY($3))
        ORDER BY rank DESC
        LIMIT $2
        """,
        tsq,
        k,
        list(codes) if codes else None,
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
