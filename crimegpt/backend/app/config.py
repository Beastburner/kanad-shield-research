from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime config, loaded from environment / .env."""

    groq_api_key: str = ""
    database_url: str = "postgresql://crimegpt:crimegpt@localhost:5432/crimegpt"
    # llama-3.3-70b-versatile and llama-3.1-8b-instant were retired by Groq (404),
    # gemma2-9b-it decommissioned (400). gpt-oss-120b is the working model — an
    # open-weight 120B served on Groq, so the weights could be self-hosted on
    # government infrastructure later without changing the pipeline.
    groq_model: str = "openai/gpt-oss-120b"
    confidence_threshold: float = 0.6
    # fastembed (ONNX) model for semantic statute retrieval (384-dim, matches
    # schema.sql vector(384)). If the package/model is unavailable at runtime,
    # retrieval transparently falls back to PostgreSQL keyword search.
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    # Fallback provider. Groq's free tier is 200k tokens/day (~25-40 analyses) and
    # running out mid-demo drops the pipeline to keyword matching. NVIDIA NIM
    # (build.nvidia.com) is OpenAI-compatible, so when Groq returns a quota 429 the
    # same call is retried here instead. Unset -> no failover, current behaviour.
    nvidia_api_key: str = ""
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_model: str = "meta/llama-3.3-70b-instruct"

    artifact_dir: str = "./artifacts"
    # Indian Kanoon live API token (https://api.indiankanoon.org). Empty -> use
    # the local judgments_cache only (offline / demo fallback).
    indiankanoon_api_token: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
