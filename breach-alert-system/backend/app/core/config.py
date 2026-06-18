from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Optional

# Placeholder values shipped in docs/.env.example that must never reach production.
INSECURE_SECRET_KEYS = {
    "your-secret-key-change-in-production-min-32-chars-long",
    "change-this-to-a-random-secret-key-at-least-32-chars",
}

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/breach_alert"
    SECRET_KEY: str  # required: no default, must be set via environment / .env
    ALGORITHM: str = "HS256"

    @field_validator("SECRET_KEY")
    @classmethod
    def _validate_secret_key(cls, v: str) -> str:
        if v in INSECURE_SECRET_KEYS or len(v) < 32:
            raise ValueError(
                "SECRET_KEY must be a unique random value of at least 32 characters. "
                "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(48))\""
            )
        return v
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    HIBP_API_KEY: Optional[str] = None
    HIBP_API_URL: str = "https://haveibeenpwned.com/api/v3"

    # Dark-web / threat-intel feed (left unset -> labelled simulated source)
    DARKWEB_FEED_API_KEY: Optional[str] = None

    # Continuous monitoring (PS Req #1)
    BACKGROUND_SCAN_ENABLED: bool = True
    SCAN_INTERVAL_MINUTES: int = 60

    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    FROM_EMAIL: str = "noreply@breachalert.com"

    class Config:
        env_file = ".env"

settings = Settings()
