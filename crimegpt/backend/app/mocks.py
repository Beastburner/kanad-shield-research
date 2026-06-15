"""Mock CCTNS / BharatPol integrations. Clearly labelled MOCK — production would
plug into ICJS endpoints. Documented in API_CONTRACT.md as integration-ready."""

import uuid
from datetime import datetime, timezone

from .models import MockFIRRequest, MockFIRResponse, MockBharatPolResponse

_SAMPLE_NARRATIVE = (
    "On the night of 12 June 2026, the complainant {complainant} reported that "
    "two unknown persons broke the lock of his shop in {district} and stole a "
    "laptop, a cash box containing Rs. 45,000 and a mobile phone. CCTV footage "
    "of the incident is available."
)


def mock_fir(req: MockFIRRequest) -> MockFIRResponse:
    return MockFIRResponse(
        cctns_fir_id=f"CCTNS-{uuid.uuid4().hex[:10].upper()}",
        district=req.district,
        police_station=f"{req.district} City PS",
        complainant=req.complainant,
        fir_narrative=_SAMPLE_NARRATIVE.format(
            complainant=req.complainant, district=req.district
        ),
        registered_at=datetime.now(timezone.utc),
    )


# Only this seeded name returns a (simulated) match — querying an arbitrary name
# must NOT fabricate an Interpol notice for a real person during a live demo.
_WANTED_SAMPLE = "rajesh khanna"


def mock_bharatpol(query: str) -> MockBharatPolResponse:
    matches = []
    if query.strip().lower() == _WANTED_SAMPLE:
        matches = [
            {
                "interpol_ref": "RN-2024-0098",
                "name": query,
                "wanted_for": "transnational fraud",
                "country": "UAE",
                "notice": "Red Notice (simulated)",
            }
        ]
    return MockBharatPolResponse(query=query, matches=matches)
