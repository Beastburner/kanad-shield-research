# CrimeGPT — Test Scenarios (classifier pre-test set)

> 10 realistic, anonymized India-context incident narratives with expected BNS/BNSS/BSA
> sections. Run these through the classifier BEFORE the live demo. Expected sections are the
> "should-fire" set; the classifier passes if it returns the BNS offence section(s) and the
> relevant BSA evidence sections. Section numbers cross-checked against
> `fallback-section-mapping.md`. All sections BNS/BNSS/BSA only.

---

### S1 — Theft (motorcycle)
**Narrative:** The complainant parked his motorcycle outside a tea stall in the market and went
in for five minutes. When he returned the motorcycle was gone. CCTV from a nearby shop shows an
unknown man riding it away.
**Expected:** BNS **303(2)** (theft). · BNSS **193** (charge-sheet), **105/106** (seizure of
recovered vehicle). · BSA **63** (CCTV electronic record + certificate).

### S2 — Robbery (chain snatching with force)
**Narrative:** Two men on a bike intercepted a woman walking home, pushed her to the ground,
and pulled the gold chain from her neck before speeding off. She suffered minor bruises.
**Expected:** BNS **309** (robbery); consider **304** (snatching) and **115** (hurt) if force
caused injury. · BNSS **187** (remand on arrest), **193**. · BSA **63** (any CCTV).

### S3 — Burglary / house-breaking at night
**Narrative:** While the family was away overnight, an intruder broke the rear-door latch,
entered the house, and took cash and jewellery. Entry was after sunset and before sunrise.
**Expected:** BNS **331** (house-breaking, incl. by night) read with **330**; **305** (theft in
dwelling house). · BNSS **105/106** (seizure), **193**. · BSA **63** (any digital footage).

### S4 — Online UPI / cyber fraud
**Narrative:** The victim received a call from a person claiming to be a bank official who sent
a link; after clicking and entering OTP, Rs 85,000 was debited via UPI to an unknown account.
The fraudster used a fake caller ID showing the bank's name.
**Expected:** BNS **318** (cheating), **319** (cheating by personation) + **IT Act 66C/66D**
(special law, cited alongside). · BNSS **193**, **105** (e-seizure of device/logs). · BSA
**61, 62, 63** + **s.63 certificate** (transaction logs, call records).

### S5 — Criminal breach of trust (employee)
**Narrative:** An accounts clerk was entrusted with depositing daily cash collections in the
company bank account. Over three months he diverted Rs 4 lakh of the collections to his own
account instead of depositing them.
**Expected:** BNS **316** (criminal breach of trust; aggravated clerk/employee form). · BNSS
**193**. · BSA **61–63** (bank statements, accounting records + certificate). NOT cheating
(property was lawfully entrusted first).

### S6 — Cheating / property fraud (no entrustment)
**Narrative:** A man sold the same flat to two different buyers, taking advance payments from
both, having dishonestly intended from the start never to register it to the second buyer.
**Expected:** BNS **318(4)** (cheating + dishonestly inducing delivery of property); possibly
**336/340** (forgery) if documents were fabricated. · BNSS **193**. · BSA **61–63** (agreements,
messages). NOT breach of trust (dishonest intent existed at the time of taking the money).

### S7 — Assault / grievous hurt
**Narrative:** During a parking dispute, the accused hit the complainant on the head with an
iron rod, causing a skull fracture requiring hospitalization. A medico-legal report confirms
the fracture.
**Expected:** BNS **117** (voluntarily causing grievous hurt — fracture is grievous per s.116);
**131** if also assault/criminal force pre-injury. · BNSS **187** (remand), **193**. · BSA
**61–63** (MLC report, any CCTV).

### S8 — Criminal intimidation (threatening messages)
**Narrative:** Over two weeks the complainant received repeated WhatsApp messages from a known
person threatening to kill him and burn his shop unless he withdrew a civil complaint. No money
or property changed hands.
**Expected:** BNS **351(2)** (criminal intimidation — threat of death; aggravated). · BNSS
**193**. · BSA **61, 62, 63** + **s.63 certificate** (WhatsApp chat as electronic record).
NOT extortion (no delivery of property).

### S9 — Extortion (threat + payment)
**Narrative:** A local gang member threatened a shopkeeper with serious harm to his family
unless he paid Rs 20,000 monthly "protection." Fearing for his family, the shopkeeper paid
twice via cash before reporting.
**Expected:** BNS **308** (extortion); possibly **111/112** (organised/petty organised crime)
if gang nexus established. · BNSS **187**, **193**. · BSA **61–63** (any recorded demands,
payment trail). Extortion (not mere intimidation) because property was delivered.

### S10 — Forgery + cheating (fake documents)
**Narrative:** The accused created a forged property title deed and a fake bank guarantee
letter, then used them to obtain a loan of Rs 12 lakh from a cooperative bank.
**Expected:** BNS **336/338** (forgery; forgery of valuable security), **340** (using forged
document as genuine), **318(4)** (cheating + delivery of property). · BNSS **193**. · BSA
**61–63** (forged documents, bank records; expert/handwriting examination feeds s.63 Part B).

---

## Scoring rubric for the pre-test
- **Pass:** classifier returns the primary BNS offence section (top-level number correct) AND
  flags BSA s.63 for any scenario with electronic evidence (S1, S4, S8 at minimum).
- **Partial:** correct offence family but wrong sub-section, or misses a secondary section.
- **Fail:** wrong offence (e.g. labels S5 as cheating, or S8 as extortion), OR emits any
  IPC/CrPC/Evidence-Act reference → immediate fix before demo.

> ⚠️ HUMAN-VERIFY: S2 (robbery vs snatching threshold), S6 (forgery add-on), and S9
> (organised-crime escalation 111/112) are judgment calls a lawyer should confirm. Top-level
> offence sections are sound per `fallback-section-mapping.md`.
