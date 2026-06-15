# CrimeGPT — Fallback Section Mapping (Demo Safety-Net)

> Curated, source-verified lookup table: common crime → correct **BNS** section (substantive)
> + relevant **BNSS** (procedure) + **BSA** (evidence). If the LLM classifier misfires live,
> the system falls back to this table. Every BNS number below was checked against the NCRB BNS
> compendium / India Code / a bare-act source (URLs at bottom).
>
> ⚠️ Use only BNS/BNSS/BSA. NEVER IPC/CrPC/Evidence Act.
> ⚠️ This is a *suggestion* aid; final charge is the IO's call. Label all output
> "AI-assisted draft — officer review required."

---

## Section number cheat-sheet (definition vs punishment — get this right)

Note the recurring pattern: a **definition** section is followed by a **punishment** section.
For charging, cite the punishment/offence section.

| Concept | Definition section | Offence/Punishment section |
|---|---|---|
| Theft | BNS 303(1) (definition) | **BNS 303(2)** (punishment) |
| Robbery | BNS 309(1) | **BNS 309** (punishment in same s.) |
| Extortion | BNS 308(1) | **BNS 308** |
| Hurt | BNS 114 | **BNS 115** (voluntarily causing hurt) |
| Grievous hurt | BNS 116 (definition) | **BNS 117** (voluntarily causing grievous hurt) |
| Assault / criminal force | BNS 130 (assault), 128 (force) | **BNS 131** (punishment) |
| Cheating | BNS 318(1) | **BNS 318(2)/(4)** |
| Criminal breach of trust | BNS 316(1) | **BNS 316(2)** |
| Forgery | BNS 336 | **BNS 336(2)/(3)** |

---

## Main mapping table

| # | Crime (narrative trigger) | BNS section(s) — VERIFIED | BNSS procedure | BSA evidence |
|---|---|---|---|---|
| 1 | **Theft** (taking movable property dishonestly) | **303** Theft (303(1) def, 303(2) punishment); **304** Snatching; **305** Theft in dwelling house / means of transport | 105/106 seizure; 193 charge-sheet | 61–63 (CCTV/electronic proof of act) |
| 2 | **Robbery** (theft/extortion + force or fear) | **309** Robbery; **310** Dacoity (5+ persons) | 187 remand; 193 | 61–63 |
| 3 | **Burglary / house-breaking** | **329** House-trespass / criminal trespass; **330** House-trespass & house-breaking; **331** Punishment (incl. by night / after sunset before sunrise) | 105/106 seizure; 193 | 61–63 |
| 4 | **Cheating / fraud** | **318** Cheating (318(2) general; 318(4) cheating + delivery of property); **319** Cheating by personation | 193 | 61–63 + **63 certificate** for digital records |
| 5 | **Criminal breach of trust** (entrusted property dishonestly misappropriated) | **316** (316(2) general; aggravated forms 316(3)–(5) for carrier/clerk/public servant/banker) | 193 | 61–63 |
| 6 | **Assault / hurt** | **115** Voluntarily causing hurt; **117** Voluntarily causing grievous hurt; **131** Assault or criminal force (otherwise than on grave provocation); **121** Hurt to deter public servant | 187 remand if grievous; 193 | 61–63 (medical/MLC + CCTV) |
| 7 | **Criminal intimidation** | **351** Criminal intimidation (351(2) threat of death/grievous hurt = 7 yrs; 351(3) anonymous) | 193 | 61–63 (recorded threats / messages) |
| 8 | **Cybercrime / online fraud** (UPI scam, phishing, fake site, digital-arrest scam) | **318** Cheating (core fraud); **319** Cheating by personation (fake identity/site) **+ IT Act 2000 ss.66C identity theft / 66D cheating by personation using computer resource** (special law, cite alongside BNS) | 193; 105 (e-seizure) | **61, 62, 63** electronic record + **s.63 certificate** mandatory |
| 9 | **Forgery** | **336** Forgery (336(2) to harm reputation; 336(3) forgery of document); **338** Forgery of valuable security/will; **340** Forged document/electronic record + using it as genuine (340(2)) | 193 | 61–63 (document/electronic exam) |
| 10 | **Extortion** (delivery of property by putting in fear) | **308** Extortion (308(2) base; aggravated 308(3)–(7) for fear of death/grievous hurt etc.) | 187 remand; 193 | 61–63 (recorded demands) |

---

## Cross-cutting BNSS procedural sections (always candidates)
- **187** — production within 24 hrs / remand (police vs judicial custody).
- **193** — final report (charge-sheet); 193(3) electronic-device chain of custody; 193(9) further investigation / supplementary charge-sheet.
- **103 / 105 / 106 / 107** — search, audio-video-recorded seizure, seizure list, report to Magistrate, disposal.
- **35** — arrest without warrant conditions (3-Star/notice-of-appearance rules).

## Cross-cutting BSA evidentiary sections (always candidates for digital cases)
- **61** — electronic record not inadmissible merely because electronic.
- **62** — proof of contents of electronic records.
- **63** — admissibility of electronic records; **Schedule certificate (Part A + Part B)** required.

## New-code-only offences to recognise (shows 2024 fluency)
- **111** Organised crime · **112** Petty organised crime · **113** Terrorist act · **304** Snatching (new) · **103(2)** mob-lynching murder.

---

## Disambiguation rules (for classifier prompt)
- **Cheating (318) vs Criminal breach of trust (316):** mutually exclusive on the same facts.
  Dishonest intent **at the time of taking** → cheating (318). Property lawfully **entrusted**,
  then dishonestly misappropriated → breach of trust (316).
  - Source: https://www.lawsho.com/why-cheating-criminal-breach-of-trust-cannot-co-exist-under-the-bharatiya-nyaya-sanhita-bns/
- **Extortion (308) vs Criminal intimidation (351):** if victim **hands over** property due to
  the threat → extortion (308). Threat with **no delivery** → criminal intimidation (351).
- **Robbery (309) vs Theft (303):** add **force or fear** to theft/extortion → robbery.
- **Cybercrime:** BNS supplies the substantive offence (usually 318/319); pair with **IT Act
  66C/66D** for the computer-specific element — IT Act 2000 was NOT repealed by BNS.

---

## Sources (section numbers verified)
- NCRB Compendium of New Criminal Laws (BNS index): https://cytrain.ncrb.gov.in/staticpage/web_pages/IndexBNS.html
- India Code — BNS 2023 (official): https://www.indiacode.nic.in/handle/123456789/20062
- BPRD BNS handbook (PDF): https://bprd.nic.in/uploads/pdf/BNS_English_30-04-2024.pdf
- BNS Ch.17 bare act (theft/robbery/cheating/CBT): https://onlinelawconnect.com/actsandrules/criminal/bns/chp17.php
- BNS 115/117 hurt (Devgan): https://devgan.in/bns/section/115/ · https://devgan.in/bns/section/117/
- BNS 130/131 assault (Devgan): https://devgan.in/bns/section/131/
- BNS 351 criminal intimidation (Devgan): https://devgan.in/bns/section/351/
- BNS 316/318 (Drishti): https://www.drishtijudiciary.com/current-affairs/section-316-and-318-of-bns
- Cyber/BNS 318+319 with IT Act 66C/66D: https://lawsection.in/cyber-crimes-under-bharatiya-nyaya-sanhita-2023-bns/

> ⚠️ HUMAN-VERIFY before live demo: the exact **sub-section** numbering (e.g. 303(2), 308(2),
> 318(4), 336(3)) — sub-clause numbers are the easiest to get wrong. The top-level section
> numbers above are verified; cross-check sub-sections on India Code's official PDF.
