"""Evidence file storage (P5). Saves an uploaded image/document under
artifact_dir/evidence with a content hash for chain-of-custody integrity.
The DB row (see schema.evidence) holds the path, hash and tags."""

import uuid
from pathlib import Path

from .config import settings
from .integrity import sha256_file


def _dir() -> Path:
    p = Path(settings.artifact_dir) / "evidence"
    p.mkdir(parents=True, exist_ok=True)
    return p


def save(data: bytes, original_name: str) -> tuple[str, str]:
    """Persist bytes to disk; return (path, sha256). Name is randomised to avoid
    collisions; the original extension is preserved for previewability."""
    ext = Path(original_name or "").suffix.lower() or ".bin"
    path = _dir() / f"{uuid.uuid4().hex}{ext}"
    path.write_bytes(data)
    return str(path), sha256_file(str(path))
