"""
At-rest encryption for sensitive monitored identifiers (PS Req #5).

Monitored values (emails / phones / domains) are personal data, so they are
encrypted in the database with Fernet (AES-128-CBC + HMAC). Because Fernet output
is non-deterministic, equality lookups use a separate deterministic HMAC-SHA256
"blind index" column instead of the ciphertext.

Both keys are derived from SECRET_KEY, which is already required and validated at
startup (see config.py), so no extra key management is introduced.
"""
import base64
import hashlib
import hmac
from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy.types import TypeDecorator, String
from app.core.config import settings

# Fernet needs a 32-byte urlsafe-base64 key; derive it from SECRET_KEY.
_FERNET = Fernet(base64.urlsafe_b64encode(hashlib.sha256(settings.SECRET_KEY.encode()).digest()))
# Separate, domain-separated key for the deterministic blind index.
_INDEX_KEY = hashlib.sha256(b"asset-blind-index|" + settings.SECRET_KEY.encode()).digest()


def blind_index(value: str) -> str:
    """Deterministic, keyed hash for equality lookups on encrypted columns."""
    return hmac.new(_INDEX_KEY, value.encode(), hashlib.sha256).hexdigest()


class EncryptedString(TypeDecorator):
    """Transparently encrypts on write and decrypts on read."""
    impl = String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        return _FERNET.encrypt(value.encode()).decode()

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        try:
            return _FERNET.decrypt(value.encode()).decode()
        except InvalidToken:
            # Tolerate any pre-encryption/plaintext rows rather than 500 on read.
            return value
