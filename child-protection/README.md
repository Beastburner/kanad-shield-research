# Child Protection — Build Guide

**PS-69EEFDA9B3255** · Cyber Safety and Protection Platform for Children

The problem: children face cyberbullying, grooming, gaming fraud, harmful content, identity
exploitation. The PS wants a unified platform combining parental supervision, AI threat
detection, and direct law-enforcement connectivity.

> ⚠️ This PS is a LEGAL MINEFIELD. A naive child-tracking/chat-monitoring app violates the
> DPDP Act by default. We win by building on the **child-safety EXEMPTION** + **POCSO s.19
> mandatory reporting**. See research/dpdp-act-children-data.md and research/pocso-it-act-grooming.md.

---

## ✅ BUILD (one clean end-to-end safety flow first)

**The hero flow:** `AI flags grooming risk → parent alerted via dashboard → suspicious
interaction captured with hash+timestamp → report drafted to Cyber Crime Branch (POCSO s.19).`

1. **Parental consent dashboard** — the legal control centre. Parent grants/withdraws consent,
   approves, controls visibility + data deletion. (This is what makes us DPDP-lawful.)
2. **Cyber monitoring module** — grooming/cyberbullying/abusive-language detection (keyword +
   LLM hybrid, constrained). Risk scoring.
3. **Evidence capture** — chat logs / suspicious interactions stored with **SHA-256 +
   timestamp + chain-of-custody metadata** (BSA s.63 ready).
4. **Cyber Crime reporting** — direct report to Cyber Crime Branch; **POCSO s.19 reporting
   workflow** auto-triggered on high-risk flag.
5. **Emergency / SOS** — one-touch SOS to parent + police; missing-child reporting hook.
6. **Police dashboard** — required deliverable: child-related cybercrime view, risk heatmap.

## ⚠️ BUILD ONLY IF TIME (bonus / polish)

- Real-time location tracking + geo-fencing (heavy; frame strictly as *safety* function under
  exemption, parental-controlled).
- Screen time / app usage monitoring.
- Educational modules, gaming-fraud detection.
- Multilingual (Gujarati/Hindi/English), voice SOS, SMS/offline alerts, wearable integration.

## ❌ DON'T BUILD / DON'T CLAIM

- ❌ Default-on behavioural monitoring of children — **illegal under DPDP** without the
  safety-exemption framing + parental consent.
- ❌ Targeted profiling/advertising on minors — prohibited.
- ❌ All 9 modules shallowly — do the hero flow flawlessly.
- ❌ Facial recognition for "missing persons" as a core feature — legally/ethically fraught;
  leave as optional bonus at most.
- ❌ OS-level chat interception requiring device MDM — out of hackathon scope; simulate the
  monitoring on a controlled demo dataset instead.
- ❌ Real CCTNS/TrackChild/ERSS integration — mock with documented contracts.
- ❌ Storing child PII in the clear — encrypt + pseudonymise by default.

---

## Tech Stack (compliance-first)

| Layer | Choice | Why |
|-------|--------|-----|
| Backend | **FastAPI** or **Node/Express** | Either fine; FastAPI eases the AI module |
| Database | **PostgreSQL, separate child/adult schemas** | DPDP mandate: isolated pipelines |
| Auth / RBAC | child / parent / police roles | Parental dashboard = consent centre |
| Encryption | field-level encryption for child PII; pseudonymisation | DPDP least-intrusive model |
| Threat NLP | keyword + LLM hybrid classifier (constrained) | Grooming/abuse risk scoring |
| Evidence | **hashlib SHA-256** + timestamp + custody metadata | BSA s.63 admissibility |
| Real-time | **WebSockets / Firebase** | SOS + alerts |
| Maps (if geo) | **Leaflet** (reuse from ServiSync) | Geo-fence visualisation |
| Frontend | **React.js** (web) / Flutter (if mobile) | Parent + police UIs |
| Mock integrations | FastAPI/Express stubs | CCTNS / TrackChild / ERSS-112 |

## Demo Path (the one that must work flawlessly)

`Controlled demo chat shows grooming pattern → AI flags risk + score → parent dashboard
alert → interaction captured with SHA-256 hash + timestamp → one-click POCSO s.19 report
drafted and dispatched to (mock) Cyber Crime Branch → police dashboard shows the incident.`

Keep it to the hero flow. Explain the DPDP exemption + POCSO duty out loud while demoing.
