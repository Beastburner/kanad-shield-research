from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime config, loaded from environment / .env."""

    groq_api_key: str = ""
    database_url: str = "postgresql://crimegpt:crimegpt@localhost:5432/crimegpt"
    groq_model: str = "llama-3.3-70b-versatile"
    confidence_threshold: float = 0.6
    # fastembed (ONNX) model for semantic statute retrieval (384-dim, matches
    # schema.sql vector(384)). If the package/model is unavailable at runtime,
    # retrieval transparently falls back to PostgreSQL keyword search.
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    artifact_dir: str = "./artifacts"
    # Indian Kanoon live API token (https://api.indiankanoon.org). Empty -> use
    # the local judgments_cache only (offline / demo fallback).
    indiankanoon_api_token: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
