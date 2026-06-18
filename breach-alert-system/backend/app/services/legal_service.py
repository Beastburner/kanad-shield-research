"""
Legal-intelligence linkage (PS Req #7).

Maps a detected breach to the relevant Indian statutes, the mandatory government
cybersecurity advisories, and the data-protection compliance obligations that a
legal/government Data Fiduciary must discharge.

Curated and deterministic by design — no LLM. Citations are grounded in the
official statute portals (indiacode.nic.in, cert-in.org.in, meity.gov.in) so the
output never hallucinates law. This is the module the PS describes as
"Integration with Legal Intelligence Platform".
"""
from typing import List, Dict

INDIA_CODE = "https://www.indiacode.nic.in"
CERT_IN = "https://www.cert-in.org.in"

# --- Statute references (stable, reusable building blocks) ---------------------

IT_ACT_43A = {
    "law": "Information Technology Act, 2000",
    "section": "Section 43A",
    "title": "Compensation for failure to protect data",
    "summary": "A body corporate handling sensitive personal data that is negligent in "
               "maintaining reasonable security practices, causing wrongful loss or gain, "
               "is liable to pay compensation to the affected person.",
    "source": INDIA_CODE,
}
IT_ACT_66 = {
    "law": "Information Technology Act, 2000",
    "section": "Section 66",
    "title": "Computer-related offences",
    "summary": "Dishonestly or fraudulently doing any act referred to in Section 43 "
               "(unauthorised access, data theft) is punishable with imprisonment up to 3 years "
               "and/or fine up to ₹5 lakh.",
    "source": INDIA_CODE,
}
IT_ACT_66C = {
    "law": "Information Technology Act, 2000",
    "section": "Section 66C",
    "title": "Identity theft",
    "summary": "Fraudulent or dishonest use of another person's password, electronic signature "
               "or any other unique identification feature — punishable up to 3 years and fine up to ₹1 lakh.",
    "source": INDIA_CODE,
}
IT_ACT_66D = {
    "law": "Information Technology Act, 2000",
    "section": "Section 66D",
    "title": "Cheating by personation using a computer resource",
    "summary": "Cheating by personation through any communication device or computer resource "
               "(e.g. phishing using leaked credentials) — punishable up to 3 years and fine up to ₹1 lakh.",
    "source": INDIA_CODE,
}
DPDP_8 = {
    "law": "Digital Personal Data Protection Act, 2023",
    "section": "Section 8(5) & 8(6)",
    "title": "Data Fiduciary security safeguards & breach intimation",
    "summary": "A Data Fiduciary must protect personal data with reasonable security safeguards, "
               "and on a personal data breach must intimate the Data Protection Board of India and "
               "each affected Data Principal in the prescribed manner.",
    "source": INDIA_CODE,
}
BNS_318 = {
    "law": "Bharatiya Nyaya Sanhita, 2023",
    "section": "Section 318",
    "title": "Cheating (cf. repealed IPC 415/420)",
    "summary": "Fraudulent inducement using deceived data to deliver property or cause damage — "
               "applies to downstream fraud committed with leaked information.",
    "source": INDIA_CODE,
}
BNS_319 = {
    "law": "Bharatiya Nyaya Sanhita, 2023",
    "section": "Section 319",
    "title": "Cheating by personation (cf. repealed IPC 416/419)",
    "summary": "Cheating by pretending to be another person — applies when leaked identity data "
               "is used to impersonate the victim.",
    "source": INDIA_CODE,
}

# Data-class -> additional statutes triggered when that class is exposed.
DATA_CLASS_LAWS = {
    "Passwords": [IT_ACT_66C, IT_ACT_66D, BNS_319],
    "Password hints": [IT_ACT_66C],
    "Email addresses": [IT_ACT_66D, BNS_319],
    "Phone numbers": [IT_ACT_66D],
    "Credit card details": [IT_ACT_66, IT_ACT_66D, BNS_318],
    "Bank details": [IT_ACT_66, IT_ACT_66D, BNS_318],
    "Government issued IDs": [IT_ACT_66C, BNS_319],
}


def get_legal_intelligence(data_classes: List[str], severity: str) -> Dict:
    """Return statutes, advisories and compliance obligations for a breach."""
    # Every personal-data breach engages the data-holder's baseline duties.
    laws = [IT_ACT_43A, DPDP_8]
    seen = {(l["law"], l["section"]) for l in laws}
    for dc in data_classes:
        for law in DATA_CLASS_LAWS.get(dc, []):
            key = (law["law"], law["section"])
            if key not in seen:
                laws.append(law)
                seen.add(key)

    mandatory = severity in ("high", "critical")

    advisories = [
        {
            "authority": "CERT-In (Indian Computer Emergency Response Team)",
            "title": "Cyber incident reporting — Directions of 28 April 2022",
            "action": "Report the data breach to CERT-In within 6 hours of noticing it, "
                      "via incident@cert-in.org.in or the CERT-In incident portal.",
            "deadline": "Within 6 hours",
            "mandatory": True,
            "source": CERT_IN,
        },
        {
            "authority": "Data Protection Board of India (DPBI)",
            "title": "DPDP Act 2023 breach intimation",
            "action": "Intimate the Data Protection Board and every affected Data Principal of "
                      "the breach, its nature, and the mitigation measures taken.",
            "deadline": "Without delay (as prescribed under the DPDP Rules)",
            "mandatory": True,
            "source": INDIA_CODE,
        },
    ]

    obligations = [
        "Notify affected Data Principals so they can take protective action (DPDP Act s.8(6)).",
        "Preserve breach logs and evidence for any subsequent investigation or DPBI inquiry.",
        "Demonstrate reasonable security safeguards were in place — the burden of proof is on "
        "the Data Fiduciary (IT Act s.43A; DPDP Act s.8(5)).",
        "Penalty exposure: failure to take reasonable security safeguards can attract a penalty "
        "of up to ₹250 crore under the DPDP Act schedule.",
    ]

    return {
        "applicable_laws": laws,
        "advisories": advisories,
        "compliance_obligations": obligations,
        "reporting_mandatory": mandatory,
        "disclaimer": "Informational legal mapping for officer review — not a substitute for "
                      "formal legal advice. Primary statutes are the new codes (BNS/IT Act/DPDP); "
                      "repealed IPC equivalents are shown as cross-references only.",
    }
