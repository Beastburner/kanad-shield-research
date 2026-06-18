"""One-time (idempotent) backfill of statute_chunks.embedding for semantic retrieval.

Run once after seeding, and again whenever new statute chunks are added:

    cd backend && python -m scripts.embed_statutes          # only rows missing an embedding
    cd backend && python -m scripts.embed_statutes --all     # re-embed everything

Encodes `heading + text + keywords` with the configured fastembed (ONNX) model
(384-dim, matching schema.sql vector(384)). Until this is run, retrieve_statutes()
transparently falls back to PostgreSQL keyword search, so the app works either way."""

import asyncio
import sys

import asyncpg

from app.config import settings


def _to_pgvector(vec) -> str:
    return "[" + ",".join(f"{x:.6f}" for x in vec) + "]"


async def main(reembed_all: bool) -> None:
    from fastembed import TextEmbedding

    model = TextEmbedding(model_name=settings.embedding_model)
    conn = await asyncpg.connect(settings.database_url)
    try:
        where = "" if reembed_all else "WHERE embedding IS NULL"
        rows = await conn.fetch(
            f"SELECT id, heading, text, coalesce(keywords,'') AS keywords "
            f"FROM statute_chunks {where}"
        )
        if not rows:
            print("Nothing to embed (all statute_chunks already have embeddings).")
            return
        print(f"Embedding {len(rows)} statute chunk(s) with {settings.embedding_model}…")
        texts = [f"{r['heading']} {r['text']} {r['keywords']}".strip() for r in rows]
        vectors = list(model.embed(texts))   # generator of numpy arrays
        for r, vec in zip(rows, vectors):
            await conn.execute(
                "UPDATE statute_chunks SET embedding = $1::vector WHERE id = $2",
                _to_pgvector(vec.tolist()), r["id"],
            )
        print(f"Done — {len(rows)} embeddings written.")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main("--all" in sys.argv))
