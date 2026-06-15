"""Thin asyncpg connection-pool layer. No ORM — the schema is small and the
queries are direct, per CLAUDE.md (no speculative abstraction)."""

import json
import asyncpg

from .config import settings

_pool: asyncpg.Pool | None = None


async def init_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            dsn=settings.database_url,
            min_size=1,
            max_size=5,
            init=_init_conn,
        )
    return _pool


def _jsonb_encode(value) -> str:
    # default=str so UUID / datetime values in a row dict serialise cleanly.
    return json.dumps(value, default=str)


async def _init_conn(conn: asyncpg.Connection) -> None:
    # Encode/decode JSONB transparently as Python dicts/lists.
    await conn.set_type_codec(
        "jsonb", encoder=_jsonb_encode, decoder=json.loads, schema="pg_catalog"
    )


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("DB pool not initialised; call init_pool() first")
    return _pool
