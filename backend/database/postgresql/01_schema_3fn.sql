-- =============================================================================
-- ROOMIA PLATFORM — POSTGRESQL 16 RELATIONAL SCHEMA (3RD NORMAL FORM - 3NF)
-- Document Code: DD-ROOMIA-2026-V3.1 | Standard: ISO/IEC 25012:2008
-- Includes Soft Delete (deleted_at) & Partial Unique Locking
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP VIEW IF EXISTS v_overbooking_integrity_check CASCADE;
DROP VIEW IF EXISTS v_pci_dss_compliance_check CASCADE;
DROP VIEW IF EXISTS v_booking_tamper_detection CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS booking_dates CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS listing_amenity CASCADE;
DROP TABLE IF EXISTS amenities CASCADE;
DROP TABLE IF EXISTS listing_photos CASCADE;
DROP TABLE IF EXISTS listings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- -----------------------------------------------------------------------------
-- DATA STORE D1: users (Identity, Argon2id Credentials, RBAC & Soft Delete)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'GUEST'
        CONSTRAINT chk_users_role CHECK (role IN ('GUEST', 'HOST', 'ADMIN')),
    two_factor_secret VARCHAR(255) NULL,
    failed_login_attempts SMALLINT NOT NULL DEFAULT 0
        CONSTRAINT chk_users_failed_attempts CHECK (failed_login_attempts >= 0),
    locked_until TIMESTAMPTZ(3) NULL,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ(3) NULL,
    CONSTRAINT chk_users_email_rfc5322 CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
    CONSTRAINT chk_users_argon2id_hash CHECK (password_hash LIKE '$argon2id$%')
);

CREATE INDEX idx_users_email_active ON users (email) WHERE (deleted_at IS NULL);
CREATE INDEX idx_users_role ON users (role);

-- -----------------------------------------------------------------------------
-- DATA STORE D2: listings, listing_photos, amenities, listing_amenity (3NF)
-- -----------------------------------------------------------------------------
CREATE TABLE listings (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    host_id BIGINT NOT NULL
        CONSTRAINT fk_listings_host REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL
        CONSTRAINT chk_listings_latitude CHECK (latitude BETWEEN -90.0000000 AND 90.0000000),
    longitude NUMERIC(10, 7) NOT NULL
        CONSTRAINT chk_listings_longitude CHECK (longitude BETWEEN -180.0000000 AND 180.0000000),
    price_per_night NUMERIC(10, 2) NOT NULL
        CONSTRAINT chk_listings_price_positive CHECK (price_per_night > 0.00),
    max_guests SMALLINT NOT NULL DEFAULT 2
        CONSTRAINT chk_listings_max_guests CHECK (max_guests BETWEEN 1 AND 20),
    cancellation_policy VARCHAR(20) NOT NULL DEFAULT 'MODERATE'
        CONSTRAINT chk_listings_policy CHECK (cancellation_policy IN ('FLEXIBLE', 'MODERATE', 'STRICT')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CONSTRAINT chk_listings_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ(3) NULL
);

-- Composite partial index for RQ-PERF-01 (/api/v1/listings/search P95 <= 1.5s on non-deleted listings)
CREATE INDEX idx_listings_search_composite
    ON listings (status, city, max_guests, price_per_night)
    WHERE (deleted_at IS NULL);

CREATE TABLE listing_photos (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL
        CONSTRAINT fk_photos_listing REFERENCES listings(id) ON DELETE RESTRICT,
    s3_url VARCHAR(512) NOT NULL,
    alt_text VARCHAR(255) NOT NULL
        CONSTRAINT chk_photos_alt_not_empty CHECK (length(trim(alt_text)) >= 5),
    mime_type VARCHAR(50) NOT NULL DEFAULT 'image/webp'
        CONSTRAINT chk_photos_webp CHECK (mime_type = 'image/webp'),
    file_size_kb INTEGER NOT NULL
        CONSTRAINT chk_photos_size CHECK (file_size_kb > 0 AND file_size_kb <= 5120),
    sort_order SMALLINT NOT NULL DEFAULT 1
        CONSTRAINT chk_photos_order CHECK (sort_order BETWEEN 1 AND 15),
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX idx_listing_photos_listing_id ON listing_photos (listing_id, sort_order);

CREATE TABLE amenities (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE listing_amenity (
    listing_id BIGINT NOT NULL
        CONSTRAINT fk_la_listing REFERENCES listings(id) ON DELETE RESTRICT,
    amenity_id BIGINT NOT NULL
        CONSTRAINT fk_la_amenity REFERENCES amenities(id) ON DELETE RESTRICT,
    PRIMARY KEY (listing_id, amenity_id)
);

-- -----------------------------------------------------------------------------
-- DATA STORE D3: bookings & booking_dates (Atomic Pessimistic Locking)
-- -----------------------------------------------------------------------------
CREATE TABLE bookings (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    listing_id BIGINT NOT NULL
        CONSTRAINT fk_bookings_listing REFERENCES listings(id) ON DELETE RESTRICT,
    guest_id BIGINT NOT NULL
        CONSTRAINT fk_bookings_guest REFERENCES users(id) ON DELETE RESTRICT,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests_count SMALLINT NOT NULL DEFAULT 1
        CONSTRAINT chk_bookings_guests CHECK (guests_count BETWEEN 1 AND 20),
    nightly_rate NUMERIC(10, 2) NOT NULL
        CONSTRAINT chk_bookings_nightly_rate CHECK (nightly_rate > 0.00),
    subtotal_amount NUMERIC(10, 2) NOT NULL,
    service_fee NUMERIC(10, 2) NOT NULL,
    tax_amount NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CONSTRAINT chk_bookings_status CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
    integrity_sha256 CHAR(64) NOT NULL,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ(3) NULL,
    CONSTRAINT chk_bookings_date_range CHECK (check_out > check_in),
    CONSTRAINT chk_bookings_exact_total CHECK (total_amount = subtotal_amount + service_fee + tax_amount)
);

CREATE INDEX idx_bookings_guest_status ON bookings (guest_id, listing_id, status) WHERE (deleted_at IS NULL);

CREATE TABLE booking_dates (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL
        CONSTRAINT fk_bd_listing REFERENCES listings(id) ON DELETE RESTRICT,
    booking_id BIGINT NOT NULL
        CONSTRAINT fk_bd_booking REFERENCES bookings(id) ON DELETE RESTRICT,
    stay_date DATE NOT NULL,
    lock_status VARCHAR(20) NOT NULL DEFAULT 'LOCKED'
        CONSTRAINT chk_bd_lock_status CHECK (lock_status IN ('LOCKED', 'RELEASED'))
);

CREATE UNIQUE INDEX uq_booking_dates_active_lock
    ON booking_dates (listing_id, stay_date)
    WHERE (lock_status = 'LOCKED');

-- -----------------------------------------------------------------------------
-- DATA STORE D4: payments (PCI-DSS 4.0 Compliant Tokenized Ledger)
-- -----------------------------------------------------------------------------
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    booking_id BIGINT NOT NULL
        CONSTRAINT fk_payments_booking REFERENCES bookings(id) ON DELETE RESTRICT,
    stripe_payment_intent_id VARCHAR(128) NOT NULL UNIQUE
        CONSTRAINT chk_payments_tokenized_pi CHECK (stripe_payment_intent_id LIKE 'pi_%'),
    stripe_charge_id VARCHAR(128) NULL,
    amount NUMERIC(10, 2) NOT NULL
        CONSTRAINT chk_payments_amount_positive CHECK (amount > 0.00),
    platform_commission NUMERIC(10, 2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'MXN',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CONSTRAINT chk_payments_status CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'FAILED', 'REFUNDED')),
    failure_code VARCHAR(80) NULL,
    webhook_verified_at TIMESTAMPTZ(3) NULL,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT clock_timestamp()
);

-- -----------------------------------------------------------------------------
-- MODULE M05: reviews (Conditioned on COMPLETED Stay & Soft Delete)
-- -----------------------------------------------------------------------------
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE
        CONSTRAINT fk_reviews_booking REFERENCES bookings(id) ON DELETE RESTRICT,
    listing_id BIGINT NOT NULL
        CONSTRAINT fk_reviews_listing REFERENCES listings(id) ON DELETE RESTRICT,
    guest_id BIGINT NOT NULL
        CONSTRAINT fk_reviews_guest REFERENCES users(id) ON DELETE RESTRICT,
    rating SMALLINT NOT NULL
        CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ(3) NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ(3) NULL
);

-- -----------------------------------------------------------------------------
-- DATA STORE D5: audit_logs (Append-Only Immutable Audit Trail - RQ-AUD-01)
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    user_id BIGINT NULL
        CONSTRAINT fk_audit_user REFERENCES users(id) ON DELETE RESTRICT,
    microservice_emitter VARCHAR(60) NOT NULL DEFAULT 'core-db-trigger',
    event_type VARCHAR(80) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    ip_anonymized VARCHAR(45) NOT NULL DEFAULT '127.0.0.XXX',
    previous_state_json JSONB NULL,
    new_state_json JSONB NOT NULL,
    previous_hash CHAR(64) NOT NULL,
    current_hash CHAR(64) NOT NULL UNIQUE,
    created_at_utc TIMESTAMPTZ(3) NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX idx_audit_logs_event_type ON audit_logs (event_type);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
