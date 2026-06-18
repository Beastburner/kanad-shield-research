"""
Dark-web exposure source (PS Req #1: "dark web sources via APIs or threat
intelligence feeds").

IMPORTANT: this does NOT crawl Tor or scrape leak markets — doing so is unsafe
and legally fraught (handling stolen data, CoC violations). Real "dark web
monitoring" is consuming a provider that has already done the collection. This
module exposes that provider-shaped contract, backed by a labelled demo dataset.
Drop in a real threat-intel feed (HIBP paste feed, SpyCloud, Flare, ...) behind
the same `query_darkweb()` function later.
"""
from typing import List, Dict
from app.core.config import settings

SOURCE_LABEL = "Threat-Intel Feed (Dark Web)" if settings.DARKWEB_FEED_API_KEY \
    else "Threat-Intel Feed (Dark Web, simulated)"

# Demo exposures, shaped exactly like a normalisable breach record. `Source` is
# explicit so these are clearly attributed to the threat-intel feed.
_DEMO_DARKWEB = {
    "test@example.com": [{
        "Name": "BreachForums Combolist 2024",
        "Source": SOURCE_LABEL,
        "BreachDate": "2024-03-11",
        "Description": "Email and plaintext password found in a credential combolist "
                       "circulated on a dark-web forum.",
        "DataClasses": ["Email addresses", "Passwords"],
        "PwnCount": 4200000,
        "IsVerified": False,
    }],
    "user@breach.com": [{
        "Name": "Telegram Leak Channel Dump",
        "Source": SOURCE_LABEL,
        "BreachDate": "2023-11-02",
        "Description": "Identifier observed in a dataset shared via a dark-web "
                       "Telegram leak channel.",
        "DataClasses": ["Email addresses", "Phone numbers", "Physical addresses"],
        "PwnCount": 9100000,
        "IsVerified": False,
    }],
}


async def query_darkweb(identifier: str, asset_type) -> List[Dict]:
    """Return dark-web exposures for an identifier from the threat-intel feed.

    With DARKWEB_FEED_API_KEY set this is where a real provider call would go;
    without it, the labelled demo dataset is returned.
    """
    if settings.DARKWEB_FEED_API_KEY:
        # Real provider integration point (not implemented for the demo).
        return []
    return _DEMO_DARKWEB.get(identifier.lower(), [])
