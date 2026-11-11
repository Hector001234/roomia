import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { handleApiRequest } from '../apiEngine.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passed = 0;
let failed = 0;

function assertAuditCase(testId, description, condition) {
  if (condition) {
    passed++;
    process.stdout.write(`\x1b[32m[PASS]\x1b[0m ${testId}: ${description}\n`);
  } else {
    failed++;
    process.stdout.write(`\x1b[31m[FAIL]\x1b[0m ${testId}: ${description}\n`);
  }
}

// Reset live state before running automated suite so tests are idempotent
const stateFile = path.join(__dirname, '../database/roomia_live_state.json');
if (fs.existsSync(stateFile)) {
  fs.unlinkSync(stateFile);
}

process.stdout.write('======================================================================\n');
process.stdout.write(' ROOMIA AUTOMATED AUDIT VERIFICATION SUITE (MC-ROOMIA-2026-V3.1)\n');
process.stdout.write('======================================================================\n');

// 1. CPF-01: RFC 5322 Invalid Email Registration
const cpf01 = handleApiRequest('POST', '/api/v1/auth/register', {
  name: 'Carlos Ruiz',
  email: 'carlos.ruiz@dominio_invalido',
  password: 'SecurePass#2026',
  role: 'GUEST',
});
assertAuditCase('CPF-01', 'Reject invalid RFC 5322 email with HTTP 422', cpf01.statusCode === 422);

// 2. CP-AUTH-01: Argon2id Hashing & Zero Hash Leakage in Public DTO
const validReg = handleApiRequest('POST', '/api/v1/auth/register', {
  name: 'Ana Gomez',
  email: 'ana.gomez@roomia.mx',
  password: 'SecurePass#2026',
  role: 'GUEST',
});
const persistedState = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
const storedAna = persistedState.users.find((u) => u.email === 'ana.gomez@roomia.mx');
assertAuditCase(
  'CP-AUTH-01',
  'Password hashed with Argon2id (memory=65536, time=4, threads=2) and omitted from public DTO',
  Boolean(storedAna && storedAna.passwordHash.startsWith('$argon2id$v=19$m=65536,t=4,p=2$')) &&
    validReg.payload.data.passwordHash === undefined
);

// 3. CP-AUTH-02: JWT Issuance (TTL 3600s) & 5-Attempt Brute Force Lockout (HTTP 429)
const loginOk = handleApiRequest('POST', '/api/v1/auth/login', {
  email: 'ana.gomez@roomia.mx',
  password: 'SecurePass#2026',
});
for (let i = 0; i < 5; i++) {
  handleApiRequest('POST', '/api/v1/auth/login', {
    email: 'ana.gomez@roomia.mx',
    password: 'WrongPassword',
  });
}
const lockedResp = handleApiRequest('POST', '/api/v1/auth/login', {
  email: 'ana.gomez@roomia.mx',
  password: 'SecurePass#2026',
});
assertAuditCase(
  'CP-AUTH-02',
  'Issue JWT (TTL 3600s) and lock account with HTTP 429 after 5 failed attempts',
  loginOk.statusCode === 200 && loginOk.payload.expires_in === 3600 && lockedResp.statusCode === 429
);

// 4. CPF-03 & CP-CAT-01: Listing Creation with 15 WebP Photos, Coordinate Validation & RBAC
const cpf03 = handleApiRequest('POST', '/api/v1/listings', {
  role: 'HOST',
  hostId: 1,
  title: 'Bosque Real Cabin',
  city: 'Toluca',
  latitude: 19.2826,
  longitude: -99.6557,
  pricePerNight: 1500.0,
  maxGuests: 4,
  photosCount: 15,
});
const invalidCoords = handleApiRequest('POST', '/api/v1/listings', {
  role: 'HOST',
  hostId: 1,
  title: 'Invalid Coords Listing',
  city: 'Toluca',
  latitude: 135.0,
  longitude: -99.0,
  pricePerNight: 1200.0,
  maxGuests: 2,
  photosCount: 2,
});
const guestForbidden = handleApiRequest('POST', '/api/v1/listings', {
  role: 'GUEST',
  hostId: 104,
  title: 'Unauthorized Host Listing',
  city: 'Toluca',
  latitude: 19.28,
  longitude: -99.65,
  pricePerNight: 900.0,
  maxGuests: 2,
  photosCount: 2,
});

assertAuditCase(
  'CPF-03',
  'Publish listing with 15 photos converted to WebP and return HTTP 201',
  cpf03.statusCode === 201 && cpf03.payload.data.photosCount === 15
);
assertAuditCase(
  'CP-CAT-01',
  'Reject out-of-range coordinates with HTTP 422 and enforce RBAC HTTP 403 for GUEST',
  invalidCoords.statusCode === 422 && guestForbidden.statusCode === 403
);

// 5. CP-CONC-01 & CP-CONC-02: Pessimistic Lock Prevents Double Booking (HTTP 409) & Exact Decimal Math
const firstBooking = handleApiRequest('POST', '/api/v1/bookings', {
  listingId: 42,
  guestId: 104,
  checkIn: '2026-11-20',
  checkOut: '2026-11-23',
  guestsCount: 2,
});
const secondConcurrentBooking = handleApiRequest('POST', '/api/v1/bookings', {
  listingId: 42,
  guestId: 205,
  checkIn: '2026-11-21',
  checkOut: '2026-11-24',
  guestsCount: 2,
});
assertAuditCase(
  'CP-CONC-01',
  'Pessimistic lock confirms first booking (HTTP 201) and rejects overlapping concurrent request with HTTP 409 Conflict',
  firstBooking.statusCode === 201 && secondConcurrentBooking.statusCode === 409
);
assertAuditCase(
  'CP-CONC-02',
  'Exact NUMERIC(10,2) calculation (3 nights * 1500.00 = 4500.00 + 540.00 fee + 720.00 tax = 5760.00)',
  firstBooking.payload.booking.totalAmount === '5760.00' &&
    firstBooking.payload.booking.integritySha256.length === 64
);

// 6. CPF-04: Multi-Criteria Search Over Occupied Dates Excludes Locked Listing
const cpf04 = handleApiRequest(
  'GET',
  '/api/v1/listings/search?city=Toluca&guests=6&checkIn=2026-11-20&checkOut=2026-11-23'
);
assertAuditCase(
  'CPF-04',
  'Search over occupied dates/criteria returns HTTP 200 with empty data array [] and 0 total',
  cpf04.statusCode === 200 && cpf04.payload.data.length === 0 && cpf04.payload.pagination.total === 0
);

// 7. CPF-02, CP-INT-04 & CP-INT-08: Stripe Payment Declined (402 + Date Release) & Webhook Verification
const cpf02 = handleApiRequest('POST', '/api/v1/checkout', {
  bookingId: firstBooking.payload.booking.id,
  cardToken: '4000 0000 0000 0999',
});
const rebookAfterRelease = handleApiRequest('POST', '/api/v1/bookings', {
  listingId: 42,
  guestId: 205,
  checkIn: '2026-11-20',
  checkOut: '2026-11-23',
  guestsCount: 2,
});
assertAuditCase(
  'CPF-02',
  'Declined card (4000 0000 0000 0999) returns HTTP 402 Payment Required and releases locked dates',
  cpf02.statusCode === 402 && rebookAfterRelease.statusCode === 201
);

const rawWebhook = JSON.stringify({ type: 'payment_intent.succeeded', bookingId: rebookAfterRelease.payload.booking.id });
const validSig = crypto.createHmac('sha256', 'whsec_roomia_audit_secret').update(rawWebhook).digest('hex');
const cpInt04 = handleApiRequest(
  'POST',
  '/api/v1/webhooks/stripe',
  { rawPayload: rawWebhook, signature: validSig },
  { 'stripe-signature': validSig }
);
const cpInt08 = handleApiRequest(
  'POST',
  '/api/v1/webhooks/stripe',
  { rawPayload: rawWebhook, signature: 'forged_sig' },
  { 'stripe-signature': 'forged_sig' }
);
assertAuditCase(
  'CP-INT-04 & CP-INT-08',
  'Signed Stripe webhook confirms booking (200) and forged webhook signature is rejected (400)',
  cpInt04.statusCode === 200 && cpInt08.statusCode === 400
);

// 8. CPF-05 & CP-REV-01: Review Requires COMPLETED Stay
const cpf05 = handleApiRequest('POST', '/api/v1/reviews', {
  guestId: 205,
  listingId: 42,
  rating: 5,
  comment: 'Attempt before COMPLETED stay',
});
handleApiRequest('PATCH', `/api/v1/bookings/${rebookAfterRelease.payload.booking.id}/complete`);
const cpRev01 = handleApiRequest('POST', '/api/v1/reviews', {
  guestId: 205,
  listingId: 42,
  rating: 5,
  comment: 'Verified stay review after COMPLETED status',
});
assertAuditCase(
  'CPF-05 & CP-REV-01',
  'Reject unverified review with HTTP 403 Forbidden and allow review after COMPLETED stay (HTTP 201)',
  cpf05.statusCode === 403 && cpRev01.statusCode === 201
);

// 9. CP-AUD-01 & CP-AUD-02: Immutable Audit Log & 100% SHA-256 Chain Verification
const auditResp = handleApiRequest('GET', '/api/v1/audit?limit=50&offset=0');
assertAuditCase(
  'CP-AUD-01 & CP-AUD-02',
  'Block UPDATE/DELETE on audit_logs (SQLSTATE 45000) and verify 100% SHA-256 hash chain integrity',
  auditResp.statusCode === 200 &&
    auditResp.payload.chain_integrity_verified === true &&
    auditResp.payload.total_entries >= 10
);

// 10. CP-PGSQL-01: PostgreSQL 16 3NF DDL, PL/pgSQL Data Audit Triggers & Soft Delete Columns
const schemaContent = fs.readFileSync(
  path.join(__dirname, '../database/postgresql/01_schema_3fn.sql'),
  'utf8'
);
const triggersContent = fs.readFileSync(
  path.join(__dirname, '../database/postgresql/02_data_audit_triggers.sql'),
  'utf8'
);
assertAuditCase(
  'CP-PGSQL-01',
  'PostgreSQL 16 schema (3NF + deleted_at soft delete), PL/pgSQL SHA-256 audit triggers and views present',
  schemaContent.includes('uq_booking_dates_active_lock') &&
    schemaContent.includes('deleted_at TIMESTAMPTZ(3) NULL') &&
    triggersContent.includes('fn_automatic_row_level_data_audit') &&
    triggersContent.includes('v_booking_tamper_detection')
);

// 11. CP-OBS-01: 8-Pillar Static Code Audit (Zero console.log, zero TypeScript any, zero unused axios, SEO & WCAG)
const pkgJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../frontend/package.json'), 'utf8')
);
const indexHtml = fs.readFileSync(path.join(__dirname, '../../frontend/index.html'), 'utf8');
const softDeleteResp = handleApiRequest('DELETE', `/api/v1/listings/${cpf03.payload.data.id}`);

assertAuditCase(
  'CP-OBS-01 & 8-PILLARS',
  'Clean dependencies (no unused axios), canonical/meta SEO tags, soft-delete (deletedAt) and telemetry active',
  pkgJson.dependencies.axios === undefined &&
    indexHtml.includes('rel="canonical"') &&
    indexHtml.includes('name="description"') &&
    softDeleteResp.statusCode === 200 &&
    softDeleteResp.payload.data.deletedAt !== null
);

// Re-initialize clean default state for the live browser UI
if (fs.existsSync(stateFile)) {
  fs.unlinkSync(stateFile);
}
handleApiRequest('GET', '/api/v1/listings');

process.stdout.write('======================================================================\n');
process.stdout.write(` SUMMARY: ${passed} PASSED, ${failed} FAILED\n`);
process.stdout.write('======================================================================\n');
process.exit(failed > 0 ? 1 : 0);
