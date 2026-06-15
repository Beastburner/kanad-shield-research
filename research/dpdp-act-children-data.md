# Research — DPDP Act 2023 + DPDP Rules 2025: Children's Data

> This is the legal core of the Child Protection PS. A naive child-tracking app is ILLEGAL
> by default. The child-safety EXEMPTION is what makes our product lawful. Build around it.

---

## The Default Rule (the trap)

- **Digital Personal Data Protection Act, 2023 (DPDP Act)** + **DPDP Rules, 2025** govern
  personal data in India.
- A **child = anyone under 18** (stricter than COPPA's 13 and GDPR's 13–16; aligned with
  the Juvenile Justice Act 2015).
- Data Fiduciaries must obtain **verifiable parental/guardian consent** before processing a
  child's personal data.
- The Act **prohibits**:
  - Behavioural monitoring of children
  - Targeted advertising directed at children
  - Any processing likely to cause harm to the child
- **Penalties** for child-data violations: up to **₹200–250 crore**.

> A plain "track my child + monitor their chats" app violates the tracking/monitoring
> prohibition outright. This is why the PS is a legal minefield.

---

## The Exemption That Saves The Product

- Parental consent is **NOT mandatory** when processing relates to essential services such
  as **healthcare, education, or real-time safety**.
- DPDP Rules define specific cases — including **child protection duties** and issuance of
  services — where prior parental consent is not required.
- Rule 10 (read with Rule 11 / Schedule IV) details exemptions; certain classes
  (clinical establishments, mental health institutions, healthcare professionals) are exempt
  from some child-data obligations.

> STRATEGY: Architect the platform as a **real-time child-safety service with parental
> supervision**, NOT behavioural profiling. The safety exemption is our lawful basis.
> The parental dashboard is the consent + control centre.

---

## Mandatory Design Requirements (use as architecture checklist)

From DPDP Rules 2025 compliance guidance for platforms handling minors:

1. **Robust age-assurance** + parent-child account linking.
2. **Separate child and adult data pipelines** — isolate minors' systems to prevent
   accidental tracking/targeting.
3. **Child-safe UX** — minimise data sharing, maximise clarity.
4. **Least-intrusive data models** — anonymous / pseudonymous processing wherever possible.
5. **Proactive parental dashboards** — parents control visibility, approvals, data deletion.
6. **Responsible AI** — moderation/engagement algorithms must not inadvertently profile children.
7. **DPB readiness** — maintain documentation, logs, consent-verification trails.
8. **Easy withdrawal** — withdrawing consent must be as simple as granting it.
9. **Verification of the parent's identity** when obtaining verifiable parental consent.

## Enforcement Context

- **Data Protection Board of India (DPBI)** enforces; appeals go to TDSAT.
- The burden of proving valid consent / valid exemption is on the **Data Fiduciary**.
- Rollout is phased (~18 months from late-2025 notification).

## Sources

- EY: DPDP Act 2023 & DPDP Rules 2025 compliance guides.
- ksandk.com: Children's data protection under DPDP Rules.
- dpdpa.com/dpdparules/rule10.html.
- assurtiv.com: Child Data Protection Rules 2025.
- law.asia: Indian perspective on protecting children's personal data.
