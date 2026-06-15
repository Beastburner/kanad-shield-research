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

from ..db import pool

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
    """Top-k cached Indian Kanoon judgments. Keyword match over the cache so we
    never fabricate judgments — only real cached results are returned."""
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
