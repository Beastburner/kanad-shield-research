# Child Protection — Architecture

## Hero Flow (the demo spine)

```
Child's monitored channel (controlled demo dataset)
        │
        ▼
┌──────────────────────────────┐
│ THREAT DETECTION MODULE      │  Keyword + LLM hybrid (constrained).
│  grooming / bullying / abuse │  Outputs risk score + category.
└──────────────┬───────────────┘
               │ high-risk flag
               ▼
┌──────────────────────────────┐      ┌───────────────────────────┐
│ EVIDENCE CAPTURE             │─────▶│ SECURE EVIDENCE STORE      │
│  chat log snapshot           │      │ SHA-256 + timestamp +      │
│                              │      │ chain-of-custody metadata  │
└──────────────┬───────────────┘      │ → draft BSA s.63 cert      │
               │                       └───────────────────────────┘
               ▼
┌──────────────────────────────┐
│ PARENTAL CONSENT DASHBOARD   │  Alert to parent. Parent is the consent + control centre.
│  (DPDP lawful basis)         │  Approve / control visibility / delete.
└──────────────┬───────────────┘
               │ confirm / auto on severe
               ▼
┌──────────────────────────────┐
│ POCSO s.19 REPORTING WORKFLOW│  Drafts + dispatches report to Cyber Crime Branch (mock).
│                              │  References Childline 1098 / Cyber 155260.
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ POLICE DASHBOARD (deliverable)│ Incident view, risk heatmap, trend analysis.
└──────────────────────────────┘
```

## Data Architecture (DPDP-compliant)

- **Separate schemas:** `child_data.*` isolated from `adult_data.*` / `parent_data.*`.
- Child PII fields **encrypted at rest** (field-level); pseudonymous IDs used in processing.
- `consent` table — parent_id, child_id, scope, granted_at, withdrawn_at, verification_method.
- `risk_events` — child_pseudo_id, category, score, detected_at.
- `evidence` — event_id, snapshot_path, sha256, timestamp, custody_chain, s63_cert_path.
- `reports` — event_id, status, dispatched_at, target (mock Cyber Crime Branch).
- `audit_log` — append-only access/consent/evidence trail (DPB readiness).

## Mock Integrations (documented contracts)

- `POST /mock/erss112/sos` → simulated emergency dispatch.
- `POST /mock/cctns/report` → simulated cybercrime report intake.
- `GET /mock/trackchild/lookup` → simulated missing-child DB.

## Component Reuse

- **ServiSync** → React + Leaflet for geo-fence/heatmap + Node/MySQL patterns.
- **VERONICA** → constrained LLM classification pattern.
- **PRISM/LazyCook** → validation layer to reduce false positives in risk flagging.

## Hard Boundaries (do not cross)

- No real children's data in the demo — synthetic only.
- No device-level interception / MDM.
- Monitoring justified strictly as safety function under DPDP exemption + parental consent.
