-- =============================================================================
-- ROOMIA PLATFORM — AUDITOR VERIFICATION QUERIES (PGADMIN / DBEAVER / PSQL)
-- Run these queries live during the audit to demonstrate every control
-- =============================================================================

-- 1. VERIFY ARGON2ID HASHING PARAMETERS (RQ-SEG-001 / CAL-010)
SELECT id, email, role, left(password_hash, 38) AS argon2id_header
FROM users;

-- 2. VERIFY AUTOMATIC DATA AUDIT TRAIL & SHA-256 HASH CHAIN (RQ-AUD-01)
SELECT id, uuid, microservice_emitter, event_type, entity_type, entity_id,
       ip_anonymized, left(previous_hash, 16) AS prev_hash_prefix,
       left(current_hash, 16) AS curr_hash_prefix, created_at_utc
FROM audit_logs
ORDER BY id ASC;

-- 3. VERIFY BOOKING INTEGRITY SHA-256 FINGERPRINT (RQ-AUD-01 / V-06)
SELECT * FROM v_booking_tamper_detection;

-- 4. VERIFY PCI-DSS 4.0 ZERO CARD DATA RETENTION (V-03)
SELECT * FROM v_pci_dss_compliance_check;

-- 5. VERIFY ZERO OVERBOOKING ON LOCKED DATES (RQ-FUNC-01 / CAL-004)
SELECT * FROM v_overbooking_integrity_check;

-- 6. NEGATIVE TEST (UNCOMMENT TO DEMONSTRATE IMMUTABILITY BLOCKING IN LIVE AUDIT):
-- Attempting to update or delete from audit_logs raises SQLSTATE 45000:
-- UPDATE audit_logs SET event_type = 'HACKED' WHERE id = 1;
-- DELETE FROM audit_logs WHERE id = 1;

-- 7. NEGATIVE TEST (UNCOMMENT TO DEMONSTRATE CPF-05 UNVERIFIED STAY BLOCKING):
-- Attempting to insert a review for a listing without a COMPLETED booking raises SQLSTATE 42501:
-- INSERT INTO reviews (booking_id, listing_id, guest_id, rating, comment) VALUES (999, 43, 104, 5, 'Fake review');
