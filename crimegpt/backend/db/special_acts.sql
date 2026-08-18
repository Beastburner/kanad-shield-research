-- CrimeGPT — special-act offence corpus (Prevention of Corruption Act, IT Act,
-- NDPS Act, Arms Act, POCSO).
--
-- WHY: the BNS is the general penal code, but a large share of real FIRs are
-- charged under a SPECIAL act — a bribery FIR is charged under the PC Act, a UPI
-- fraud under IT Act 66C/66D read with BNS 318/319, a narcotics case under the
-- NDPS Act. Before this file the corpus held BNS/BNSS/BSA only, so those cases
-- classified to ZERO sections and dead-ended (see the CBI/ACB bribery FIR).
--
-- These acts are IN FORCE and unrepealed, so `old_code_ref` stays NULL — there is
-- no "old equivalent" to cross-reference the way BNS 303 maps to IPC 379.
--
-- Idempotent: safe to re-run. Apply to an existing DB with
--   psql "$DATABASE_URL" -f db/special_acts.sql

-- ---------------------------------------------------------------------------
-- 1. De-duplicate, then enforce one row per (code, section_no).
--    schema.sql's `ON CONFLICT DO NOTHING` on statute_chunks was a no-op without
--    this index — re-running seed.sql silently duplicated the whole corpus.
-- ---------------------------------------------------------------------------
DELETE FROM statute_chunks a
  USING statute_chunks b
  WHERE a.ctid > b.ctid AND a.code = b.code AND a.section_no = b.section_no;

CREATE UNIQUE INDEX IF NOT EXISTS statute_chunks_code_section_uniq
    ON statute_chunks (code, section_no);

-- ---------------------------------------------------------------------------
-- 2. Allow special-act codes. The original CHECK hard-limited the corpus to
--    ('BNS','BNSS','BSA'), which is what made special-act charges impossible.
-- ---------------------------------------------------------------------------
ALTER TABLE statute_chunks DROP CONSTRAINT IF EXISTS statute_chunks_code_check;
ALTER TABLE statute_chunks ADD CONSTRAINT statute_chunks_code_check
    CHECK (code IN ('BNS', 'BNSS', 'BSA',
                    'PC Act', 'IT Act', 'NDPS Act', 'Arms Act', 'POCSO'));

-- suggested_sections carries the same CHECK — without widening it too, a special-act
-- suggestion is classified correctly and then rejected on INSERT.
ALTER TABLE suggested_sections DROP CONSTRAINT IF EXISTS suggested_sections_code_check;
ALTER TABLE suggested_sections ADD CONSTRAINT suggested_sections_code_check
    CHECK (code IN ('BNS', 'BNSS', 'BSA',
                    'PC Act', 'IT Act', 'NDPS Act', 'Arms Act', 'POCSO'));

-- ---------------------------------------------------------------------------
-- 3. Prevention of Corruption Act, 1988 (as amended by Act 16 of 2018)
-- ---------------------------------------------------------------------------
INSERT INTO statute_chunks (code, section_no, heading, text, keywords) VALUES
('PC Act', '7', 'Offence relating to public servant being bribed',
 'Any public servant who obtains, accepts or attempts to obtain from any person an undue advantage, intending to perform (or cause performance of) a public duty improperly or dishonestly, or as a reward for such improper performance, commits an offence. Punishable with imprisonment of not less than three years, which may extend to seven years, and fine.',
 'bribe bribery gratification illegal gratification undue advantage public servant demand demanded accepted tehsildar clerk officer official trap decoy money for work file clearance corruption'),
('PC Act', '7A', 'Taking undue advantage to influence a public servant by corrupt means',
 'Whoever accepts or attempts to obtain from another person any undue advantage as a motive or reward to induce a public servant, by corrupt or illegal means or by exercise of personal influence, to perform or not perform a public duty improperly, is punishable with imprisonment of not less than three years extending to seven years, and fine.',
 'middleman agent broker influence public servant undue advantage commission cut fixer touts corruption'),
('PC Act', '8', 'Offence relating to bribing a public servant',
 'Any person who gives or promises to give an undue advantage to another person, intending to induce or reward a public servant for improper performance of a public duty, is punishable with imprisonment up to seven years, or fine, or both. A person compelled to give an undue advantage is not liable if he reports the matter to a law-enforcement authority within seven days.',
 'gave bribe offered bribe paid money to officer bribe giver inducement reward complainant compelled reported seven days'),
('PC Act', '13', 'Criminal misconduct by a public servant',
 'A public servant commits criminal misconduct if he dishonestly or fraudulently misappropriates or converts for his own use property entrusted to him or under his control, or intentionally enriches himself illicitly during the period of his office (possession of pecuniary resources or property disproportionate to his known sources of income, which he cannot satisfactorily account for). Punishable under s.13(2) with imprisonment of not less than four years extending to ten years, and fine.',
 'disproportionate assets illicit enrichment misappropriation embezzlement public servant known sources of income accumulated wealth criminal misconduct government property')
ON CONFLICT (code, section_no) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Information Technology Act, 2000 (as amended by Act 10 of 2009)
--    Most relevant to the Cyber Crime Branch: these are the sections actually
--    invoked alongside BNS 318/319 in online-fraud FIRs.
-- ---------------------------------------------------------------------------
INSERT INTO statute_chunks (code, section_no, heading, text, keywords) VALUES
('IT Act', '66', 'Computer related offences',
 'If any person dishonestly or fraudulently does any act referred to in section 43 (unauthorised access to a computer, computer system or computer network, downloading or copying data, introducing a virus, damaging or disrupting a system, denying access, or tampering with data), he is punishable with imprisonment up to three years or a fine up to five lakh rupees, or both.',
 'hacking hacked unauthorised access computer system network data theft virus malware ransomware server breach tampering account compromised'),
('IT Act', '66C', 'Punishment for identity theft',
 'Whoever, fraudulently or dishonestly, makes use of the electronic signature, password or any other unique identification feature of any other person, is punishable with imprisonment up to three years and a fine up to one lakh rupees.',
 'otp password stolen identity theft credentials pin cvv login id aadhaar misuse unique identification electronic signature account takeover'),
('IT Act', '66D', 'Cheating by personation by using computer resource',
 'Whoever, by means of any communication device or computer resource, cheats by personation, is punishable with imprisonment up to three years and a fine up to one lakh rupees.',
 'upi phishing fake caller id impersonated bank official customer care fraud call fake website fake link online fraud digital arrest netbanking fraudulent transaction cheating by personation'),
('IT Act', '67', 'Publishing or transmitting obscene material in electronic form',
 'Whoever publishes or transmits, or causes to be published or transmitted, in electronic form any material which is lascivious or appeals to the prurient interest, is punishable on first conviction with imprisonment up to three years and a fine up to five lakh rupees.',
 'obscene material electronic form published transmitted vulgar lascivious morphed photos social media post whatsapp forward'),
('IT Act', '67B', 'Punishment for publishing material depicting children in sexually explicit act',
 'Whoever publishes, transmits, creates, collects, browses, downloads, advertises or exchanges material in electronic form depicting children in an obscene or sexually explicit manner, is punishable on first conviction with imprisonment up to five years and a fine up to ten lakh rupees.',
 'child sexual abuse material csam child pornography minor explicit electronic form downloaded exchanged browsed')
ON CONFLICT (code, section_no) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Narcotic Drugs and Psychotropic Substances Act, 1985
--    Punishment is graded by quantity (small / intermediate / commercial) — the
--    text records the grading so the validator can flag when quantity is unknown.
-- ---------------------------------------------------------------------------
INSERT INTO statute_chunks (code, section_no, heading, text, keywords) VALUES
('NDPS Act', '8', 'Prohibition of certain operations',
 'No person shall produce, manufacture, possess, sell, purchase, transport, warehouse, use, consume, import, export or trans-ship any narcotic drug or psychotropic substance, except for medical or scientific purposes and in the manner and to the extent provided by the Act and the rules or orders made thereunder.',
 'narcotic drug psychotropic substance prohibited possession transport sale purchase consumption contraband'),
('NDPS Act', '20', 'Contravention in relation to cannabis plant and cannabis',
 'Whoever contravenes the Act in relation to cannabis (ganja, charas, hashish) is punishable: for a small quantity, with imprisonment up to one year or fine up to ten thousand rupees, or both; for a quantity greater than small but less than commercial, with imprisonment up to ten years and fine up to one lakh rupees; for a commercial quantity, with rigorous imprisonment of not less than ten years extending to twenty years and fine of one to two lakh rupees.',
 'ganja charas hashish cannabis marijuana weed bhang recovered seized possession commercial quantity small quantity drugs'),
('NDPS Act', '21', 'Contravention in relation to manufactured drugs and preparations',
 'Whoever contravenes the Act in relation to any manufactured drug or preparation containing one is punishable on the same graded scale: small quantity — up to one year or fine or both; more than small but less than commercial — up to ten years and fine up to one lakh rupees; commercial quantity — rigorous imprisonment of not less than ten years extending to twenty years and fine of one to two lakh rupees.',
 'heroin brown sugar smack cocaine mdma manufactured drug tablets capsules injection recovered seized peddler'),
('NDPS Act', '22', 'Contravention in relation to psychotropic substances',
 'Whoever contravenes the Act in relation to psychotropic substances is punishable on the same graded scale as sections 20 and 21, from up to one year for a small quantity to rigorous imprisonment of ten to twenty years and fine of one to two lakh rupees for a commercial quantity.',
 'psychotropic substance alprazolam tramadol codeine syrup mephedrone md banned tablets recovered seized')
ON CONFLICT (code, section_no) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. Arms Act, 1959
-- ---------------------------------------------------------------------------
INSERT INTO statute_chunks (code, section_no, heading, text, keywords) VALUES
('Arms Act', '25', 'Punishment for certain offences',
 'Whoever acquires, has in his possession or carries any firearm or ammunition in contravention of section 3 (which requires a licence) is punishable under section 25(1B)(a) with imprisonment of not less than one year extending to three years, and fine. Manufacture, sale or transfer of prohibited arms attracts the higher punishment in section 25(1).',
 'pistol revolver country made katta firearm gun ammunition cartridges live rounds without licence unlicensed weapon recovered seized possession'),
('Arms Act', '27', 'Punishment for using arms',
 'Whoever uses any arms or ammunition in contravention of section 5 is punishable with imprisonment of not less than three years extending to seven years and fine; where such use results in death, the punishment is death or imprisonment for life and fine.',
 'fired shot used firearm brandished weapon opened fire injury death by firearm')
ON CONFLICT (code, section_no) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. Protection of Children from Sexual Offences Act, 2012 (as amended 2019)
-- ---------------------------------------------------------------------------
INSERT INTO statute_chunks (code, section_no, heading, text, keywords) VALUES
('POCSO', '4', 'Punishment for penetrative sexual assault',
 'Whoever commits penetrative sexual assault on a child is punishable with rigorous imprisonment of not less than ten years, which may extend to imprisonment for life, and fine. Where the child is below sixteen years of age, the punishment under section 4(2) is rigorous imprisonment of not less than twenty years extending to imprisonment for the remainder of natural life, and fine.',
 'penetrative sexual assault child minor below eighteen below sixteen rape of child victim girl boy pocso'),
('POCSO', '6', 'Punishment for aggravated penetrative sexual assault',
 'Whoever commits aggravated penetrative sexual assault (including by a police officer, public servant, relative, or person in a position of trust, or on a child below twelve years) is punishable with rigorous imprisonment of not less than twenty years, extendable to imprisonment for the remainder of natural life, or with death, and fine.',
 'aggravated penetrative sexual assault position of trust relative police officer public servant child below twelve gang'),
('POCSO', '8', 'Punishment for sexual assault',
 'Whoever commits sexual assault on a child (touching the vagina, penis, anus or breast of the child, or making the child touch such parts, or any other act with sexual intent involving physical contact without penetration) is punishable with imprisonment of not less than three years extending to five years, and fine.',
 'sexual assault child touched inappropriately molested bad touch minor sexual intent physical contact'),
('POCSO', '12', 'Punishment for sexual harassment of a child',
 'Whoever commits sexual harassment upon a child (sexually coloured remarks, showing pornography, stalking, or repeatedly following or watching a child) is punishable with imprisonment up to three years and fine.',
 'sexual harassment child stalking followed obscene remarks showed pornography watched minor eve teasing')
ON CONFLICT (code, section_no) DO NOTHING;
