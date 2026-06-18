# Integration Contracts — BreachAlert (PS-69EEFE3C4D763)

How BreachAlert connects to external data sources, and where each one sits on the
**real ↔ simulated** spectrum. Design principle: **go real where it is cheap, safe
and reliable; use a clean, documented mock with a drop-in key slot everywhere
else.** Every integration is isolated behind a single function so a mock can be
swapped for a real provider without touching the rest of the app.

> The hackathon PS explicitly allows simulated integration ("via APIs or threat
> intelligence feeds"). The mocks below are not placeholders to apologise for —
> each has a defined contract and a documented path to a live provider.

---

## Status at a glance

| Integration | Status | Enable real via | Code location |
|-------------|--------|-----------------|---------------|
| Have I Been Pwned (breach data) | **Real-ready** (demo fallback) | `HIBP_API_KEY` | `services/breach_service.py` |
| Email alerts (SMTP) | **Real-ready** (console fallback) | `SMTP_*` | `services/email_service.py` |
| Dark-web / threat-intel feed | **Simulated** (drop-in slot) | `DARKWEB_FEED_API_KEY` | `services/darkweb_service.py` |
| Unified Legal & Govt Intelligence Platform | **Simulated** (curated) | HTTP swap (see §4) | `services/legal_service.py` |
| CERT-In / statute references | **Curated** (accurate, grounded) | n/a | `services/legal_service.py` |
| SMS / push | **Not built** (documented contract) | future | — |

"Curated" = real, official data hand-mapped from statute text — not fabricated.

---

## 1. Have I Been Pwned — real-ready

Already supports live data. Without a key it falls back to a deterministic demo
dataset so the live demo never depends on connectivity or rate limits.

```env
HIBP_API_KEY=<your key from https://haveibeenpwned.com/API/Key>
```

`check_email_breach(email)` / `check_domain_breach(domain)` call the real v3 API
when the key is set, else the demo set. No code change needed to go live.

---

## 2. Email alerts (SMTP) — real-ready

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASSWORD=<gmail app password>
FROM_EMAIL=you@gmail.com
```

Without SMTP config, `send_breach_alert_email(...)` prints a simulation line to the
console. With it, a formatted HTML breach alert is sent for real.

---

## 3. Dark-web / threat-intel feed — simulated, drop-in ready

**We deliberately do NOT crawl Tor or scrape leak markets** — that means handling
stolen data and violates the hackathon code of conduct. Real "dark-web monitoring"
means consuming a provider that has already done the collection. This module
exposes that provider-shaped contract.

### Contract

```python
async def query_darkweb(identifier: str, asset_type: AssetType) -> list[Exposure]
```

`Exposure` (one dict per hit — same shape a breach record normalises from):

| Field | Type | Notes |
|-------|------|-------|
| `Name` | str | Exposure / source name (e.g. "BreachForums Combolist 2024") |
| `Source` | str | Attribution label shown in the UI |
| `BreachDate` | str | `YYYY-MM-DD` |
| `Description` | str | Human-readable context |
| `DataClasses` | list[str] | e.g. `["Email addresses","Passwords"]` |
| `PwnCount` | int | Approx. records in the dataset |
| `IsVerified` | bool | Provider confidence |

### Going live

Set `DARKWEB_FEED_API_KEY` and implement the provider call inside `query_darkweb`
(HIBP paste feed, SpyCloud, Flare, Recorded Future, …). Map the provider's
response onto the `Exposure` shape above — nothing else in the app changes. The
UI already labels the source as "(simulated)" until a key is present.

---

## 4. Unified Legal & Government Intelligence Platform — simulated (Req #7)

The PS asks this system to integrate "within the Unified Legal & Government
Intelligence Platform" (sibling PS-69EEFDD4DA6E9), which does not exist to
integrate against. We therefore implement the **breach → legal linkage** locally
behind a contract that mirrors a remote platform call, so it can later be swapped
for an HTTP request without changing callers.

### Contract

```python
get_legal_intelligence(data_classes: list[str], severity: str) -> LegalIntel
```

`LegalIntel` response:

```jsonc
{
  "applicable_laws": [
    { "law": "...", "section": "...", "title": "...", "summary": "...", "source": "https://indiacode.nic.in" }
  ],
  "advisories": [
    { "authority": "CERT-In ...", "title": "...", "action": "...", "deadline": "Within 6 hours", "mandatory": true, "source": "..." }
  ],
  "compliance_obligations": ["..."],
  "reporting_mandatory": true,
  "disclaimer": "Informational legal mapping for officer review ..."
}
```

Served at `GET /api/breaches/{breach_id}/legal` (owner-scoped).

### Going live

When the Unified Legal Platform exposes a real endpoint, replace the body of
`get_legal_intelligence` with an HTTP call returning the same `LegalIntel` shape.
The curated mapping then becomes the offline fallback. Statute citations are
already grounded in official sources (`indiacode.nic.in`, `cert-in.org.in`).

---

## 5. SMS / push — documented contract (not built)

Not implemented yet. When added, mirror the email pattern: a `send_sms_alert(...)`
that uses Twilio when `TWILIO_*` is set and logs to console otherwise. The PS
suggests Twilio (SMS) and Firebase (push).

```python
def send_sms_alert(to_phone: str, breach_name: str, severity: str) -> bool
```

---

## Why this split wins the room

- **Real** where it proves the product works (HIBP, email).
- **Simulated, contract-first** where real is unsafe (dark web) or non-existent
  (the sibling legal platform) — defensible and swap-ready.
- **Curated, sourced** legal data — accurate, not invented.

A judge can point at any integration and get a straight answer: it's live, or it's
a documented contract with a named provider and a one-line path to live.
