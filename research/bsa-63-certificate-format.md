# Research — BSA Section 63 Certificate Format (Part A + Part B)

> Builds on `digital-evidence-bsa-63.md`. This note gives the **field-level layout** of the
> Schedule certificate so CrimeGPT can auto-draft **Part A** (officer/party) and stub **Part B**
> (expert). Governing law: Bharatiya Sakshya Adhiniyam, 2023 (BSA), **Section 63** + the BSA
> **Schedule** which prescribes the certificate form.

---

## Statutory basis
- **BSA s.63** — admissibility of electronic records; a certificate in the form in the
  **Schedule** must accompany the electronic record (successor to old IEA s.65B).
- The certificate is in **two parts**:
  - **Part A** — filled by the **party producing** the electronic record (the officer / record
    custodian). Firsthand facts on the device, source, and integrity.
  - **Part B** — filled by an **Expert** (Examiner of Electronic Evidence / cyber-forensic
    expert). Per recent rulings, any person with genuine computer-science/cyber-forensics
    expertise may sign Part B if the court is satisfied.
    - Source: https://www.biharwatch.in/2026/05/any-individual-possessing-special.html
- The certificate must affirm the **four s.63 conditions**: (1) the computer/device was in
  regular use for storing/processing info during the relevant period; (2) information of that
  kind was regularly fed in; (3) the device was operating properly (or any malfunction did not
  affect the record); (4) the record reproduces/derives from information so stored.
  - Source: https://obiter.in/section-63-of-the-bsa/

---

## Part A — fields (party producing the record) — TEMPLATE
1. **Deponent particulars** — full name; S/o / D/o / W/o; complete residential address;
   designation / employee or service registration number.
2. **Source/device type** (select): Computer · DVR · Mobile phone · Flash/USB drive · Cloud
   server · External storage media · Other.
3. **Device metadata** — make & model; colour; **IMEI**; **MAC address**; cloud user ID;
   hardware serial number; (storage capacity / OS where relevant).
4. **Description of the electronic record** — file name(s), type, size, the period to which the
   record relates, how/where produced (printout, copy, image).
5. **Four-condition declaration** — statement that the device was in regular use, info was
   regularly fed, device was operating properly (or malfunction did not affect the record), and
   the record reproduces stored information (the s.63 conditions).
6. **Cryptographic hash** — algorithm (select **SHA-256** / MD5) + the full hash string of the
   produced record. (CrimeGPT auto-fills SHA-256 here — direct architecture tie-in.)
7. **Deponent attestation** — full name, date, place, signature.

Source for Part A field list:
https://chat2evidence.in/public/pages/section-63-bsa-certificate-template

## Part B — fields (Expert) — TEMPLATE (CrimeGPT stubs; human completes)
1. **Expert identification** — name, designation, credentials/qualifications; whether an
   "Examiner of Electronic Evidence" / cyber-forensic expert; organisation/lab.
2. **Extraction environment** — hardware/software and forensic tools used; chain-of-custody
   reference; laboratory reference/case number; controlled-conditions statement.
3. **Independent hash validation** — re-computed **SHA-256/MD5** of the file, confirming it
   matches the Part A hash (no tampering).
4. **Expert certification** — findings statement, date, signature, lab seal.

Source for Part B field list (same template page above) and expert-eligibility:
https://www.biharwatch.in/2026/05/any-individual-possessing-special.html

---

## Build implication for CrimeGPT
- Auto-generate **Part A** for every evidentiary document: pull deponent (IO) + device + file
  metadata from the case pool, drop in the SHA-256 hash already computed by the integrity layer,
  and render the four-condition declaration. Output as `.docx`.
- **Part B** = generate a blank/stub with the structure pre-filled but values left for the
  expert (do NOT auto-assert expert findings — that would be a false certification).
- Pitch line: *"court-admissibility-ready, pending the statutory Part B expert certification."*

## Caveats (acknowledge in pitch)
- ⚠️ HUMAN-VERIFY the **exact wording/order** of the official Schedule fields against the India
  Code BSA Schedule (the template above is from a practitioner reproduction, not the gazetted
  Schedule scan). Confirm before claiming "official format."
- The s.63 certificate is **mandatory**, but the timing of furnishing it has some judicial
  flexibility; objections must be timely. Don't overclaim "fully automated court-ready evidence."

## Sources
- BSA s.63 compliance guide (four conditions): https://obiter.in/section-63-of-the-bsa/
- s.63 certificate template Part A & B: https://chat2evidence.in/public/pages/section-63-bsa-certificate-template
- Expert eligibility to sign Part B: https://www.biharwatch.in/2026/05/any-individual-possessing-special.html
- s.63 requirements + SC interpretation: https://bhattandjoshiassociates.com/electronic-evidence-under-bsa-2023-section-63-certificate-requirements-supreme-court-interpretation/
- Naavi on s.63: https://www.naavi.org/wp/section-63-of-bharatiya-sakshya-adhiniyam/
