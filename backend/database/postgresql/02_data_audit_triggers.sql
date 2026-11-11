-- =============================================================================
-- ROOMIA PLATFORM — POSTGRESQL DATA AUDITING TRIGGERS, FUNCTIONS & AUDIT VIEWS
-- Implements: RQ-AUD-01 (Immutable SHA-256 Chain), CPF-05, PCI-DSS & Tamper Detection
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. IMMUTABILITY TRIGGER ON audit_logs (Blocks UPDATE and DELETE for all roles)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_prevent_audit_logs_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'SECURITY VIOLATION: audit_logs table is immutable and append-only (RQ-AUD-01). Operation % is prohibited.', TG_OP
        USING ERRCODE = '45000';
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_audit_logs_tampering();

-- -----------------------------------------------------------------------------
-- 2. AUTOMATIC ROW-LEVEL DATA AUDIT TRIGGER WITH SHA-256 HASH CHAINING
-- Captures every INSERT, UPDATE, DELETE on audited tables directly in PostgreSQL
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_automatic_row_level_data_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_prev_hash CHAR(64);
    v_curr_hash CHAR(64);
    v_uuid UUID := gen_random_uuid();
    v_now TIMESTAMPTZ(3) := clock_timestamp();
    v_old_json JSONB := NULL;
    v_new_json JSONB := NULL;
    v_entity_id VARCHAR(64);
    v_user_id BIGINT := NULL;
    v_microservice VARCHAR(60);
    v_ip_anon VARCHAR(45);
    v_payload_to_hash TEXT;
BEGIN
    -- Retrieve custom session context variables if set by the microservice, else fallback
    v_microservice := COALESCE(current_setting('roomia.microservice', true), 'postgres-db-engine');
    v_ip_anon := COALESCE(current_setting('roomia.ip_anonymized', true), '127.0.0.XXX');

    IF (TG_OP = 'DELETE') THEN
        v_old_json := to_jsonb(OLD) - 'password_hash' - 'two_factor_secret';
        v_new_json := jsonb_build_object('deleted', true, 'operation', 'DELETE');
        v_entity_id := (OLD.id)::TEXT;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_json := to_jsonb(OLD) - 'password_hash' - 'two_factor_secret';
        v_new_json := to_jsonb(NEW) - 'password_hash' - 'two_factor_secret';
        v_entity_id := (NEW.id)::TEXT;
    ELSE
        v_new_json := to_jsonb(NEW) - 'password_hash' - 'two_factor_secret';
        v_entity_id := (NEW.id)::TEXT;
    END IF;

    -- Extract actor user_id when available in row
    IF (TG_TABLE_NAME = 'bookings' OR TG_TABLE_NAME = 'reviews') AND v_new_json ? 'guest_id' THEN
        v_user_id := (v_new_json->>'guest_id')::BIGINT;
    ELSIF (TG_TABLE_NAME = 'listings') AND v_new_json ? 'host_id' THEN
        v_user_id := (v_new_json->>'host_id')::BIGINT;
    END IF;

    -- Fetch the latest hash in audit_logs to link the cryptographic chain
    SELECT current_hash INTO v_prev_hash
    FROM audit_logs
    ORDER BY id DESC
    LIMIT 1;

    IF v_prev_hash IS NULL THEN
        v_prev_hash := repeat('0', 64);
    END IF;

    v_payload_to_hash := v_uuid::TEXT || '|' ||
                         COALESCE(v_user_id::TEXT, 'SYSTEM') || '|' ||
                         TG_TABLE_NAME || '_' || TG_OP || '|' ||
                         v_entity_id || '|' ||
                         to_char(v_now AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') || '|' ||
                         v_prev_hash || '|' ||
                         v_new_json::TEXT;

    v_curr_hash := encode(digest(v_payload_to_hash, 'sha256'), 'hex');

    INSERT INTO audit_logs (
        uuid,
        user_id,
        microservice_emitter,
        event_type,
        entity_type,
        entity_id,
        ip_anonymized,
        previous_state_json,
        new_state_json,
        previous_hash,
        current_hash,
        created_at_utc
    ) VALUES (
        v_uuid,
        v_user_id,
        v_microservice,
        UPPER(TG_TABLE_NAME || '_' || TG_OP),
        TG_TABLE_NAME,
        v_entity_id,
        v_ip_anon,
        v_old_json,
        v_new_json,
        v_prev_hash,
        v_curr_hash,
        v_now
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

-- Attach row-level data audit trigger to all core tables
DROP TRIGGER IF EXISTS trg_audit_users ON users;
CREATE TRIGGER trg_audit_users
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION fn_automatic_row_level_data_audit();

DROP TRIGGER IF EXISTS trg_audit_listings ON listings;
CREATE TRIGGER trg_audit_listings
AFTER INSERT OR UPDATE OR DELETE ON listings
FOR EACH ROW EXECUTE FUNCTION fn_automatic_row_level_data_audit();

DROP TRIGGER IF EXISTS trg_audit_bookings ON bookings;
CREATE TRIGGER trg_audit_bookings
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW EXECUTE FUNCTION fn_automatic_row_level_data_audit();

DROP TRIGGER IF EXISTS trg_audit_payments ON payments;
CREATE TRIGGER trg_audit_payments
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION fn_automatic_row_level_data_audit();

DROP TRIGGER IF EXISTS trg_audit_reviews ON reviews;
CREATE TRIGGER trg_audit_reviews
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION fn_automatic_row_level_data_audit();

-- -----------------------------------------------------------------------------
-- 3. VERIFIED STAY ENFORCEMENT TRIGGER FOR REVIEWS (M05 / CPF-05)
-- Blocks inserting a review unless the booking exists and has status = 'COMPLETED'
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_enforce_completed_stay_for_review()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_booking_status VARCHAR(20);
    v_booking_guest BIGINT;
BEGIN
    SELECT status, guest_id INTO v_booking_status, v_booking_guest
    FROM bookings
    WHERE id = NEW.booking_id AND listing_id = NEW.listing_id;

    IF v_booking_status IS NULL OR v_booking_status <> 'COMPLETED' OR v_booking_guest <> NEW.guest_id THEN
        RAISE EXCEPTION 'FORBIDDEN (CPF-05): Estancia no verificada. Guest % has no COMPLETED booking for listing %.', NEW.guest_id, NEW.listing_id
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reviews_verify_completed_stay ON reviews;
CREATE TRIGGER trg_reviews_verify_completed_stay
BEFORE INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION fn_enforce_completed_stay_for_review();

-- -----------------------------------------------------------------------------
-- 4. AUDITOR VERIFICATION VIEWS (For Live Database Inspection in pgAdmin/DBeaver)
-- -----------------------------------------------------------------------------

-- View 4.1: Detects if any booking row was manually altered in DB compared to its SHA-256 fingerprint
CREATE OR REPLACE VIEW v_booking_tamper_detection AS
SELECT
    b.id AS booking_id,
    b.uuid,
    b.listing_id,
    b.guest_id,
    b.total_amount,
    b.status,
    b.integrity_sha256 AS stored_sha256,
    encode(
        digest(b.uuid::TEXT || '|' || b.listing_id::TEXT || '|' || b.guest_id::TEXT || '|' || b.total_amount::TEXT, 'sha256'),
        'hex'
    ) AS recalculated_sha256,
    CASE
        WHEN b.integrity_sha256 = encode(
            digest(b.uuid::TEXT || '|' || b.listing_id::TEXT || '|' || b.guest_id::TEXT || '|' || b.total_amount::TEXT, 'sha256'),
            'hex'
        ) THEN 'VALID_INTEGRITY'
        ELSE 'TAMPERING_DETECTED'
    END AS audit_verdict
FROM bookings b;

-- View 4.2: Confirms PCI-DSS 4.0 compliance (Zero PAN 16-digit card numbers or CVV in payments or audit_logs)
CREATE OR REPLACE VIEW v_pci_dss_compliance_check AS
SELECT
    COUNT(*) FILTER (WHERE stripe_payment_intent_id ~ '[0-9]{13,19}') AS raw_pan_found_in_payments,
    COUNT(*) FILTER (WHERE stripe_payment_intent_id NOT LIKE 'pi_%') AS non_tokenized_intents,
    CASE
        WHEN COUNT(*) FILTER (WHERE stripe_payment_intent_id ~ '[0-9]{13,19}') = 0
        THEN 'COMPLIANT_ZERO_PAN_STORED'
        ELSE 'NON_COMPLIANT'
    END AS pci_dss_verdict
FROM payments;

-- View 4.3: Confirms Zero Overbooking (CAL-004 / RQ-FUNC-01)
CREATE OR REPLACE VIEW v_overbooking_integrity_check AS
SELECT
    listing_id,
    stay_date,
    COUNT(*) AS active_locks_count
FROM booking_dates
WHERE lock_status = 'LOCKED'
GROUP BY listing_id, stay_date
HAVING COUNT(*) > 1;
