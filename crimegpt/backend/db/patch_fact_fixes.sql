-- Fact-audit fixes (2026-08-19) for rows already seeded by seed.sql.
-- seed.sql itself is corrected; this patch syncs a database that was seeded
-- before the fix. Idempotent — safe to run more than once.
-- Apply locally AND on Render:  psql "$DATABASE_URL" -f db/patch_fact_fixes.sql
-- Then re-embed the changed chunks:  python -m scripts.embed_statutes

-- 1. BNS 336 — sub-sections were mislabelled (336(2) is general forgery;
--    cheating is 336(3); harm to reputation is 336(4)).
UPDATE statute_chunks SET
    text = 'Whoever makes any false document or false electronic record, or part thereof, with intent to cause damage or injury, or to support any claim, or to commit fraud, commits forgery. Punishment varies by sub-section: s.336(2) general forgery (up to two years); s.336(3) forgery for the purpose of cheating (up to seven years); s.336(4) forgery to harm reputation (up to three years).',
    embedding = NULL
WHERE code = 'BNS' AND section_no = '336';

-- 2. BNS 351 — sub-sections were shifted by one (aggravated is 351(3),
--    anonymous is 351(4); 351(2) is the two-year base punishment).
UPDATE statute_chunks SET
    text = 'Whoever threatens another with injury to person, reputation or property with intent to cause alarm commits criminal intimidation. Base punishment under s.351(2) is up to two years; threat of death, grievous hurt or arson is aggravated (s.351(3), up to seven years); anonymous threats attract up to two years in addition (s.351(4)).',
    embedding = NULL
WHERE code = 'BNS' AND section_no = '351';

-- 3. BNS 105 — the intention limb carries a five-year minimum (new vs IPC 304).
UPDATE statute_chunks SET
    text = 'Whoever commits culpable homicide not amounting to murder is punishable with imprisonment for life, or imprisonment of not less than five years extending to ten years, and fine, where the act is done with intention; or up to ten years and fine where done with knowledge.',
    embedding = NULL
WHERE code = 'BNS' AND section_no = '105';

-- 4. BSA↔Evidence Act concordance — BSA 61 is new (no IEA equivalent);
--    BSA 62 maps to IEA 65A; only BSA 63 maps to 65B.
UPDATE statute_chunks SET old_code_ref = 'New provision under BSA (no direct Evidence Act equivalent)'
WHERE code = 'BSA' AND section_no = '61';
UPDATE statute_chunks SET old_code_ref = 'Evidence Act s.65A (special provisions for electronic records)'
WHERE code = 'BSA' AND section_no = '62';

-- 5. Shafhi Mohammad was overruled (not "clarified") by Arjun Panditrao (2020).
UPDATE judgments_cache SET
    summary = 'Discusses production of electronic evidence where the device is not in the party''s possession; its relaxation of the certificate requirement was later overruled by Arjun Panditrao.'
WHERE indiankanoon_doc_id = 'IK-1000013';
