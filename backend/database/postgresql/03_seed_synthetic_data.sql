-- =============================================================================
-- ROOMIA PLATFORM — 100% SYNTHETIC SEED DATA FOR POSTGRESQL 16 (CAL-019)
-- =============================================================================

SET LOCAL roomia.microservice = 'identity-service';
SET LOCAL roomia.ip_anonymized = '192.168.10.XXX';

INSERT INTO users (id, uuid, name, email, password_hash, role, failed_login_attempts)
VALUES
    (1, '11111111-1111-4111-8111-111111111111', 'Host Sintético Uno', 'host1@roomia.synthetic.test', '$argon2id$v=19$m=65536,t=4,p=2$c2FsdHluZXRURVNUXzE$8f2d7c9e1a3b5d7f9a0b1c2d3e4f5a6b7c8d9e0f1a2', 'HOST', 0),
    (104, '22222222-2222-4222-8222-222222222104', 'Huésped Sintético 104', 'guest104@roomia.synthetic.test', '$argon2id$v=19$m=65536,t=4,p=2$c2FsdHluZXRURVNUXzI$9a3b5d7f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6', 'GUEST', 0),
    (999, '99999999-9999-4999-8999-999999999999', 'Auditor de Sistemas Roomia', 'auditor@roomia.synthetic.test', '$argon2id$v=19$m=65536,t=4,p=2$c2FsdHluZXRURVNUXzM$7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8', 'ADMIN', 0);

SELECT setval('users_id_seq', 1000, true);

SET LOCAL roomia.microservice = 'catalog-service';

INSERT INTO listings (id, uuid, host_id, title, description, city, latitude, longitude, price_per_night, max_guests, cancellation_policy, status)
VALUES
    (42, '42424242-4242-4242-8242-424242424242', 1, 'Modern Mountain Loft in Toluca', 'Alojamiento sintético de prueba con vista al Nevado de Toluca.', 'Toluca', 19.2826000, -99.6557000, 1500.00, 4, 'MODERATE', 'ACTIVE'),
    (43, '43434343-4343-4343-8343-434343434343', 1, 'Colonial Suite Metepec Centro', 'Suite céntrica equipada para trabajo remoto.', 'Metepec', 19.2519000, -99.6046000, 1200.00, 2, 'FLEXIBLE', 'ACTIVE');

SELECT setval('listings_id_seq', 100, true);

INSERT INTO listing_photos (listing_id, s3_url, alt_text, mime_type, file_size_kb, sort_order)
VALUES
    (42, 'https://s3.us-east-1.amazonaws.com/roomia-listings-media/loft_toluca_1.webp', 'Vista principal de la sala del loft en Toluca', 'image/webp', 420, 1),
    (42, 'https://s3.us-east-1.amazonaws.com/roomia-listings-media/loft_toluca_2.webp', 'Recámara principal con iluminación natural', 'image/webp', 385, 2);

INSERT INTO amenities (id, code, name)
VALUES
    (1, 'WIFI_HIGH_SPEED', 'Wi-Fi de Alta Velocidad (300 Mbps)'),
    (2, 'FREE_PARKING', 'Estacionamiento Privado Gratuito'),
    (3, ' DEDICATED_WORKSPACE', 'Espacio de Trabajo Dedicado');

INSERT INTO listing_amenity (listing_id, amenity_id)
VALUES (42, 1), (42, 2), (43, 1);

SET LOCAL roomia.microservice = 'booking-payment-service';

-- Completed stay booking (#1) and active confirmed booking (#2)
INSERT INTO bookings (
    id, uuid, listing_id, guest_id, check_in, check_out, guests_count,
    nightly_rate, subtotal_amount, service_fee, tax_amount, total_amount, status, integrity_sha256
) VALUES (
    1,
    'b0000001-0001-4001-8001-000000000001',
    42,
    104,
    '2026-10-01',
    '2026-10-04',
    2,
    1500.00,
    4500.00,
    540.00,
    720.00,
    5760.00,
    'COMPLETED',
    encode(digest('b0000001-0001-4001-8001-000000000001|42|104|5760.00', 'sha256'), 'hex')
);

SELECT setval('bookings_id_seq', 10, true);

INSERT INTO booking_dates (listing_id, booking_id, stay_date, lock_status)
VALUES
    (42, 1, '2026-10-01', 'LOCKED'),
    (42, 1, '2026-10-02', 'LOCKED'),
    (42, 1, '2026-10-03', 'LOCKED');

INSERT INTO payments (uuid, booking_id, stripe_payment_intent_id, stripe_charge_id, amount, platform_commission, currency, status, webhook_verified_at)
VALUES (
    'c0000001-0001-4001-8001-000000000001',
    1,
    'pi_3Q9SyntheticRoomia0001',
    'ch_3Q9SyntheticRoomia0001',
    5760.00,
    540.00,
    'MXN',
    'COMPLETED',
    clock_timestamp()
);

SET LOCAL roomia.microservice = 'review-service';

INSERT INTO reviews (booking_id, listing_id, guest_id, rating, comment)
VALUES (1, 42, 104, 5, 'Excelente estancia verificada en Toluca, todo impecable.');
